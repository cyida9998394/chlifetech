"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { placeOrder } from "@/app/order-actions";
import DeliveryOptions from "@/components/delivery-options";
import type { CartLine } from "@/lib/cart";
import type { DeliveryMethod } from "@/lib/delivery";
import {
  CVS_BRANDS,
  MAX_ADDRESS,
  MAX_ORDER_NOTE,
  MAX_RECIPIENT_NAME,
  MAX_STORE,
  PAYMENT_LABEL,
  isValidPhone,
  shippingFee,
  type ShippingInfo,
  type ShippingSettings,
} from "@/lib/order-options";

const inputClass =
  "rounded-xl border border-line bg-white px-4 py-2.5 text-ink outline-none transition-colors focus:border-brand";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium text-ink/80";

// 結帳：配送方式、收件資料、貨到付款
export default function CheckoutForm({
  lines,
  shipping,
  saved,
  defaultDelivery,
}: {
  lines: CartLine[];
  shipping: ShippingSettings;
  // 會員資料裡的預設收件資料
  saved: ShippingInfo;
  defaultDelivery: DeliveryMethod;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<DeliveryMethod>(defaultDelivery);
  const [recipientName, setRecipientName] = useState(saved.recipientName);
  const [phone, setPhone] = useState(saved.phone);
  const [address, setAddress] = useState(saved.address);
  const [cvsBrand, setCvsBrand] = useState<string>(saved.cvsBrand || CVS_BRANDS[0].value);
  const [cvsStore, setCvsStore] = useState(saved.cvsStore);
  const [saveAsDefault, setSaveAsDefault] = useState(true);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const fee = shippingFee(shipping, method, subtotal);
  const total = subtotal + fee;
  const phoneOk = phone === "" || isValidPhone(phone);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await placeOrder({ method, recipientName, phone, address, cvsBrand, cvsStore, note, saveAsDefault });
      if (res.ok && res.orderNo) {
        window.dispatchEvent(new CustomEvent("cart:updated", { detail: 0 }));
        router.push(`/account/orders?placed=${encodeURIComponent(res.orderNo)}`);
        return;
      }
      setError(res.message);
    } catch {
      setError("連線失敗，請稍後再試。");
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-6 sm:p-8">
          <DeliveryOptions value={method} onChange={setMethod} />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              收件人姓名
              <input
                required
                maxLength={MAX_RECIPIENT_NAME}
                autoComplete="name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className={inputClass}
              />
              {method === "cvs" && <span className="text-xs font-normal text-ink/50">取貨時要出示證件，請填真實姓名</span>}
            </label>
            <label className={labelClass}>
              聯絡電話
              <input
                required
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912-345-678"
                aria-invalid={!phoneOk}
                className={`${inputClass} ${phoneOk ? "" : "border-red-400"}`}
              />
              {!phoneOk && <span className="text-xs font-normal text-red-600">請輸入手機或市話號碼</span>}
            </label>
          </div>

          {method === "home" ? (
            <label className={labelClass}>
              收件地址
              <input
                required
                maxLength={MAX_ADDRESS}
                autoComplete="street-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="縣市、區、路名、號、樓層"
                className={inputClass}
              />
            </label>
          ) : (
            <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
              <label className={labelClass}>
                超商
                <select value={cvsBrand} onChange={(e) => setCvsBrand(e.target.value)} className={inputClass}>
                  {CVS_BRANDS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                取貨門市
                <input
                  required
                  maxLength={MAX_STORE}
                  value={cvsStore}
                  onChange={(e) => setCvsStore(e.target.value)}
                  placeholder="門市名稱或店號，例如 台北車站門市 / 123456"
                  className={inputClass}
                />
              </label>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={saveAsDefault}
              onChange={(e) => setSaveAsDefault(e.target.checked)}
              className="accent-brand-navy"
            />
            把這次的收件資料存成預設（之後結帳自動帶入，也可以在「會員資料」修改）
          </label>

          <label className={labelClass}>
            訂單備註（選填）
            <textarea
              maxLength={MAX_ORDER_NOTE}
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例如：方便收貨的時間"
              className={`${inputClass} resize-y`}
            />
          </label>
        </section>

        <section className="rounded-2xl border border-line bg-white p-6 sm:p-8">
          <p className="text-sm font-medium text-ink/80">付款方式</p>
          <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-brand-navy bg-brand-soft px-4 py-2 text-sm text-brand-navy">
            {PAYMENT_LABEL}
          </p>
          <p className="mt-2 text-xs text-ink/50">
            {method === "cvs" ? "到門市取貨時付款。" : "收到商品時付款給物流人員。"}
          </p>
        </section>
      </div>

      <aside className="flex h-fit flex-col gap-4 rounded-2xl border border-line bg-white p-6 lg:sticky lg:top-28">
        <p className="text-sm font-bold text-ink">訂單內容</p>
        <ul className="flex flex-col gap-3">
          {lines.map((l) => (
            <li key={l.id} className="flex gap-3">
              <span className="relative h-14 w-11 shrink-0 overflow-hidden rounded-md bg-mist">
                {l.imageUrl && <Image src={l.imageUrl} alt="" fill unoptimized sizes="44px" className="object-cover" />}
              </span>
              <span className="min-w-0 flex-1 text-sm">
                <span className="block truncate text-ink">{l.name}</span>
                <span className="block text-xs text-ink/50">
                  {l.customColor ? `自訂 ${l.customColor.toUpperCase()}・` : l.variantName ? `${l.variantName}・` : ""}× {l.quantity}
                </span>
              </span>
              <span className="text-sm tabular-nums text-ink">NT${(l.price * l.quantity).toLocaleString()}</span>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-1.5 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink/60">商品小計</dt>
            <dd className="tabular-nums">NT${subtotal.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink/60">運費</dt>
            <dd className="tabular-nums">{fee === 0 ? "免運" : `NT$${fee.toLocaleString()}`}</dd>
          </div>
          {shipping.freeOver > 0 && fee > 0 && (
            <p className="text-xs text-ink/50">再買 NT${(shipping.freeOver - subtotal).toLocaleString()} 就免運</p>
          )}
          <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
            <dt className="font-bold text-ink">應付金額</dt>
            <dd className="text-2xl font-black tabular-nums text-brand-navy">NT${total.toLocaleString()}</dd>
          </div>
        </dl>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !phoneOk}
          className="rounded-full bg-brand-navy px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-navy/85 disabled:opacity-60"
        >
          {submitting ? "送出中⋯" : `確認下單（${PAYMENT_LABEL}）`}
        </button>
        <Link href="/account/cart" className="text-center text-xs text-ink/50 hover:text-ink">
          回購物車修改
        </Link>
      </aside>
    </form>
  );
}
