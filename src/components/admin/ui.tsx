// 後台共用的小元件與樣式

export function formatDate(date?: Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// 標題前的小 icon：黑底白線條；sm 用在卡片的小標籤，不加底色，跟文字同色
export function HeadingIcon({ children, size = "md" }: { children: React.ReactNode; size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center ${
        size === "sm" ? "h-4 w-4" : "h-7 w-7 rounded-lg bg-ink text-white"
      }`}
    >
      {children}
    </span>
  );
}

// 區塊底色：全部統一成接近白色的淡底
const SECTION_CLASS = "border-ink/10 bg-white/80";

// 總覽頁的區塊：有底色的大框，標題和內容包在一起，讓每一區明顯分開
export function Section({
  title,
  icon,
  desc,
  actions,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  desc?: React.ReactNode;
  // 標題列右側的按鈕或連結
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-3xl border p-5 sm:p-6 ${SECTION_CLASS}`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="flex items-center gap-2.5 text-lg font-black text-ink">
            <HeadingIcon>{icon}</HeadingIcon>
            {title}
          </h2>
          {desc && <p className="text-xs text-ink/50">{desc}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function PageTitle({ title, desc, icon }: { title: string; desc?: string; icon?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="flex items-center gap-2.5 text-xl font-black text-ink">
        {icon && <HeadingIcon>{icon}</HeadingIcon>}
        {title}
      </h2>
      {desc && <p className="mt-1 text-sm text-ink/50">{desc}</p>}
    </div>
  );
}

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        {/* 表頭用科技藍漸層：Logo 的深藍到亮藍 */}
        <thead className="bg-gradient-to-r from-brand-navy to-brand text-xs text-white">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-3 text-center font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

const TD_ALIGN = { left: "text-left", center: "text-center", right: "text-right" } as const;

// 表格內容預設置中，需要時可以用 align 改成靠左或靠右
export function Td({
  children,
  className = "",
  align = "center",
}: {
  children: React.ReactNode;
  className?: string;
  align?: keyof typeof TD_ALIGN;
}) {
  return <td className={`px-4 py-3 align-middle text-ink/80 ${TD_ALIGN[align]} ${className}`}>{children}</td>;
}

export function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-ink/40">
        {text}
      </td>
    </tr>
  );
}

export function RoleBadge({ role }: { role?: string | null }) {
  const isAdmin = role === "admin";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isAdmin ? "bg-ink text-white" : "bg-mist text-ink/70"
      }`}
    >
      {isAdmin ? "管理者" : "一般會員"}
    </span>
  );
}
