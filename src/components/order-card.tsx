import Image from "next/image";
import { formatDate } from "@/components/admin/ui";
import { PAYMENT_LABEL, cvsBrandLabel, orderStatusLabel } from "@/lib/order-options";

export type OrderView = {
  id: string;
  orderNo: string;
  createdAt: Date | string;
  status: string;
  items: { productNo: string; name: string; variantName: string; customColor: string; imageUrl: string; price: number; quantity: number }[];
  subtotal: number;
  shippingFee: number;
  total: number;
  delivery: { method: string; recipientName: string; phone: string; address: string; cvsBrand: string; cvsStore: string };
  note: string;
  trackingNo: string;
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  shipped: "bg-brand-soft text-brand-navy",
  completed: "bg-green-50 text-green-700",
  cancelled: "bg-mist text-ink/50",
};

// 訂單卡片：會員的「我的訂單」和後台都用這個顯示訂單內容
export default function OrderCard({ order, actions }: { order: OrderView; actions?: React.ReactNode }) {
  const d = order.delivery;
  return (
    <article className="rounded-2xl border border-line bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-bold tabular-nums text-ink">
            <span className="mr-1.5 text-xs font-medium text-ink/50">訂單編號</span>
            {order.orderNo}
          </p>
          <p className="mt-0.5 text-xs text-ink/50">{formatDate(new Date(order.createdAt))}</p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[order.status] ?? STATUS_BADGE.pending}`}>
          {orderStatusLabel(order.status)}
        </span>
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {order.items.map((item, i) => (
          <li key={i} className="flex items-center gap-3">
            <span className="relative h-14 w-11 shrink-0 overflow-hidden rounded-md bg-mist">
              {item.imageUrl && <Image src={item.imageUrl} alt="" fill unoptimized sizes="44px" className="object-cover" />}
            </span>
            <span className="min-w-0 flex-1 text-sm">
              <span className="block text-ink">
                {item.name}
                {item.productNo && <span className="ml-1.5 text-xs tabular-nums text-ink/40">#{item.productNo}</span>}
              </span>
              <span className="block text-xs text-ink/50">
                {item.customColor ? `自訂 ${item.customColor.toUpperCase()}・` : item.variantName ? `${item.variantName}・` : ""}
                NT${item.price.toLocaleString()} × {item.quantity}
              </span>
            </span>
            <span className="text-sm tabular-nums text-ink">NT${(item.price * item.quantity).toLocaleString()}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 grid gap-4 border-t border-line pt-4 text-sm sm:grid-cols-2">
        <dl className="flex flex-col gap-1 text-ink/70">
          <div>
            <dt className="inline text-ink/50">配送：</dt>
            <dd className="inline">
              {d.method === "cvs" ? `超商取貨（${cvsBrandLabel(d.cvsBrand)} ${d.cvsStore}）` : `宅配到府（${d.address}）`}
            </dd>
          </div>
          <div>
            <dt className="inline text-ink/50">收件人：</dt>
            <dd className="inline">
              {d.recipientName}・{d.phone}
            </dd>
          </div>
          <div>
            <dt className="inline text-ink/50">付款：</dt>
            <dd className="inline">{PAYMENT_LABEL}</dd>
          </div>
          {order.trackingNo && (
            <div>
              <dt className="inline text-ink/50">物流單號：</dt>
              <dd className="inline font-medium text-ink select-all">{order.trackingNo}</dd>
            </div>
          )}
          {order.note && (
            <div>
              <dt className="inline text-ink/50">備註：</dt>
              <dd className="inline">{order.note}</dd>
            </div>
          )}
        </dl>
        <dl className="flex flex-col gap-1 sm:items-end">
          <div className="flex gap-3 text-ink/60">
            <dt>小計</dt>
            <dd className="tabular-nums">NT${order.subtotal.toLocaleString()}</dd>
          </div>
          <div className="flex gap-3 text-ink/60">
            <dt>運費</dt>
            <dd className="tabular-nums">{order.shippingFee === 0 ? "免運" : `NT$${order.shippingFee.toLocaleString()}`}</dd>
          </div>
          <div className="flex items-baseline gap-3">
            <dt className="font-bold text-ink">總計</dt>
            <dd className="text-lg font-black tabular-nums text-brand-navy">NT${order.total.toLocaleString()}</dd>
          </div>
        </dl>
      </div>

      {actions && <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-line pt-4">{actions}</div>}
    </article>
  );
}

// 資料庫的訂單 → 畫面用的資料
export function toOrderView(o: {
  _id: { toString(): string };
  orderNo: string;
  createdAt: Date;
  status?: string | null;
  items: {
    productNo?: string | null;
    name: string;
    variantName?: string | null;
    customColor?: string | null;
    imageUrl?: string | null;
    price: number;
    quantity: number;
  }[];
  subtotal: number;
  shippingFee: number;
  total: number;
  delivery?: {
    method: string;
    recipientName: string;
    phone: string;
    address?: string | null;
    cvsBrand?: string | null;
    cvsStore?: string | null;
  } | null;
  note?: string | null;
  trackingNo?: string | null;
}): OrderView {
  const d = o.delivery;
  return {
    id: o._id.toString(),
    orderNo: o.orderNo,
    createdAt: o.createdAt,
    status: o.status ?? "pending",
    items: o.items.map((i) => ({
      productNo: i.productNo ?? "",
      name: i.name,
      variantName: i.variantName ?? "",
      customColor: i.customColor ?? "",
      imageUrl: i.imageUrl ?? "",
      price: i.price,
      quantity: i.quantity,
    })),
    subtotal: o.subtotal,
    shippingFee: o.shippingFee,
    total: o.total,
    delivery: {
      method: d?.method ?? "home",
      recipientName: d?.recipientName ?? "",
      phone: d?.phone ?? "",
      address: d?.address ?? "",
      cvsBrand: d?.cvsBrand ?? "",
      cvsStore: d?.cvsStore ?? "",
    },
    note: o.note ?? "",
    trackingNo: o.trackingNo ?? "",
  };
}
