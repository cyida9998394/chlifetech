"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteUser, requestDeleteUserCode, type ActionResult } from "@/app/admin/actions";

const RESEND_COOLDOWN_SECONDS = 60;

type Props = {
  id: string;
  email: string;
  label?: string;
  // 在會員詳細頁刪除後要跳回列表，不然會停在已不存在的頁面
  redirectTo?: string;
};

// 刪除會員要輸入寄到管理者信箱的確認碼，由伺服器檢查
export default function DeleteUserButton({ id, email, label = "刪除", redirectTo }: Props) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<ActionResult | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [, formAction, pending] = useActionState(
    async (prev: ActionResult | null, formData: FormData) => {
      const result = await deleteUser(prev, formData);
      setMessage(result);
      if (result.ok) {
        dialogRef.current?.close();
        if (redirectTo) router.push(redirectTo);
      }
      return result;
    },
    null,
  );

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function sendCode() {
    setSending(true);
    try {
      const result = await requestDeleteUserCode(id);
      setMessage(result);
      if (result.ok) setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      setMessage({ ok: false, message: "寄送失敗，請稍後再試。" });
    }
    setSending(false);
  }

  function open() {
    setCode("");
    setMessage(null);
    dialogRef.current?.showModal();
    sendCode();
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="text-sm font-medium text-red-600 hover:text-red-700"
      >
        {label}
      </button>
      <dialog
        ref={dialogRef}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-line bg-white p-6 text-left shadow-xl backdrop:bg-ink/40"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            startTransition(() => formAction(formData));
          }}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="id" value={id} />
          <div>
            <p className="text-base font-bold text-ink">確認刪除會員</p>
            <p className="mt-1 text-sm text-ink/60">
              確定要刪除 <span className="font-medium text-ink">{email}</span> 嗎？刪除後無法復原。
            </p>
          </div>
          <p className="rounded-xl bg-mist px-4 py-3 text-xs text-ink/60">
            {sending ? "正在寄送確認碼到你的信箱⋯" : "請到你的管理者信箱收信，輸入信中的 6 位數確認碼。"}
          </p>
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="6 位數確認碼"
            aria-label="確認碼"
            className="rounded-xl border border-line px-4 py-2.5 text-center tracking-[0.4em] text-ink outline-none focus:border-ink"
          />
          {message && (
            <p className={`text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>
              {message.message}
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={sendCode}
              disabled={sending || cooldown > 0}
              className="text-xs font-medium text-ink underline underline-offset-4 disabled:text-ink/40 disabled:no-underline"
            >
              {cooldown > 0 ? `${cooldown} 秒後可重新寄送` : "重新寄送確認碼"}
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="rounded-full px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={pending || code.length !== 6}
                className="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-40"
              >
                {pending ? "刪除中" : "確定刪除"}
              </button>
            </div>
          </div>
        </form>
      </dialog>
    </>
  );
}
