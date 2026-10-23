"use client";

import { useState } from "react";
import { saveShippingSettings } from "@/app/admin/orders/actions";
import type { ShippingSettings } from "@/lib/order-options";

const inputClass =
  "w-28 rounded-lg border border-line bg-white px-3 py-2 text-sm tabular-nums text-ink outline-none focus:border-brand";

// 後台：運費設定
export default function ShippingSettingsForm({ initial }: { initial: ShippingSettings }) {
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const field = (key: keyof ShippingSettings, label: string, hint: string) => (
    <label className="flex flex-col gap-1 text-xs font-medium text-ink/70">
      {label}
      <span className="flex items-center gap-1.5 text-sm font-normal text-ink/50">
        NT$
        <input
          type="number"
          min={0}
          step={1}
          value={values[key]}
          onChange={(e) => setValues({ ...values, [key]: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
          className={inputClass}
        />
      </span>
      <span className="font-normal text-ink/40">{hint}</span>
    </label>
  );

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await saveShippingSettings(values);
      setMessage({ ok: res.ok, text: res.message });
    } catch {
      setMessage({ ok: false, text: "連線失敗，請稍後再試。" });
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-wrap items-end gap-5">
      {field("home", "宅配運費", "0 = 免運")}
      {field("cvs", "超商取貨運費", "0 = 免運")}
      {field("freeOver", "滿額免運", "訂單滿多少免運；0 = 不設定")}
      <div className="flex items-center gap-3 pb-5">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="rounded-full bg-brand-navy px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy/85 disabled:opacity-60"
        >
          {busy ? "儲存中" : "儲存運費"}
        </button>
        {message && <span className={`text-xs ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</span>}
      </div>
    </div>
  );
}
