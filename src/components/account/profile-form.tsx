"use client";

import { startTransition, useActionState, useState } from "react";
import { updateProfile } from "@/app/account/actions";
import { ActionMessage, buttonClass, inputClass, labelClass } from "@/components/account/ui";

export default function ProfileForm({ email, ...initial }: { email: string; name: string; nickname: string }) {
  const [state, formAction, pending] = useActionState(updateProfile, null);
  const [name, setName] = useState(initial.name);
  const [nickname, setNickname] = useState(initial.nickname);

  return (
    <form
      // 不用 <form action>：React 送出後會自動重設表單，輸入框會跳回原本的值
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="flex flex-col gap-5"
    >
      <label className={labelClass}>
        Email
        <input value={email} disabled className={inputClass} />
        <span className="text-xs font-normal text-ink/50">Email 是登入帳號，目前無法修改。</span>
      </label>
      <label className={labelClass}>
        姓名
        <input
          name="name"
          required
          maxLength={50}
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        暱稱
        <input
          name="nickname"
          required
          maxLength={30}
          autoComplete="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className={inputClass}
        />
        <span className="text-xs font-normal text-ink/50">會顯示在網站上</span>
      </label>
      <ActionMessage state={state} />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "儲存中" : "儲存變更"}
      </button>
    </form>
  );
}
