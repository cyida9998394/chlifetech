"use client";

import { useEffect, useRef } from "react";
import ProductView, { type ProductViewData } from "@/components/product-view";

// 全螢幕的前台預覽：用表單目前的內容畫出產品頁，還沒有存檔
export default function ProductPreview({
  product,
  notices,
  saving,
  onClose,
  onSave,
}: {
  product: ProductViewData;
  // 例如「目前是草稿」這類提醒
  notices: string[];
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  // 記住最新的 onClose，下面的設定只要在打開時做一次
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  // 預覽打開時鎖住後面的頁面捲動，按 Esc 可以關閉
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div role="dialog" aria-modal="true" aria-label="前台預覽" className="fixed inset-0 z-[100] flex flex-col bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-brand-navy px-4 py-3 text-white sm:px-6">
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium">預覽模式</span>
          <span className="text-white/80">這是前台產品頁的樣子，還沒有儲存</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/40 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            返回編輯
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-full bg-white px-5 py-1.5 text-sm font-medium text-brand-navy transition-colors hover:bg-white/90 disabled:opacity-60"
          >
            {saving ? "儲存中" : "看起來 OK，儲存"}
          </button>
        </div>
      </div>

      {notices.length > 0 && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 sm:px-6">
          {notices.map((n) => (
            <p key={n}>・{n}</p>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <article className="mx-auto max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
          <ProductView product={product} preview />
        </article>
      </div>
    </div>
  );
}
