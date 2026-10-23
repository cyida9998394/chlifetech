import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicProduct } from "@/lib/public-products";
import { channelsOf } from "@/lib/product-options";
import { hasRichContent, plainTextToHtml, sanitizeRichText } from "@/lib/rich-text";
import ProductView from "@/components/product-view";

export async function generateMetadata({ params }: PageProps<"/products/[id]">): Promise<Metadata> {
  const { id } = await params;
  const product = await getPublicProduct(id);
  if (!product) return { title: "找不到產品｜CH LIFE TECH 承禾生活科技" };
  return {
    title: `${product.name}｜CH LIFE TECH 承禾生活科技`,
    description: product.summary || undefined,
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[id]">) {
  const { id } = await params;
  const product = await getPublicProduct(id);
  if (!product) notFound();

  // 客製化顏色預覽要開啟，而且底圖和遮罩都有上傳才顯示
  const c = product.customizer;
  const customizer =
    c?.enabled && c.baseImageUrl && c.maskImageUrl ? { baseUrl: c.baseImageUrl, maskUrl: c.maskImageUrl } : null;
  const shopeeUrl = channelsOf(product).includes("shopee") && product.shopeeUrl ? product.shopeeUrl : null;
  // 存檔時已經清過，顯示前再清一次多一層保險
  const article = hasRichContent(product.description)
    ? sanitizeRichText(plainTextToHtml(product.description ?? ""))
    : "";

  return (
    <article className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
        <Link href="/#products" className="text-sm text-ink/50 hover:text-ink">
          ← 回產品選物
        </Link>

        <ProductView
          product={{
            id: product._id.toString(),
            productNo: product.productNo ?? "",
            name: product.name,
            summary: product.summary ?? "",
            tags: product.tags ?? [],
            price: product.price,
            originalPrice: product.originalPrice ?? 0,
            gallery: product.gallery ?? [],
            stock: product.stock,
            imageUrl: product.imageUrl ?? "",
            variants: (product.variants ?? []).map((v) => ({
              name: v.name,
              color: v.color,
              stock: v.stock,
              imageUrl: v.imageUrl ?? "",
            })),
            customizer,
            shopeeUrl,
            purchaseMode: product.purchaseMode === "shopee" ? "shopee" : "website",
            articleHtml: article,
          }}
        />
      </div>
    </article>
  );
}
