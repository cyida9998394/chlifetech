"use client";

import { DELIVERY_METHODS, type DeliveryMethod } from "@/lib/delivery";

// 配送方式的選項（產品頁和購物車共用）
export default function DeliveryOptions({
  value,
  onChange,
  disabled,
}: {
  value: DeliveryMethod;
  onChange: (value: DeliveryMethod) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset disabled={disabled}>
      <legend className="mb-2 text-sm font-medium text-ink/80">配送方式</legend>
      <div className="flex flex-wrap gap-2">
        {DELIVERY_METHODS.map((d) => (
          <label
            key={d.value}
            title={d.hint}
            className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand ${
              value === d.value ? "border-brand-navy bg-brand-soft text-brand-navy" : "border-line bg-white text-ink/70 hover:border-ink/30"
            }`}
          >
            <input
              type="radio"
              name="deliveryMethod"
              value={d.value}
              checked={value === d.value}
              onChange={() => onChange(d.value)}
              className="accent-brand-navy"
            />
            {d.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
