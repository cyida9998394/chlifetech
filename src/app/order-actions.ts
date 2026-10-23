"use server";

import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getCartLines } from "@/lib/cart";
import { getShippingSettings } from "@/lib/shipping";
import { newOrderNo, reserveStock, restoreStock, stockLineOf } from "@/lib/orders";
import { CartItemModel } from "@/models/cart-item";
import { OrderModel } from "@/models/order";
import { UserModel } from "@/models/user";
import { findDelivery } from "@/lib/delivery";
import {
  CVS_BRANDS,
  MAX_ADDRESS,
  MAX_ORDER_NOTE,
  MAX_RECIPIENT_NAME,
  MAX_STORE,
  isValidPhone,
  shippingFee,
} from "@/lib/order-options";

export type OrderResult = { ok: boolean; message: string; orderNo?: string };

export type CheckoutInput = {
  method: string;
  recipientName: string;
  phone: string;
  address: string;
  cvsBrand: string;
  cvsStore: string;
  note: string;
  // 勾選時把這次的收件資料存成會員的預設收件資料
  saveAsDefault?: boolean;
};

// 結帳：檢查購物車、扣庫存、建立訂單（貨到付款）、清空購物車
export async function placeOrder(input: CheckoutInput): Promise<OrderResult> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, message: "請先登入會員。" };
  if (me.role === "admin") return { ok: false, message: "管理者帳號不能下單。" };

  const delivery = findDelivery(input.method);
  const recipientName = String(input.recipientName ?? "").trim();
  const phone = String(input.phone ?? "").trim();
  const address = String(input.address ?? "").trim();
  const cvsBrand = CVS_BRANDS.find((b) => b.value === input.cvsBrand)?.value ?? "";
  const cvsStore = String(input.cvsStore ?? "").trim();
  const note = String(input.note ?? "").trim();

  if (!delivery) return { ok: false, message: "請選擇配送方式。" };
  if (!recipientName || recipientName.length > MAX_RECIPIENT_NAME) return { ok: false, message: "請輸入收件人姓名。" };
  if (!isValidPhone(phone)) return { ok: false, message: "請輸入正確的聯絡電話，例如 0912-345-678。" };
  if (delivery.value === "home" && (address.length < 6 || address.length > MAX_ADDRESS)) {
    return { ok: false, message: "請輸入完整的收件地址。" };
  }
  if (delivery.value === "cvs" && (!cvsBrand || !cvsStore || cvsStore.length > MAX_STORE)) {
    return { ok: false, message: "請選擇超商並輸入門市名稱或店號。" };
  }
  if (note.length > MAX_ORDER_NOTE) return { ok: false, message: `備註最多 ${MAX_ORDER_NOTE} 個字。` };

  // 用最新的價格和庫存再檢查一次購物車
  const lines = await getCartLines(me.id);
  if (lines.length === 0) return { ok: false, message: "購物車是空的。" };
  const problem = lines.find((l) => l.available < l.quantity);
  if (problem) {
    return {
      ok: false,
      message: problem.available > 0 ? `「${problem.name}」庫存只剩 ${problem.available} 件，請調整數量。` : `「${problem.name}」目前無法購買，請先從購物車移除。`,
    };
  }

  const reserved = await reserveStock(lines);
  if (!reserved.ok) {
    const name = lines.find((l) => l.productId === String(reserved.failed.productId))?.name ?? "有商品";
    return { ok: false, message: `「${name}」剛剛被買走了，庫存不夠，請回購物車調整。` };
  }

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const fee = shippingFee(await getShippingSettings(), delivery.value, subtotal);
  try {
    await connectDB();
    const order = await OrderModel.create({
      orderNo: await newOrderNo(),
      userId: me.id,
      email: me.email,
      items: lines.map((l) => ({
        productId: l.productId,
        productNo: l.productNo,
        name: l.name,
        variantName: l.variantName,
        customColor: l.customColor,
        imageUrl: l.imageUrl,
        price: l.price,
        quantity: l.quantity,
      })),
      subtotal,
      shippingFee: fee,
      total: subtotal + fee,
      paymentMethod: "cod",
      delivery: {
        method: delivery.value,
        recipientName,
        phone,
        address: delivery.value === "home" ? address : "",
        cvsBrand: delivery.value === "cvs" ? cvsBrand : "",
        cvsStore: delivery.value === "cvs" ? cvsStore : "",
      },
      note,
      status: "pending",
      statusHistory: [{ status: "pending", by: me.nickname }],
    });
    await CartItemModel.deleteMany({ userId: me.id });
    // 下次結帳預設用這次的配送方式；有勾選的話也更新預設收件資料（只改這次用到的欄位）
    const update: Record<string, string> = { deliveryMethod: delivery.value };
    if (input.saveAsDefault) {
      update["shippingInfo.recipientName"] = recipientName;
      update["shippingInfo.phone"] = phone;
      if (delivery.value === "home") update["shippingInfo.address"] = address;
      else {
        update["shippingInfo.cvsBrand"] = cvsBrand;
        update["shippingInfo.cvsStore"] = cvsStore;
      }
    }
    await UserModel.updateOne({ _id: me.id }, { $set: update });

    revalidatePath("/account", "layout");
    revalidatePath("/admin", "layout");
    return { ok: true, message: "訂單已成立。", orderNo: order.orderNo };
  } catch (error) {
    // 建立訂單失敗時把庫存補回去
    await restoreStock(lines);
    console.error("建立訂單失敗：", error);
    return { ok: false, message: "建立訂單失敗，請稍後再試。" };
  }
}

// 會員取消自己還沒出貨的訂單，庫存補回去
export async function cancelMyOrder(orderId: string): Promise<OrderResult> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, message: "請先登入會員。" };
  if (!isValidObjectId(orderId)) return { ok: false, message: "找不到這筆訂單。" };

  await connectDB();
  // 只有「待出貨」可以取消；用條件更新避免和管理者同時改狀態
  const order = await OrderModel.findOneAndUpdate(
    { _id: orderId, userId: me.id, status: "pending" },
    { $set: { status: "cancelled" }, $push: { statusHistory: { status: "cancelled", by: me.nickname } } },
  );
  if (!order) return { ok: false, message: "這筆訂單已經出貨或取消，不能再取消。" };
  await restoreStock(order.items.map(stockLineOf));

  revalidatePath("/account", "layout");
  revalidatePath("/admin", "layout");
  return { ok: true, message: "已取消訂單。" };
}
