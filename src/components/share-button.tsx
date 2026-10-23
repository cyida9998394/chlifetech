"use client";

import { useState } from "react";

// 分享產品頁：手機用系統的分享選單，電腦直接複製連結
export default function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // 使用者取消分享，或瀏覽器不允許複製
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label="分享這個產品"
      title={copied ? "已複製連結" : "分享"}
      className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-medium text-ink/70 transition-colors hover:border-ink hover:text-ink"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
        <path d="M12 15V3" />
        <path d="M7 8l5-5 5 5" />
        <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
      </svg>
      {copied ? "已複製" : "分享"}
    </button>
  );
}
