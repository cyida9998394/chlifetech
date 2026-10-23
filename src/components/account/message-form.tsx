"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { sendMessage } from "@/app/account/actions";
import { ActionMessage, buttonClass, inputClass, labelClass } from "@/components/account/ui";
import {
  CONTACT_METHODS,
  MAX_CONTACT_LENGTH,
  MAX_MESSAGE_LENGTH,
  MESSAGE_CATEGORIES,
  findCategory,
  type ContactMethod,
} from "@/lib/message-limits";

// 會員自己的訂單，訂單功能完成後由頁面傳進來
export type OrderOption = { id: string; label: string };

export default function MessageForm({ email, orders }: { email: string; orders: OrderOption[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [categoryValue, setCategoryValue] = useState("");
  const category = findCategory(categoryValue);
  const [body, setBody] = useState("");
  const [method, setMethod] = useState<ContactMethod>("email");
  const [contact, setContact] = useState(email);
  const current = CONTACT_METHODS.find((m) => m.value === method) ?? CONTACT_METHODS[0];

  // 切換聯絡方式時，選 Email 就帶入會員的 Email，其他方式清空讓會員填
  function changeMethod(value: ContactMethod) {
    setMethod(value);
    setContact(value === "email" ? email : "");
  }
  const [state, formAction, pending] = useActionState(
    async (prev: Awaited<ReturnType<typeof sendMessage>> | null, formData: FormData) => {
      const result = await sendMessage(prev, formData);
      // 送出成功後清空表單
      if (result.ok) {
        formRef.current?.reset();
        setBody("");
        setCategoryValue("");
        changeMethod("email");
      }
      return result;
    },
    null,
  );

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="flex flex-col gap-5"
    >
      <label className={labelClass}>
        問題類型
        <select
          name="category"
          required
          value={categoryValue}
          onChange={(e) => setCategoryValue(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            請選擇
          </option>
          {MESSAGE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      {category?.needsOrder && (
        <label className={labelClass}>
          相關訂單
          <select
            name="orderId"
            defaultValue=""
            disabled={orders.length === 0}
            className={inputClass}
          >
            <option value="">{orders.length === 0 ? "目前沒有訂單" : "不指定"}</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
        <label className={labelClass}>
          聯絡方式
          <select
            name="contactMethod"
            value={method}
            onChange={(e) => changeMethod(e.target.value as ContactMethod)}
            className={inputClass}
          >
            {CONTACT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          {current.label}
          <input
            name="contact"
            required
            type={method === "email" ? "email" : method === "phone" ? "tel" : "text"}
            maxLength={MAX_CONTACT_LENGTH}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder={current.placeholder}
            className={inputClass}
          />
        </label>
      </div>
      <label className={labelClass}>
        留言內容
        <textarea
          name="body"
          required
          rows={5}
          maxLength={MAX_MESSAGE_LENGTH}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className={`${inputClass} resize-y`}
        />
        <span className="self-end text-xs font-normal text-ink/40">
          {body.length} / {MAX_MESSAGE_LENGTH}
        </span>
      </label>
      <ActionMessage state={state} />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "送出中" : "送出留言"}
      </button>
    </form>
  );
}
