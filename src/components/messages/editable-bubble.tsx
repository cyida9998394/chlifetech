"use client";

import { startTransition, useActionState, useState } from "react";
import { editReply } from "@/app/admin/actions";
import type { ActionResult } from "@/app/admin/actions";
import { MAX_MESSAGE_LENGTH } from "@/lib/message-limits";

// 管理者自己的回覆：按「編輯」改內容，要按「確認修改」才會真的存檔
export default function EditableBubble({
  messageId,
  replyId,
  body,
  children,
}: {
  messageId: string;
  replyId: string;
  body: string;
  // 平常顯示的泡泡內容
  children: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(body);
  const [state, formAction, pending] = useActionState(
    async (prev: ActionResult | null, formData: FormData) => {
      const result = await editReply(prev, formData);
      if (result.ok) setEditing(false);
      return result;
    },
    null,
  );

  if (!editing) {
    return (
      <div className="flex max-w-[85%] flex-col items-end gap-1">
        {children}
        <div className="flex items-center gap-3 text-xs">
          {state?.ok && <span className="text-green-700">{state.message}</span>}
          <button
            type="button"
            onClick={() => {
              setDraft(body);
              setEditing(true);
            }}
            className="text-ink/50 underline underline-offset-4 hover:text-ink"
          >
            編輯
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="flex w-full max-w-[85%] flex-col gap-2 self-end"
    >
      <input type="hidden" name="id" value={messageId} />
      <input type="hidden" name="replyId" value={replyId} />
      <textarea
        name="body"
        required
        rows={3}
        maxLength={MAX_MESSAGE_LENGTH}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        autoFocus
        aria-label="修改回覆內容"
        className="resize-y rounded-2xl border border-brand bg-white px-4 py-2.5 text-sm text-ink outline-none"
      />
      <div className="flex items-center justify-end gap-2">
        {state && !state.ok && <p className="mr-auto text-xs text-red-600">{state.message}</p>}
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-full px-4 py-1.5 text-sm font-medium text-ink/60 hover:text-ink"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={pending || draft.trim() === ""}
          className="rounded-full bg-brand-navy px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-navy/85 disabled:opacity-50"
        >
          {pending ? "儲存中" : "確認修改"}
        </button>
      </div>
    </form>
  );
}
