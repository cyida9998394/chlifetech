"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelMyOrder } from "@/app/order-actions";

// 會員取消還沒出貨的訂單
export default function CancelOrderButton({ orderId, orderNo }: { orderId: string; orderNo: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function cancel() {
    if (!window.confirm(`確定要取消訂單 ${orderNo} 嗎？`)) return;
    setBusy(true);
    setError("");
    try {
      const res = await cancelMyOrder(orderId);
      if (res.ok) router.refresh();
      else setError(res.message);
    } catch {
      setError("連線失敗，請稍後再試。");
    }
    setBusy(false);
  }

  return (
    <>
      {error && <span className="self-center text-xs text-red-600">{error}</span>}
      <button
        type="button"
        onClick={cancel}
        disabled={busy}
        className="rounded-full border border-red-300 px-4 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
      >
        {busy ? "取消中⋯" : "取消訂單"}
      </button>
    </>
  );
}
