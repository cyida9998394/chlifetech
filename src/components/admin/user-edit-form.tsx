"use client";

import { startTransition, useActionState, useState } from "react";
import { updateUser } from "@/app/admin/actions";

const inputClass =
  "rounded-xl border border-line bg-white px-4 py-2.5 text-ink outline-none transition-colors focus:border-ink disabled:bg-mist disabled:text-ink/50";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium text-ink/80";

type Props = {
  id: string;
  name: string;
  nickname: string;
  role: "user" | "admin";
  isSelf: boolean;
};

export default function UserEditForm({ id, isSelf, ...initial }: Props) {
  const [state, formAction, pending] = useActionState(updateUser, null);
  const [name, setName] = useState(initial.name);
  const [nickname, setNickname] = useState(initial.nickname);
  const [role, setRole] = useState(initial.role);

  return (
    <form
      // 不用 <form action>：React 送出後會自動重設表單，下拉選單會跳回原本的值
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="flex flex-col gap-5"
    >
      <input type="hidden" name="id" value={id} />
      <label className={labelClass}>
        姓名
        <input
          name="name"
          required
          maxLength={50}
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
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        身份
        <select
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value === "admin" ? "admin" : "user")}
          disabled={isSelf}
          className={inputClass}
        >
          <option value="user">一般會員</option>
          <option value="admin">管理者</option>
        </select>
        {/* disabled 的欄位不會送出，自己的身份另外用 hidden 帶上 */}
        {isSelf && <input type="hidden" name="role" value={role} />}
        <span className="text-xs font-normal text-ink/50">
          {isSelf ? "不能修改自己的身份，避免沒有人能進入後台。" : "管理者可以進入後台、管理所有資料。"}
        </span>
      </label>

      {state && (
        <p className={`text-sm ${state.ok ? "text-green-700" : "text-red-600"}`}>{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ink/85 disabled:opacity-60"
      >
        {pending ? "儲存中" : "儲存變更"}
      </button>
    </form>
  );
}
