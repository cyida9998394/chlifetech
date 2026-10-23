import BackLink from "@/components/back-link";
import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth";
import { ProductModel } from "@/models/product";
import { channelsOf, formatProductNo } from "@/lib/product-options";
import { plainTextToHtml } from "@/lib/rich-text";
import { deleteProduct } from "@/app/admin/products/actions";
import DeleteButton from "@/components/admin/delete-button";
import ProductForm from "@/components/admin/product-form";
import { PageTitle, formatDate } from "@/components/admin/ui";

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  await requireAdminPage();
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  await connectDB();
  const product = await ProductModel.findById(id).lean();
  if (!product) notFound();

  return (
    <>
      <BackLink href="/admin/products">回產品列表</BackLink>
      <div className="mt-4">
        <PageTitle
          title={product.name}
          desc={`${product.productNo ? `${formatProductNo(product.productNo)}・` : ""}最後更新：${formatDate(product.updatedAt)}${product.updatedBy ? `（${product.updatedBy}）` : ""}`}
        />
      </div>
      <ProductForm
        initial={{
          id,
          productNo: product.productNo ?? "",
          name: product.name,
          summary: product.summary ?? "",
          // 舊的純文字介紹轉成段落，編輯器才看得懂
          description: plainTextToHtml(product.description ?? ""),
          tags: product.tags ?? [],
          price: product.price,
          originalPrice: product.originalPrice ?? 0,
          gallery: product.gallery ?? [],
          stock: product.stock,
          customizer: {
            enabled: product.customizer?.enabled ?? false,
            baseImageUrl: product.customizer?.baseImageUrl ?? "",
            maskImageUrl: product.customizer?.maskImageUrl ?? "",
          },
          variants: (product.variants ?? []).map((v) => ({
            name: v.name,
            color: v.color,
            stock: v.stock,
            imageUrl: v.imageUrl ?? "",
          })),
          imageUrl: product.imageUrl ?? "",
          channels: channelsOf(product),
          shopeeUrl: product.shopeeUrl ?? "",
          purchaseMode: product.purchaseMode ?? "website",
          sortOrder: product.sortOrder ?? 0,
          status: product.status ?? "draft",
        }}
      />
      <div className="mt-6 max-w-md rounded-2xl border border-red-200 bg-white p-6">
        <p className="text-sm font-bold text-ink">刪除產品</p>
        <p className="mt-1 mb-4 text-xs text-ink/50">刪除後無法復原。如果只是暫時不賣，建議改成下架。</p>
        <DeleteButton
          id={id}
          action={deleteProduct}
          label="刪除這個產品"
          confirmText={`確定要刪除產品「${product.name}」嗎？刪除後無法復原。`}
        />
      </div>
    </>
  );
}
