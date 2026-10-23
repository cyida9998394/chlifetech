"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrder } from "@/app/admin/orders/actions";
import { ORDER_STATUSES } from "@/lib/order-options";

// 後台：改訂單狀態、填物流單號
export default function OrderControls({ orderId, status, trackingNo }: { orderId: string; status: string; trackingNo: string }) {
  const router = useRouter();
  const [next, setNext] = useState(status);
  const [tracking, setTracking] = useState(trackingNo);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const cancelled = status === "cancelled";

  async function save() {
    if (next === "cancelled" && !window.confirm("確定要取消這筆訂單嗎？庫存會補回去，取消後就不能再改。")) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await updateOrder(orderId, next, tracking);
      setMessage({ ok: res.ok, text: res.message });
      if (res.ok) router.refresh();
    } catch {
      setMessage({ ok: false, text: "連線失敗，請稍後再試。" });
    }
    setBusy(false);
  }

  if (cancelled) return <span className="text-xs text-ink/40">已取消的訂單不能修改</span>;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {message && <span className={`text-xs ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</span>}
      <input
        value={tracking}
        onChange={(e) => setTracking(e.target.value)}
        maxLength={40}
        placeholder="物流單號（選填）"
        aria-label="物流單號"
        className="w-40 rounded-full border border-line px-3 py-1.5 text-sm outline-none focus:border-brand"
      />
      <select
        value={next}
        onChange={(e) => setNext(e.target.value)}
        aria-label="訂單狀態"
        className="rounded-full border border-line bg-white px-3 py-1.5 text-sm outline-none focus:border-brand"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="rounded-full bg-brand-navy px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-navy/85 disabled:opacity-60"
      >
        {busy ? "儲存中" : "儲存"}
      </button>
    </div>
  );
}
