import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { requireUserPage } from "@/lib/auth";
import { OrderModel } from "@/models/order";
import OrderCard, { toOrderView } from "@/components/order-card";
import CancelOrderButton from "@/components/account/cancel-order-button";
import { EmptyState } from "@/components/account/ui";
import { PageTitle } from "@/components/admin/ui";

export default async function AccountOrdersPage({ searchParams }: PageProps<"/account/orders">) {
  const me = await requireUserPage();
  if (me.role === "admin") redirect("/account");
  const params = await searchParams;
  const placed = typeof params.placed === "string" ? params.placed : "";

  await connectDB();
  const orders = await OrderModel.find({ userId: me.id }).sort({ createdAt: -1 }).limit(100).lean();

  return (
    <>
      <PageTitle title="我的訂單" desc="你在承禾生活科技官網的訂單，付款方式為貨到付款。" />
      {placed && (
        <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800" role="status">
          <p className="font-bold">訂單已成立，謝謝你的購買！</p>
          <p className="mt-1">訂單編號 {placed}。我們出貨後會在這裡更新狀態和物流單號。</p>
        </div>
      )}
      {orders.length === 0 ? (
        <EmptyState title="目前還沒有訂單" desc="在產品頁加入購物車，到購物車按「前往結帳」就可以下單。" />
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((o) => {
            const view = toOrderView(o);
            return (
              <OrderCard
                key={view.id}
                order={view}
                actions={view.status === "pending" ? <CancelOrderButton orderId={view.id} orderNo={view.orderNo} /> : undefined}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
