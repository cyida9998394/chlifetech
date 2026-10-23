"use client";

import { useFormStatus } from "react-dom";

const STYLES = {
  link: "text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50",
  // 有外框的膠囊按鈕，用在產品列表
  boxed:
    "rounded-full border border-red-300 bg-white px-3 py-1 text-sm font-medium text-red-600 transition-colors hover:border-red-500 hover:bg-red-50 disabled:opacity-50",
};

function SubmitButton({ label, variant }: { label: string; variant: keyof typeof STYLES }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={STYLES[variant]}>
      {pending ? "刪除中" : label}
    </button>
  );
}

type Props = {
  id: string;
  action: (formData: FormData) => Promise<void>;
  confirmText: string;
  label?: string;
  variant?: keyof typeof STYLES;
};

// 刪除前先跳出確認視窗，避免誤刪
export default function DeleteButton({ id, action, confirmText, label = "刪除", variant = "link" }: Props) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <SubmitButton label={label} variant={variant} />
    </form>
  );
}
