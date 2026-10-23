import type { Metadata } from "next";
import Image from "next/image";
import TabNav from "@/components/tab-nav";
import { requireUserPage } from "@/lib/auth";

export const metadata: Metadata = {
  title: "會員中心｜CH LIFE TECH 承禾生活科技",
  robots: { index: false, follow: false },
};

const tabs = [
  { label: "會員資料", href: "/account" },
  // memberOnly 的分頁只給一般會員，管理者不會購物，留言也是在後台的「會員留言」回覆
  { label: "我的訂單", href: "/account/orders", memberOnly: true },
  { label: "購物車", href: "/account/cart", memberOnly: true },
  { label: "與我們聯絡", href: "/account/messages", memberOnly: true },
  { label: "修改密碼", href: "/account/password" },
];

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const user = await requireUserPage();
  const visibleTabs = tabs.filter((tab) => !tab.memberOnly || user.role !== "admin");

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-cream/60">
      <div className="relative overflow-hidden border-b border-line bg-white">
        <Image src="/about-bg.webp" alt="" fill priority sizes="100vw" className="object-cover" />
        {/* 左側加一層白色漸層，讓標題文字更清楚 */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/30 to-transparent" />
        <div className="relative mx-auto max-w-5xl px-6 pt-10 lg:px-10">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-ink/30" />
            <p className="text-xs font-medium tracking-[0.3em] text-ink/40">MY ACCOUNT</p>
          </div>
          <h1 className="mt-3 font-['Microsoft_JhengHei','微軟正黑體','PingFang_TC',sans-serif] text-3xl font-bold tracking-wider text-ink sm:text-4xl">
            會員中心
          </h1>
          <div className="mt-6">
            <TabNav tabs={visibleTabs} />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">{children}</div>
    </div>
  );
}
