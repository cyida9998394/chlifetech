import Link from "next/link";
import { connectDB } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth";
import { OrderModel } from "@/models/order";
import { getShippingSettings } from "@/lib/shipping";
import { ORDER_STATUSES } from "@/lib/order-options";
import OrderCard, { toOrderView } from "@/components/order-card";
import OrderControls from "@/components/admin/order-controls";
import ShippingSettingsForm from "@/components/admin/shipping-settings-form";
import { PageTitle } from "@/components/admin/ui";

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function filterHref(status: string, q: string) {
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (q) query.set("q", q);
  const qs = query.toString();
  return qs ? `/admin/orders?${qs}` : "/admin/orders";
}

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdminPage();
  const params = await searchParams;
  const status = ORDER_STATUSES.find((s) => s.value === params.status)?.value ?? "";
  const q = typeof params.q === "string" ? params.q.trim() : "";

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (q) {
    const re = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ orderNo: re }, { email: re }, { "delivery.recipientName": re }, { "delivery.phone": re }];
  }

  await connectDB();
  const [orders, counts, shipping] = await Promise.all([
    OrderModel.find(filter).sort({ createdAt: -1 }).limit(200).lean(),
    OrderModel.aggregate<{ _id: string; count: number }>([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    getShippingSettings(),
  ]);
  const countOf = (s: string) => counts.find((c) => c._id === s)?.count ?? 0;
  const total = counts.reduce((sum, c) => sum + c.count, 0);

  return (
    <>
      <PageTitle title="訂單管理" desc={`官網訂單（貨到付款），目前 ${countOf("pending")} 筆待出貨。`} />

      <section className="mb-6 rounded-2xl border border-line bg-white p-6">
        <p className="mb-4 text-sm font-bold text-ink">運費設定</p>
        <ShippingSettingsForm initial={shipping} />
      </section>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[{ value: "", label: "全部", count: total }, ...ORDER_STATUSES.map((s) => ({ ...s, count: countOf(s.value) }))].map((f) => (
            <Link
              key={f.value}
              href={filterHref(f.value, q)}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                status === f.value ? "border-ink bg-ink text-white" : "border-line bg-white text-ink/60 hover:text-ink"
              }`}
            >
              {f.label} <span className="opacity-60">{f.count}</span>
            </Link>
          ))}
        </div>
        <form className="flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="搜尋訂單編號、姓名、電話、Email"
            className="w-64 rounded-full border border-line bg-white px-4 py-2 text-sm outline-none focus:border-ink"
          />
          <button className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/85">搜尋</button>
        </form>
      </div>

      {orders.length === 0 ? (
        <p className="rounded-2xl border border-line bg-white px-6 py-10 text-center text-sm text-ink/40">沒有符合的訂單</p>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((o) => {
            const view = toOrderView(o);
            return (
              <div key={view.id}>
                <p className="mb-1.5 text-xs text-ink/50">
                  會員：
                  <Link href={`/admin/users/${o.userId}`} className="hover:underline">
                    {o.email}
                  </Link>
                </p>
                <OrderCard
                  order={view}
                  actions={<OrderControls orderId={view.id} status={view.status} trackingNo={view.trackingNo} />}
                />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
