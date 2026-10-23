"use server";

import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { ProductModel } from "@/models/product";
import { ProductImageModel } from "@/models/product-image";
import { uploadedImageId, uploadedImageUrl } from "@/lib/product-images";
import { hasRichContent, sanitizeRichText, uploadedImageIdsIn } from "@/lib/rich-text";
import { readVariants } from "@/lib/product-variants";
import { nextProductNo } from "@/lib/product-no";
import { products as homepageProducts } from "@/lib/products";
import {
  MAX_IMAGE_URL,
  MAX_PRICE,
  MAX_PRODUCT_DESCRIPTION,
  MAX_PRODUCT_NAME,
  MAX_PRODUCT_SUMMARY,
  MAX_PRODUCT_TAGS,
  MAX_GALLERY_IMAGES,
  MAX_STOCK,
  MAX_TAG_LENGTH,
  PRODUCT_CHANNELS,
  isValidImageUrl,
  parseTags,
  type ProductStatus,
  type PurchaseMode,
} from "@/lib/product-options";

export type ProductActionResult = { ok: boolean; message: string; id?: string };

function revalidateProducts() {
  revalidatePath("/admin/products", "layout");
  // 首頁的產品選物也要更新
  revalidatePath("/");
}

// 產品用到的所有上傳圖片：主圖＋詳細介紹裡的圖
function imageIdsOf(p: {
  imageUrl?: string | null;
  description?: string | null;
  gallery?: string[] | null;
  variants?: { imageUrl?: string | null }[] | null;
  customizer?: { baseImageUrl?: string | null; maskImageUrl?: string | null } | null;
}) {
  const ids = uploadedImageIdsIn(p.description);
  const urls = [
    p.imageUrl,
    ...(p.gallery ?? []),
    ...(p.variants ?? []).map((v) => v.imageUrl),
    p.customizer?.baseImageUrl,
    p.customizer?.maskImageUrl,
  ];
  for (const url of urls) {
    const id = uploadedImageId(url);
    if (id) ids.add(id);
  }
  return ids;
}


// 刪掉已經沒用到的上傳圖片（換圖、改文章或刪除產品時）；還有其他產品在用就保留
async function removeUnusedImages(ids: Iterable<string>) {
  for (const id of ids) {
    const url = uploadedImageUrl(id);
    const stillUsed = await ProductModel.exists({
      $or: [
        { imageUrl: url },
        { gallery: url },
        { description: { $regex: url } },
        { "variants.imageUrl": url },
        { "customizer.baseImageUrl": url },
        { "customizer.maskImageUrl": url },
      ],
    });
    if (!stillUsed) await ProductImageModel.findByIdAndDelete(id);
  }
}

// 選了「到蝦皮購買」但還沒填連結：照樣存檔，提醒之後補上
function savedMessage(base: string, mode: PurchaseMode, shopeeUrl: string) {
  return mode === "shopee" && !shopeeUrl ? `${base}提醒：還沒有填蝦皮商品連結，產品頁的「前往蝦皮購買」會先無法點。` : base;
}

function readInt(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  const value = Number(raw);
  return raw !== "" && Number.isInteger(value) ? value : null;
}

