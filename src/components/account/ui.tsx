import Link from "next/link";

// 會員中心共用的樣式與小元件
export const inputClass =
  "rounded-xl border border-line bg-white px-4 py-2.5 text-ink outline-none transition-colors focus:border-ink disabled:bg-mist disabled:text-ink/50";
export const labelClass = "flex flex-col gap-1.5 text-sm font-medium text-ink/80";
export const buttonClass =
  "w-fit rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ink/85 disabled:opacity-60";

export function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">{children}</div>;
}

export function ActionMessage({ state }: { state: { ok: boolean; message: string } | null }) {
  if (!state) return null;
  return (
    <p className={`text-sm ${state.ok ? "text-green-700" : "text-red-600"}`}>{state.message}</p>
  );
}

// 我的訂單、購物車還沒有資料時顯示
export function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center">
      <p className="text-base font-bold text-ink">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-ink/50">{desc}</p>
      <Link
        href="/#products"
        className="mt-6 rounded-full border border-ink px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-white"
      >
        逛逛產品選物
      </Link>
    </div>
  );
}
