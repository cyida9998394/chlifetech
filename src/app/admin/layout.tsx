import type { Metadata } from "next";
import Image from "next/image";
import AdminNav, { AdminMemberSubNav } from "@/components/admin/admin-nav";
import { requireAdminPage } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { MessageModel } from "@/models/message";
import { OrderModel } from "@/models/order";
import { OPEN_MESSAGE_FILTER } from "@/lib/message-thread";

export const metadata: Metadata = {
  title: "後台管理｜CH LIFE TECH 承禾生活科技",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdminPage();
  await connectDB();
  const [openMessages, pendingOrders] = await Promise.all([
    MessageModel.countDocuments(OPEN_MESSAGE_FILTER),
    OrderModel.countDocuments({ status: "pending" }),
  ]);

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-cream/60">
      <div className="relative overflow-hidden border-b border-line bg-white">
        <Image src="/about-bg.webp" alt="" fill priority sizes="100vw" className="object-cover" />
        {/* 左側加一層白色漸層，讓標題文字更清楚 */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/30 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6 pt-10 lg:px-10">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-ink/30" />
            <p className="text-xs font-medium tracking-[0.3em] text-ink/40">ADMIN DASHBOARD</p>
          </div>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <h1 className="font-['Microsoft_JhengHei','微軟正黑體','PingFang_TC',sans-serif] text-3xl font-bold tracking-wider text-ink sm:text-4xl">
              後台管理
            </h1>
            <p className="flex items-center gap-2 rounded-full border border-white/80 bg-white/70 backdrop-blur px-3.5 py-1.5 text-xs text-ink/60">
              <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
              管理者：<span className="font-medium text-ink">{admin.nickname}</span>
            </p>
          </div>
          <div className="mt-6">
            <AdminNav openMessages={openMessages} pendingOrders={pendingOrders} />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <AdminMemberSubNav openMessages={openMessages} />
        {children}
      </div>
    </div>
  );
}
