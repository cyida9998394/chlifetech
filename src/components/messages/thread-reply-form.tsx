"use client";

import { startTransition, useActionState, useRef } from "react";
import { MAX_MESSAGE_LENGTH } from "@/lib/message-limits";

type Result = { ok: boolean; message: string };

// 留言串最下面的回覆框，管理者回覆、會員補充說明共用
export default function ThreadReplyForm({
  messageId,
  action,
  placeholder,
  submitLabel,
}: {
  messageId: string;
  action: (prev: Result | null, formData: FormData) => Promise<Result>;
  placeholder: string;
  submitLabel: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (prev: Result | null, formData: FormData) => {
      const result = await action(prev, formData);
      // 送出成功後清空
      if (result.ok) formRef.current?.reset();
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
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="id" value={messageId} />
      <textarea
        name="body"
        required
        rows={2}
        maxLength={MAX_MESSAGE_LENGTH}
        placeholder={placeholder}
        aria-label={placeholder}
        className="resize-y rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand"
      />
      <div className="flex items-center justify-between gap-3">
        {state ? (
          <p className={`text-xs ${state.ok ? "text-green-700" : "text-red-600"}`}>{state.message}</p>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-ink/85 disabled:opacity-60"
        >
          {pending ? "送出中" : submitLabel}
        </button>
      </div>
    </form>
  );
}
