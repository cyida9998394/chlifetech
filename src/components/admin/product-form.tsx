"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useRef, useState } from "react";
import { previewArticle, saveProduct, type ProductActionResult } from "@/app/admin/products/actions";
import ProductPreview from "@/components/admin/product-preview";
import type { ProductViewData } from "@/components/product-view";
import {
  MAX_IMAGE_URL,
  MAX_PRICE,
  MAX_PRODUCT_NAME,
  MAX_PRODUCT_SUMMARY,
  MAX_PRODUCT_TAGS,
  MAX_STOCK,
  PRODUCT_CHANNELS,
  PRODUCT_STATUSES,
  PURCHASE_MODES,
  type ProductCustomizer,
  type ProductVariant,
  isValidImageUrl,
  parseTags,
} from "@/lib/product-options";
import { IMAGE_ACCEPT } from "@/lib/product-images";
import { uploadProductImage } from "@/lib/upload-image";
import RichTextEditor from "@/components/admin/rich-text-editor";
import VariantEditor from "@/components/admin/variant-editor";
import GalleryEditor from "@/components/admin/gallery-editor";
import CustomizerEditor from "@/components/admin/customizer-editor";

const inputClass =
  "rounded-xl border border-line bg-white px-4 py-2.5 text-ink outline-none transition-colors focus:border-brand";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium text-ink/80";
const hintClass = "text-xs font-normal text-ink/50";

export type ProductFormValues = {
  id?: string;
  productNo?: string;
  name: string;
  summary: string;
  description: string;
  tags: string[];
  price: number;
  originalPrice: number;
  stock: number;
  variants: ProductVariant[];
  gallery: string[];
  customizer?: ProductCustomizer;
  imageUrl: string;
  channels: string[];
  shopeeUrl: string;
  purchaseMode: string;
  sortOrder: number;
  status: string;
};

