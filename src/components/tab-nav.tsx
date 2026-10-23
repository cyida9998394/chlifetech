"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AlertBadge from "@/components/admin/alert-badge";

// alert：有待處理事項時，在分頁名稱旁邊顯示小驚嘆號（內容是給螢幕閱讀器的說明）
// match：這些網址開頭也算是這個分頁（底下有子分頁時用）
export type Tab = { label: string; href: string; alert?: string; match?: string[] };

// 後台和會員中心共用的分頁列；第一個分頁是首頁，只有完全相同的網址才算選中
export default function TabNav({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();
  const root = tabs[0]?.href;

  return (
    <nav className="-mb-px flex gap-6 overflow-x-auto text-sm font-medium">
      {tabs.map((tab) => {
        const active =
          tab.href === root
            ? pathname === root
            : [tab.href, ...(tab.match ?? [])].some((prefix) => pathname.startsWith(prefix));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 pb-3 transition-colors ${
              active ? "border-brand-navy text-brand-navy" : "border-transparent text-ink/50 hover:text-brand-navy"
            }`}
          >
            {tab.label}
            {tab.alert && <AlertBadge label={tab.alert} size="sm" />}
          </Link>
        );
      })}
    </nav>
  );
}
