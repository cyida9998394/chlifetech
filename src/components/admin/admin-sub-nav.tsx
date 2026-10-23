"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AlertBadge from "@/components/admin/alert-badge";
import type { Tab } from "@/components/tab-nav";

// 主分頁底下的子分頁（膠囊按鈕），只在 section 裡的頁面顯示
export default function AdminSubNav({ section, tabs }: { section: string[]; tabs: Tab[] }) {
  const pathname = usePathname();
  if (!section.some((prefix) => pathname.startsWith(prefix))) return null;

  return (
    <nav aria-label="子分頁" className="mb-6 flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "border-brand-navy bg-brand-navy text-white"
                : "border-line bg-white text-ink/60 hover:border-brand-navy/40 hover:text-brand-navy"
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