export default function ProductForm({ initial }: { initial?: ProductFormValues }) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [tags, setTags] = useState((initial?.tags ?? []).join("、"));
  // 新產品預設只在官網販售
  const [channels, setChannels] = useState<string[]>(initial?.channels ?? ["website"]);
  const onShopee = channels.includes("shopee");
  const [purchaseMode, setPurchaseMode] = useState(initial?.purchaseMode === "shopee" ? "shopee" : "website");
  const [variants, setVariants] = useState<ProductVariant[]>(initial?.variants ?? []);
  const variantStock = variants.reduce((sum, v) => sum + v.stock, 0);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // 選好檔案就直接上傳，成功後把網址填進「圖片網址」
  async function upload(file: File) {
    setUploadError("");
    setUploading(true);
    const result = await uploadProductImage(file);
    if (result.url) setImageUrl(result.url);
    else setUploadError(result.error ?? "上傳失敗，請稍後再試。");
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<{ product: ProductViewData; notices: string[] } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (prev: ProductActionResult | null, formData: FormData) => {
      const result = await saveProduct(prev, formData);
      // 從預覽按儲存時，存完就關掉預覽（失敗的話也關掉，才看得到錯誤訊息）
      setPreview(null);
      // 新增成功後回到列表，修改則留在原頁
      if (result.ok && !initial?.id) router.push("/admin/products");
      return result;
    },
    null,
  );
  const tagCount = parseTags(tags).length;

  // 用表單目前的內容組出前台產品頁的資料（還沒存檔）
  async function openPreview() {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    const text = (key: string) => String(fd.get(key) ?? "").trim();
    const picked = fd.getAll("channels").map(String);
    let previewVariants: ProductViewData["variants"] = [];
    try {
      previewVariants = JSON.parse(text("variants") || "[]");
    } catch {
      previewVariants = [];
    }
    const base = text("customizerBase");
    const mask = text("customizerMask");
    const customizerOn = fd.get("customizerEnabled") === "on";
    const shopee = picked.includes("shopee") ? text("shopeeUrl") : "";

    const notices: string[] = [];
    if (fd.get("status") !== "published") notices.push("目前是「草稿」，儲存後前台還看不到，要改成「上架中」才會公開。");
    if (!picked.includes("website")) notices.push("沒有勾「官網」，儲存後這個產品不會出現在網站上。");
    const mode = picked.includes("shopee") && fd.get("purchaseMode") === "shopee" ? "shopee" : "website";
    if (picked.includes("shopee") && !shopee) {
      notices.push(
        mode === "shopee"
          ? "選了「到蝦皮購買」但還沒填蝦皮商品連結，「前往蝦皮購買」會先無法點。"
          : "勾了蝦皮但沒有填蝦皮商品連結，所以不會出現「前往蝦皮購買」連結。",
      );
    }
    if (customizerOn && (!base || !mask)) notices.push("「自訂顏色」需要底圖和遮罩都上傳才會顯示。");

    setPreviewLoading(true);
    try {
      const articleHtml = await previewArticle(text("description"));
      setPreview({
        product: {
          id: initial?.id ?? "preview",
          productNo: initial?.productNo ?? "",
          name: text("name"),
          summary: text("summary"),
          tags: parseTags(text("tags")),
          price: Number(text("price")) || 0,
          originalPrice: Number(text("originalPrice")) || 0,
          gallery: fd.getAll("gallery").map(String).filter(Boolean),
          // 有分顏色時沒有「庫存」欄位，各顏色的庫存在 variants 裡
          stock: Number(text("stock")) || 0,
          imageUrl: isValidImageUrl(text("imageUrl")) ? text("imageUrl") : "",
          variants: previewVariants.filter((v) => v.name),
          customizer: customizerOn && base && mask ? { baseUrl: base, maskUrl: mask } : null,
          shopeeUrl: shopee.startsWith("https://") ? shopee : null,
          purchaseMode: mode,
          articleHtml,
        },
        notices,
      });
    } catch {
      alert("預覽失敗，請稍後再試。");
    }
    setPreviewLoading(false);
  }
  const showPreview = imageUrl !== "" && isValidImageUrl(imageUrl);

  return (
    <form
      ref={formRef}
      // 不用 <form action>：React 送出後會自動重設表單
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="grid gap-6 lg:grid-cols-[1fr_300px]"
    >
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}

      <div className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-6 sm:p-8">
        <label className={labelClass}>
          產品名稱
          <input name="name" required maxLength={MAX_PRODUCT_NAME} defaultValue={initial?.name} className={inputClass} />
        </label>
        <label className={labelClass}>
          一句話介紹
          <input
            name="summary"
            maxLength={MAX_PRODUCT_SUMMARY}
            defaultValue={initial?.summary}
            placeholder="會顯示在首頁的產品卡片上"
            className={inputClass}
          />
        </label>
        {/* 編輯器不是表單欄位，所以用 div 包；內容放在 RichTextEditor 的隱藏欄位裡 */}
        <div className={labelClass}>
          <span>詳細介紹</span>
          <RichTextEditor
            name="description"
            initialHtml={initial?.description ?? ""}
            placeholder="像寫部落格一樣介紹產品：可以加標題、清單、多張圖片和 YouTube 影片"
          />
          <span className={hintClass}>會顯示在產品頁；圖片一次可以選多張</span>
        </div>
        <label className={labelClass}>
          標籤
          <input
            name="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="例如：AI語音、智慧導航"
            className={inputClass}
          />
          <span className={`${hintClass} ${tagCount > MAX_PRODUCT_TAGS ? "text-red-600" : ""}`}>
            用頓號或逗號分開，最多 {MAX_PRODUCT_TAGS} 個（目前 {tagCount} 個）
          </span>
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className={labelClass}>
            價格（新台幣）
            <input
              name="price"
              type="number"
              required
              min={0}
              max={MAX_PRICE}
              step={1}
              defaultValue={initial?.price ?? ""}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            原價（選填）
            <input
              name="originalPrice"
              type="number"
              min={0}
              max={MAX_PRICE}
              step={1}
              defaultValue={initial?.originalPrice || ""}
              placeholder="比價格高就會顯示特價"
              className={inputClass}
            />
          </label>
          {variants.length > 0 ? (
            // 有分顏色時，庫存由各顏色加總，這裡只顯示
            <div className={labelClass}>
              <span>庫存</span>
              <p className={`${inputClass} bg-mist tabular-nums text-ink/70`}>{variantStock.toLocaleString()}</p>
              <span className={hintClass}>各顏色庫存的總和</span>
            </div>
          ) : (
            <label className={labelClass}>
              庫存
              <input
                name="stock"
                type="number"
                required
                min={0}
                max={MAX_STOCK}
                step={1}
                defaultValue={initial?.stock ?? 0}
                className={inputClass}
              />
            </label>
          )}
        </div>
        <div className={labelClass}>
          <span>顏色</span>
          <VariantEditor name="variants" initial={initial?.variants ?? []} onChange={setVariants} />
        </div>
        <div className={`${labelClass} border-t border-line pt-5`}>
          <span>客製化顏色預覽</span>
          <CustomizerEditor initial={initial?.customizer} />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-ink/80">上架狀態</legend>
            {PRODUCT_STATUSES.map((s) => (
              <label key={s.value} className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="radio"
                  name="status"
                  value={s.value}
                  defaultChecked={(initial?.status ?? "draft") === s.value}
                  className="accent-brand-navy"
                />
                {s.label}
                <span className={hintClass}>{s.value === "published" ? "在勾選的通路販售" : "只有後台看得到"}</span>
              </label>
            ))}
          </fieldset>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-ink/80">販售通路</legend>
            {PRODUCT_CHANNELS.map((c) => (
              <label key={c.value} className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  name="channels"
                  value={c.value}
                  checked={channels.includes(c.value)}
                  onChange={(e) =>
                    setChannels((prev) =>
                      e.target.checked ? [...prev, c.value] : prev.filter((v) => v !== c.value),
                    )
                  }
                  className="accent-brand-navy"
                />
                {c.label}
                <span className={hintClass}>
                  {c.value === "website" ? "首頁顯示產品介紹" : "在蝦皮販售"}
                </span>
              </label>
            ))}
            {channels.length === 0 && <span className="text-xs text-red-600">請至少選一個通路</span>}
            {onShopee && (
              <label className={`${labelClass} mt-1`}>
                蝦皮商品連結
                <input
                  name="shopeeUrl"
                  type="url"
                  maxLength={MAX_IMAGE_URL}
                  defaultValue={initial?.shopeeUrl}
                  placeholder="https://shopee.tw/..."
                  className={inputClass}
                />
                <span className={hintClass}>
                  {purchaseMode === "shopee"
                    ? "產品頁的「前往蝦皮購買」會連到這裡；還沒填的話按鈕會先無法點"
                    : channels.includes("website")
                      ? "填了連結，產品頁「加入購物車」下方會多一個「前往蝦皮購買」"
                      : "選填；沒勾官網的話首頁不會顯示這個產品"}
                </span>
              </label>
            )}
            {onShopee && (
              <fieldset className="mt-2 flex flex-col gap-2">
                <legend className="mb-1 text-sm font-medium text-ink/80">購買方式</legend>
                {PURCHASE_MODES.map((m) => (
                  <label key={m.value} className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="radio"
                      name="purchaseMode"
                      value={m.value}
                      checked={purchaseMode === m.value}
                      onChange={() => setPurchaseMode(m.value)}
                      className="accent-brand-navy"
                    />
                    {m.label}
                    <span className={hintClass}>{m.hint}</span>
                  </label>
                ))}
              </fieldset>
            )}
          </fieldset>
          <label className={labelClass}>
            排序
            <input
              name="sortOrder"
              type="number"
              step={1}
              defaultValue={initial?.sortOrder ?? 0}
              className={inputClass}
            />
            <span className={hintClass}>數字小的排在前面</span>
          </label>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-ink/80">產品圖片</p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-full border border-brand-navy px-4 py-1.5 text-xs font-medium text-brand-navy transition-colors hover:bg-brand-navy hover:text-white disabled:opacity-50"
            >
              {uploading ? "上傳中⋯" : "上傳圖片"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={IMAGE_ACCEPT}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(file);
              }}
            />
          </div>
          <span className={hintClass}>JPG、PNG、WebP 或 GIF，4 MB 以內；建議直式 4:5</span>
          {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
          <label className={labelClass}>
            圖片網址
            <input
              name="imageUrl"
              maxLength={MAX_IMAGE_URL}
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value.trim())}
              placeholder="上傳後會自動填入，也可以貼網址"
              className={inputClass}
            />
          </label>
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-mist">
            {showPreview ? (
              <Image src={imageUrl} alt="產品圖片預覽" fill unoptimized sizes="300px" className="object-cover" />
            ) : (
              <p className="absolute inset-0 flex items-center justify-center text-xs text-ink/40">
                {imageUrl ? "網址要以 / 或 https:// 開頭" : "圖片預覽"}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-6">
          <p className="text-sm font-medium text-ink/80">更多產品照片</p>
          <GalleryEditor name="gallery" initial={initial?.gallery ?? []} />
        </div>

        {state && (
          <p className={`text-sm ${state.ok ? "text-green-700" : "text-red-600"}`}>{state.message}</p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={openPreview}
            disabled={previewLoading || pending}
            className="rounded-full border border-brand-navy px-4 py-3 text-sm font-medium text-brand-navy transition-colors hover:bg-brand-soft disabled:opacity-60"
          >
            {previewLoading ? "準備中⋯" : "預覽"}
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-brand-navy px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-navy/85 disabled:opacity-60"
          >
            {pending ? "儲存中" : initial?.id ? "儲存變更" : "新增產品"}
          </button>
        </div>
        <p className={hintClass}>先按「預覽」看前台的樣子，確認沒問題再儲存。</p>
      </div>

      {preview && (
        <ProductPreview
          product={preview.product}
          notices={preview.notices}
          saving={pending}
          onClose={() => setPreview(null)}
          onSave={() => formRef.current?.requestSubmit()}
        />
      )}
    </form>
  );
}
