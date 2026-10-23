"use client";

import { useState } from "react";
import { ColorOptions, DEFAULT_CUSTOM_COLOR, ProductImages, type ColorSelection } from "@/components/product-gallery";
import PurchasePanel from "@/components/purchase-panel";
import ShareButton from "@/components/share-button";

export type ProductViewData = {
  id: string;
  // 產品編號（不含 #），新產品在儲存前還沒有
  productNo: string;
  name: string;
  summary: string;
  tags: string[];
  price: number;
  // 原價，比售價高時顯示「特價商品」
  originalPrice: number;
  // 沒有分顏色時的庫存（有分顏色時看各顏色的庫存）
  stock: number;
  imageUrl: string;
  gallery: string[];
  variants: { name: string; color: string; stock: number; imageUrl: string }[];
  customizer: { baseUrl: string; maskUrl: string } | null;
  shopeeUrl: string | null;
  // website = 加入購物車、shopee = 直接到蝦皮買
  purchaseMode: "website" | "shopee";
  // 已經清過的詳細介紹 HTML
  articleHtml: string;
};

// 產品頁的內容：前台產品頁和後台「預覽」共用，兩邊看起來才會一模一樣
// 左邊是照片牆，右邊是名稱、顏色、價格和購買；選的顏色兩邊共用
export default function ProductView({ product, preview }: { product: ProductViewData; preview?: boolean }) {
  const { variants, customizer } = product;
  // 沒有顏色但有客製化時直接選自訂
  const [selected, setSelected] = useState<ColorSelection>(variants.length === 0 && customizer ? "custom" : 0);
  const [customColor, setCustomColor] = useState(DEFAULT_CUSTOM_COLOR);

  const custom = selected === "custom" && customizer ? customizer : null;
  const variant = typeof selected === "number" ? variants[selected] : undefined;
  // 自訂顏色用總庫存；有選顏色用那個顏色的庫存
  const totalStock = variants.length > 0 ? variants.reduce((sum, v) => sum + v.stock, 0) : product.stock;
  const stock = custom ? totalStock : variant ? variant.stock : product.stock;
  const heroUrl = variant?.imageUrl || product.imageUrl;

  return (
    <>
      <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:items-start lg:gap-12">
        <ProductImages
          name={product.name}
          heroUrl={heroUrl}
          heroAlt={variant ? `${product.name}（${variant.name}）` : product.name}
          gallery={product.gallery}
          customizer={custom}
          customColor={customColor}
        />

        {/* 電腦版右邊固定在畫面上，往下看照片時名稱和購買按鈕一直都在 */}
        <div className="flex flex-col gap-6 md:sticky md:top-28">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium tracking-[0.3em] text-ink/40">PRODUCT</p>
                <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">{product.name || "（未命名產品）"}</h1>
              </div>
              <ShareButton title={product.name} />
            </div>
            {product.summary && <p className="mt-3 leading-relaxed text-ink/70">{product.summary}</p>}
            {product.productNo && (
              <p className="mt-2 text-xs tabular-nums text-ink/45">商品編號 #{product.productNo}</p>
            )}
          </div>

          <ColorOptions
            variants={variants}
            customizer={customizer}
            selected={selected}
            onSelect={setSelected}
            customColor={customColor}
            onCustomColor={setCustomColor}
          />

          <PurchasePanel
            productId={product.id}
            price={product.price}
            originalPrice={product.originalPrice}
            shopeeUrl={product.shopeeUrl}
            purchaseMode={product.purchaseMode}
            variantName={custom ? "" : (variant?.name ?? "")}
            customColor={custom ? customColor : ""}
            stock={stock}
            preview={preview}
          />

          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-ink/50 px-3 py-1 text-xs text-ink">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {product.articleHtml && (
        <div className="mx-auto mt-16 max-w-3xl border-t border-line pt-10">
          <div className="rich-text" dangerouslySetInnerHTML={{ __html: product.articleHtml }} />
        </div>
      )}
    </>
  );
}