// 新增或修改產品：有 id 就是修改
export async function saveProduct(
  _prev: ProductActionResult | null,
  formData: FormData,
): Promise<ProductActionResult> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const rawDescription = String(formData.get("description") ?? "");
  // 編輯器的 HTML 先清乾淨；只有空段落就當作沒有內容
  const description = hasRichContent(rawDescription) ? sanitizeRichText(rawDescription) : "";
  const tags = parseTags(String(formData.get("tags") ?? ""));
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const price = readInt(formData, "price");
  const originalPrice = readInt(formData, "originalPrice") ?? 0;
  const gallery = formData.getAll("gallery").map((v) => String(v).trim()).filter(Boolean);
  const { variants, error: variantError } = readVariants(formData);
  // 有分顏色時，總庫存自動用各顏色加總
  const stock = variants.length > 0 ? variants.reduce((sum, v) => sum + v.stock, 0) : readInt(formData, "stock");
  const sortOrder = readInt(formData, "sortOrder") ?? 0;
  const status: ProductStatus = formData.get("status") === "published" ? "published" : "draft";
  const selected = formData.getAll("channels").map(String);
  const channels = PRODUCT_CHANNELS.map((c) => c.value).filter((v) => selected.includes(v));
  const shopeeUrl = channels.includes("shopee") ? String(formData.get("shopeeUrl") ?? "").trim() : "";
  // 沒勾蝦皮就一定是在官網購買
  const purchaseMode: PurchaseMode =
    channels.includes("shopee") && formData.get("purchaseMode") === "shopee" ? "shopee" : "website";

  if (!name || name.length > MAX_PRODUCT_NAME) {
    return { ok: false, message: `請輸入產品名稱（最多 ${MAX_PRODUCT_NAME} 個字）。` };
  }
  if (summary.length > MAX_PRODUCT_SUMMARY) {
    return { ok: false, message: `一句話介紹最多 ${MAX_PRODUCT_SUMMARY} 個字。` };
  }
  if (description.length > MAX_PRODUCT_DESCRIPTION) {
    return { ok: false, message: "詳細介紹太長了，請刪減一些內容。" };
  }
  if (tags.length > MAX_PRODUCT_TAGS || tags.some((t) => t.length > MAX_TAG_LENGTH)) {
    return { ok: false, message: `標籤最多 ${MAX_PRODUCT_TAGS} 個，每個最多 ${MAX_TAG_LENGTH} 個字。` };
  }
  if (price === null || price < 0 || price > MAX_PRICE) {
    return { ok: false, message: "請輸入正確的價格（整數，新台幣）。" };
  }
  if (variantError) return { ok: false, message: variantError };
  if (originalPrice < 0 || originalPrice > MAX_PRICE) return { ok: false, message: "請輸入正確的原價（整數，新台幣）。" };
  if (gallery.length > MAX_GALLERY_IMAGES) return { ok: false, message: `更多產品照片最多 ${MAX_GALLERY_IMAGES} 張。` };
  if (gallery.some((url) => url.length > MAX_IMAGE_URL || !isValidImageUrl(url))) {
    return { ok: false, message: "產品照片的網址要以 / 或 https:// 開頭。" };
  }

  const customizer = {
    enabled: formData.get("customizerEnabled") === "on",
    baseImageUrl: String(formData.get("customizerBase") ?? "").trim(),
    maskImageUrl: String(formData.get("customizerMask") ?? "").trim(),
  };
  for (const url of [customizer.baseImageUrl, customizer.maskImageUrl]) {
    if (url && (url.length > MAX_IMAGE_URL || !isValidImageUrl(url))) {
      return { ok: false, message: "客製化預覽的圖片網址要以 / 或 https:// 開頭。" };
    }
  }
  if (customizer.enabled && (!customizer.baseImageUrl || !customizer.maskImageUrl)) {
    return { ok: false, message: "開啟客製化顏色預覽前，請先上傳底圖和上色區域遮罩。" };
  }
  if (stock === null || stock < 0 || stock > MAX_STOCK) {
    return { ok: false, message: "請輸入正確的庫存數量（整數）。" };
  }
  if (imageUrl && (imageUrl.length > MAX_IMAGE_URL || !isValidImageUrl(imageUrl))) {
    return { ok: false, message: "圖片網址要以 / 或 https:// 開頭。" };
  }
  if (channels.length === 0) return { ok: false, message: "請至少選一個販售通路。" };
  if (shopeeUrl && (shopeeUrl.length > MAX_IMAGE_URL || !shopeeUrl.startsWith("https://"))) {
    return { ok: false, message: "蝦皮商品連結要以 https:// 開頭。" };
  }

  const data = {
    name,
    summary,
    description,
    tags,
    price,
    originalPrice,
    stock,
    variants,
    gallery,
    customizer,
    imageUrl,
    channels,
    shopeeUrl,
    purchaseMode,
    sortOrder,
    status,
    updatedBy: admin.nickname,
  };

  if (id) {
    if (!isValidObjectId(id)) return { ok: false, message: "資料編號不正確。" };
    const product = await ProductModel.findById(id);
    if (!product) return { ok: false, message: "找不到這個產品，可能已被刪除。" };
    // 第一次上架時記錄時間
    if (status === "published" && !product.publishedAt) product.publishedAt = new Date();
    const before = imageIdsOf(product);
    product.set(data);
    await product.save();
    const after = imageIdsOf(product);
    await removeUnusedImages([...before].filter((imageId) => !after.has(imageId)));
    revalidateProducts();
    return { ok: true, message: savedMessage("已儲存。", purchaseMode, shopeeUrl), id };
  }

  const created = await ProductModel.create({
    ...data,
    productNo: await nextProductNo(),
    publishedAt: status === "published" ? new Date() : undefined,
  });
  revalidateProducts();
  return { ok: true, message: savedMessage("已新增產品。", purchaseMode, shopeeUrl), id: created._id.toString() };
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!isValidObjectId(id)) throw new Error("資料編號不正確。");
  const deleted = await ProductModel.findByIdAndDelete(id);
  if (deleted) await removeUnusedImages(imageIdsOf(deleted));
  revalidateProducts();
  // 在編輯頁刪除後回到列表，不要停在已不存在的頁面
  redirect("/admin/products");
}

// 把首頁原本寫死的產品匯入成草稿，只在還沒有任何產品時可以用
export async function importHomepageProducts() {
  const admin = await requireAdmin();
  if ((await ProductModel.countDocuments()) > 0) return;

  const real = homepageProducts.filter((p) => p.name !== "更多生活科技");
  const numbers: string[] = [];
  for (let i = 0; i < real.length; i++) numbers.push(await nextProductNo());
  await ProductModel.insertMany(
    real.map((p, i) => ({
      productNo: numbers[i],
      name: p.name,
      summary: p.desc,
      tags: p.tags,
      price: 0,
      stock: 0,
      imageUrl: p.photo,
      sortOrder: i + 1,
      status: "draft" as const,
      updatedBy: admin.nickname,
    })),
  );
  revalidateProducts();
}

// 預覽用：把編輯器的內容用和存檔時一樣的方式清過，預覽看到的就是存檔後的樣子（不會存檔）
export async function previewArticle(html: string): Promise<string> {
  await requireAdmin();
  return hasRichContent(html) ? sanitizeRichText(html) : "";
}
