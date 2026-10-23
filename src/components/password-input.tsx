"use client";

import { useState, type InputHTMLAttributes } from "react";

// 密碼輸入框：右邊有眼睛圖示，可以切換顯示／隱藏密碼
export default function PasswordInput({ className = "", ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative flex">
      <input {...props} type={visible ? "text" : "password"} className={`${className} w-full pr-11`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "隱藏密碼" : "顯示密碼"}
        aria-pressed={visible}
        title={visible ? "隱藏密碼" : "顯示密碼"}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-ink/40 transition-colors hover:text-ink"
      >
        {visible ? (
          // 眼睛加斜線：目前顯示中，按下去隱藏
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
            <path d="M3 3l18 18" />
            <path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-2.7 3.6" />
            <path d="M6.6 6.6A17 17 0 0 0 2.5 12S6 19 12 19a9.6 9.6 0 0 0 5.4-1.6" />
            <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
            <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </span>
  );
}
