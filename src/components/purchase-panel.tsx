"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/app/cart-actions";
import { isOnSale } from "@/lib/product-options";
import { DEFAULT_DELIVERY, findDelivery, type DeliveryMethod } from "@/lib/delivery";
import DeliveryOptions from "@/components/delivery-options";

const MAX_QUANTITY = 10;

// 產品頁右邊的購買區：數量、加入購物車、到蝦皮購買
export default function PurchasePanel({
  productId,
  price,
  originalPrice,
  shopeeUrl,
  purchaseMode = "website",
  variantName,
  customColor,
  stock,
  preview,
}: {
  productId: string;
  price: number;
  originalPrice: number;
  shopeeUrl: string | null;
  // shopee：這個產品在蝦皮賣，不顯示配送方式、數量和加入購物車
  purchaseMode?: "website" | "shopee";
  // 沒有分顏色時是空字串
  variantName: string;
  customColor: string;
  // 這個顏色的庫存
  stock: number;
  // 後台預覽時按鈕不會真的加入購物車
  preview?: boolean;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [delivery, setDelivery] = useState<DeliveryMethod>(DEFAULT_DELIVERY);

  // 選了「到蝦皮購買」就不顯示配送方式和加入購物車；還沒填連結時按鈕先變灰
  const viaShopee = purchaseMode === "shopee";

  // 已登入的會員，配送方式預設成上次選的
  useEffect(() => {
    if (preview || viaShopee) return;
    let active = true;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        const saved = findDelivery(data.user?.deliveryMethod);
        if (active && saved) setDelivery(saved.value);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [preview, viaShopee]);

  const limit = Math.min(stock, MAX_QUANTITY);
  const priced = price > 0;
  const canBuy = priced && limit > 0;
  const qty = Math.min(quantity, Math.max(limit, 1));
  const sale = isOnSale({ price, originalPrice });

  async function add() {
    if (preview) {
      setMessage({ ok: true, text: "預覽中，不會真的加入購物車。" });
      return;
    }
    setAdding(true);
    setMessage(null);
    try {
      const res = await addToCart({ productId, variantName, customColor, quantity: qty, deliveryMethod: delivery });
      if (res.needLogin) {
        // 登入後回到這個產品頁
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      setMessage({ ok: res.ok, text: res.message });
      // 通知上方的購物車圖示更新數量
      if (res.ok) window.dispatchEvent(new CustomEvent("cart:updated", { detail: res.count }));
    } catch {
      setMessage({ ok: false, text: "連線失敗，請稍後再試。" });
    }
    setAdding(false);
  }

  // 價格：特價時用紅字，下面附上劃掉的原價
  const priceBlock = (
    <>
      {priced ? (
        <div>
          <p className={`text-3xl font-black tabular-nums ${sale ? "text-red-600" : "text-brand-navy"}`}>
            NT${price.toLocaleString()}
          </p>
          {sale && (
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className="text-ink/50">
                原價：<span className="tabular-nums line-through">NT${originalPrice.toLocaleString()}</span>
              </span>
              <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-600">特價商品</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-ink/50">價格即將公布</p>
      )}
    </>
  );

  // 在蝦皮賣的產品：只顯示價格和一個「前往蝦皮購買」按鈕
  if (viaShopee) {
    return (
      <div className="flex flex-col gap-4 border-t border-line pt-6">
        {priceBlock}
        {shopeeUrl ? (
          <a
            href={shopeeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-full bg-orange-700 px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-orange-800"
          >
            前往蝦皮購買 <span aria-hidden>↗</span>
          </a>
        ) : (
          <button type="button" disabled className="w-full cursor-not-allowed rounded-full bg-ink/20 px-6 py-3 text-sm font-medium text-ink/50">
            前往蝦皮購買
          </button>
        )}
        <p className="text-center text-xs text-ink/50">
          {shopeeUrl ? "這個商品在蝦皮販售，會在新分頁開啟蝦皮商品頁。" : "還沒有填蝦皮商品連結，請到後台補上。"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 border-t border-line pt-6">
      {priceBlock}

      {canBuy && <DeliveryOptions value={delivery} onChange={setDelivery} />}

      {canBuy && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink/60">數量</span>
          <div className="inline-flex items-center rounded-full border border-line bg-white">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, qty - 1))}
              disabled={qty <= 1}
              aria-label="減少數量"
              className="h-9 w-9 rounded-full text-lg text-ink/70 hover:text-ink disabled:opacity-30"
            >
              −
            </button>
            <span className="w-8 text-center tabular-nums text-ink" aria-live="polite">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(Math.min(limit, qty + 1))}
              disabled={qty >= limit}
              aria-label="增加數量"
              className="h-9 w-9 rounded-full text-lg text-ink/70 hover:text-ink disabled:opacity-30"
            >
              +
            </button>
          </div>
          {stock <= 5 && <span className="text-xs text-amber-700">剩 {stock} 件</span>}
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={add}
          disabled={!canBuy || adding}
          className="w-full rounded-full bg-brand-navy px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-navy/85 disabled:cursor-not-allowed disabled:bg-ink/20 disabled:text-ink/50"
        >
          {adding ? "加入中⋯" : !priced ? "尚未開放購買" : limit <= 0 ? "已售完" : "加入購物車"}
        </button>
        {/* 也可以到蝦皮買：放在加入購物車下方的連結 */}
        {shopeeUrl && (
          <a
            href={shopeeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-orange-700 underline underline-offset-4 hover:text-orange-800"
          >
            前往蝦皮購買 <span aria-hidden>↗</span>
          </a>
        )}
      </div>

      {message && (
        <p className={`text-sm ${message.ok ? "text-green-700" : "text-red-600"}`} role="status">
          {message.text}
          {message.ok && !preview && (
            <a href="/account/cart" className="ml-2 font-medium text-brand-navy underline underline-offset-4">
              查看購物車
            </a>
          )}
        </p>
      )}
    </div>
  );
}
