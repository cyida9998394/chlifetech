"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { changePassword } from "@/app/account/actions";
import PasswordStrength from "@/components/password-strength";
import PasswordInput from "@/components/password-input";
import { ActionMessage, buttonClass, inputClass, labelClass } from "@/components/account/ui";

export default function PasswordForm() {
  const [password, setPassword] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (prev: Awaited<ReturnType<typeof changePassword>> | null, formData: FormData) => {
      const result = await changePassword(prev, formData);
      // 改成功後清空欄位，避免密碼留在畫面上
      if (result.ok) {
        formRef.current?.reset();
        setPassword("");
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
        目前的密碼
        <PasswordInput
          name="current"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        新密碼
        <PasswordInput
          name="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
        <PasswordStrength password={password} />
      </label>
      <ActionMessage state={state} />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "更新中" : "更新密碼"}
      </button>
    </form>
  );
}
