"use client";

import { startTransition, useActionState } from "react";
import { updateShippingInfo } from "@/app/account/actions";
import { ActionMessage, buttonClass, inputClass, labelClass } from "@/components/account/ui";
import { CVS_BRANDS, MAX_ADDRESS, MAX_RECIPIENT_NAME, MAX_STORE, type ShippingInfo } from "@/lib/order-options";

const hintClass = "text-xs font-normal text-ink/50";

// 會員資料頁的「收件資料」：存起來之後，結帳時自動帶入
export default function ShippingInfoForm({ initial }: { initial: ShippingInfo }) {
  const [state, formAction, pending] = useActionState(updateShippingInfo, null);

  return (
    <form
      // 不用 <form action>：React 送出後會自動重設表單
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="flex flex-col gap-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          收件人
          <input
            name="recipientName"
            maxLength={MAX_RECIPIENT_NAME}
            autoComplete="name"
            defaultValue={initial.recipientName}
            className={inputClass}
          />
          <span className={hintClass}>超商取貨要出示證件，請填真實姓名</span>
        </label>
        <label className={labelClass}>
          聯絡電話
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            defaultValue={initial.phone}
            placeholder="0912-345-678"
            className={inputClass}
          />
        </label>
      </div>
      <label className={labelClass}>
        宅配地址
        <input
          name="address"
          maxLength={MAX_ADDRESS}
          autoComplete="street-address"
          defaultValue={initial.address}
          placeholder="縣市、區、路名、號、樓層"
          className={inputClass}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <label className={labelClass}>
          常用超商
          <select name="cvsBrand" defaultValue={initial.cvsBrand} className={inputClass}>
            <option value="">不設定</option>
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
            name="cvsStore"
            maxLength={MAX_STORE}
            defaultValue={initial.cvsStore}
            placeholder="門市名稱或店號"
            className={inputClass}
          />
        </label>
      </div>
      <ActionMessage state={state} />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "儲存中" : "儲存收件資料"}
      </button>
    </form>
  );
}
