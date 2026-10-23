import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { requireUserPage } from "@/lib/auth";
import { getCartLines } from "@/lib/cart";
import { getShippingSettings } from "@/lib/shipping";
import { DEFAULT_DELIVERY, findDelivery } from "@/lib/delivery";
import { UserModel } from "@/models/user";
import { EMPTY_SHIPPING_INFO } from "@/lib/order-options";
import CheckoutForm from "@/components/account/checkout-form";
import BackLink from "@/components/back-link";
import { PageTitle } from "@/components/admin/ui";

export default async function CheckoutPage() {
  const me = await requireUserPage();
  if (me.role === "admin") redirect("/account");
  const lines = await getCartLines(me.id);
  // 購物車是空的或有商品不能買，回購物車處理
  if (lines.length === 0 || lines.some((l) => l.available < l.quantity)) redirect("/account/cart");

  await connectDB();
  const user = await UserModel.findById(me.id, { name: 1, deliveryMethod: 1, shippingInfo: 1 }).lean();
  const saved = { ...EMPTY_SHIPPING_INFO, ...(user?.shippingInfo ?? {}) };
  const shipping = await getShippingSettings();

  return (
    <>
      <div className="mb-4">
        <BackLink href="/account/cart">回購物車</BackLink>
      </div>
      <PageTitle title="結帳" desc="填寫收件資料，確認後送出訂單。付款方式為貨到付款。" />
      <CheckoutForm
        lines={lines}
        shipping={shipping}
        saved={{ ...saved, recipientName: saved.recipientName || user?.name || "" }}
        defaultDelivery={findDelivery(user?.deliveryMethod)?.value ?? DEFAULT_DELIVERY}
      />
    </>
  );
}
