import { redirect } from "next/navigation";
import { requireUserPage } from "@/lib/auth";
import { getCartLines } from "@/lib/cart";
import { connectDB } from "@/lib/db";
import { findDelivery, DEFAULT_DELIVERY } from "@/lib/delivery";
import { UserModel } from "@/models/user";
import CartList from "@/components/account/cart-list";
import { PageTitle } from "@/components/admin/ui";

export default async function AccountCartPage() {
  const me = await requireUserPage();
  if (me.role === "admin") redirect("/account");
  const lines = await getCartLines(me.id);
  await connectDB();
  const saved = (await UserModel.findById(me.id, { deliveryMethod: 1 }).lean())?.deliveryMethod;
  const delivery = findDelivery(saved)?.value ?? DEFAULT_DELIVERY;

  return (
    <>
      <PageTitle title="購物車" desc="準備結帳的商品。價格和庫存會依照最新的產品資料。" />
      <CartList initial={lines} delivery={delivery} />
    </>
  );
}
