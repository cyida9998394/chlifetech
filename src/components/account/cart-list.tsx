"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { setDeliveryMethod, updateCartItem } from "@/app/cart-actions";
import DeliveryOptions from "@/components/delivery-options";
import type { DeliveryMethod } from "@/lib/delivery";
import type { CartLine } from "@/lib/cart";

// 購物車清單：改數量、移除、總計；結帳要等金流接上才開放
export default function CartList({ initial, delivery: initialDelivery }: { initial: CartLine[]; delivery: DeliveryMethod }) {
  const [lines, setLines] = useState(initial);
  const [delivery, setDelivery] = useState<DeliveryMethod>(initialDelivery);
  const [savingDelivery, setSavingDelivery] = useState(false);

  // 配送方式整筆訂單共用，改了就馬上存起來
  async function changeDelivery(value: DeliveryMethod) {
    const previous = delivery;
    setDelivery(value);
    setSavingDelivery(true);
    setError("");
    try {
      const res = await setDeliveryMethod(value);
      if (!res.ok) {
        setDelivery(previous);
        setError(res.message);
      }
    } catch {
      setDelivery(previous);
      setError("連線失敗，請稍後再試。");
    }
    setSavingDelivery(false);
  }
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function change(line: CartLine, quantity: number) {
    if (quantity <= 0 && !window.confirm(`要把「${line.name}」從購物車移除嗎？`)) return;
    setBusy(line.id);
    setError("");
    try {
      const res = await updateCartItem(line.id, quantity);
      if (res.ok) {
        setLines((prev) =>
          quantity <= 0 ? prev.filter((l) => l.id !== line.id) : prev.map((l) => (l.id === line.id ? { ...l, quantity } : l)),
        );
        window.dispatchEvent(new CustomEvent("cart:updated", { detail: res.count }));
      } else {
        setError(res.message);
      }
    } catch {
      setError("連線失敗，請稍後再試。");
    }
    setBusy(null);
  }

  const buyable = lines.filter((l) => l.available >= l.quantity);
  const total = buyable.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const canCheckout = lines.length > 0 && lines.every((l) => l.available >= l.quantity);
  const count = buyable.reduce((sum, l) => sum + l.quantity, 0);

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center">
        <p className="text-base font-bold text-ink">購物車是空的</p>
        <p className="mt-2 text-sm text-ink/50">到產品頁選好顏色和數量，按「加入購物車」就會出現在這裡。</p>
        <Link
          href="/#products"
          className="mt-6 rounded-full border border-ink px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-white"
        >
          逛逛產品選物
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-white">
        {lines.map((l) => {
          const problem = l.available <= 0 ? "目前無法購買" : l.quantity > l.available ? `庫存只剩 ${l.available} 件` : "";
          return (
            <li key={l.id} className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
              <Link href={`/products/${l.productId}`} className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-mist">
                {l.imageUrl && <Image src={l.imageUrl} alt="" fill unoptimized sizes="64px" className="object-cover" />}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/products/${l.productId}`} className="font-medium text-ink hover:underline">
                  {l.name}
                </Link>
                {(l.variantName || l.customColor) && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink/60">
                    {l.customColor && (
                      <span className="h-3 w-3 rounded-full border border-ink/20" style={{ backgroundColor: l.customColor }} />
                    )}
                    顏色：{l.customColor ? `自訂 ${l.customColor.toUpperCase()}` : l.variantName}
                  </p>
                )}
                <p className="mt-1 text-sm tabular-nums text-ink/70">NT$ {l.price.toLocaleString()}</p>
                {problem && <p className="mt-1 text-xs text-red-600">{problem}</p>}
              </div>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center rounded-full border border-line">
                  <button
                    type="button"
                    onClick={() => change(l, l.quantity - 1)}
                    disabled={busy === l.id}
                    aria-label="減少數量"
                    className="h-8 w-8 rounded-full text-ink/70 hover:text-ink disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="w-7 text-center text-sm tabular-nums">{l.quantity}</span>
                  <button
                    type="button"
                    onClick={() => change(l, l.quantity + 1)}
                    disabled={busy === l.id || l.quantity >= l.available}
                    aria-label="增加數量"
                    className="h-8 w-8 rounded-full text-ink/70 hover:text-ink disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
                <p className="w-24 text-right text-sm font-medium tabular-nums text-ink">
                  NT$ {(l.price * l.quantity).toLocaleString()}
                </p>
                <button
                  type="button"
                  onClick={() => change(l, 0)}
                  disabled={busy === l.id}
                  className="rounded-full border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  移除
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex h-fit flex-col gap-4 rounded-2xl border border-line bg-white p-6">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink/60">共 {count} 件</span>
          <span className="text-2xl font-bold tabular-nums text-brand-navy">NT$ {total.toLocaleString()}</span>
        </div>
        <div className="border-t border-line pt-4">
          <DeliveryOptions value={delivery} onChange={changeDelivery} disabled={savingDelivery} />
          <p className="mt-2 text-xs text-ink/50">運費會在結帳時依配送方式計算。</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {/* 有商品不能買（缺貨、下架）時要先處理，才能結帳 */}
        {canCheckout ? (
          <Link
            href="/account/checkout"
            className="rounded-full bg-brand-navy px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-brand-navy/85"
          >
            前往結帳（貨到付款）
          </Link>
        ) : (
          <button type="button" disabled className="cursor-not-allowed rounded-full bg-ink/20 px-6 py-3 text-sm font-medium text-ink/50">
            前往結帳
          </button>
        )}
        <p className="text-xs leading-relaxed text-ink/50">
          {canCheckout ? "官網訂單採貨到付款：宅配時付給物流人員，超商取貨時在門市付款。" : "有商品目前無法購買，請先調整數量或移除，才能結帳。"}
        </p>
      </div>
    </div>
  );
}
