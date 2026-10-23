"use server";

import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/models/order";
import { SettingModel } from "@/models/setting";
import { restoreStock, stockLineOf } from "@/lib/orders";
import { MAX_PRICE } from "@/lib/product-options";
import { MAX_TRACKING, ORDER_STATUSES, orderStatusLabel } from "@/lib/order-options";

export type AdminOrderResult = { ok: boolean; message: string };

function revalidateOrders() {
  revalidatePath("/admin", "layout");
  revalidatePath("/account/orders");
}

// 改訂單狀態和物流單號；改成「已取消」時把庫存補回去，已取消的訂單不能再改
export async function updateOrder(orderId: string, status: string, trackingNo: string): Promise<AdminOrderResult> {
  const admin = await requireAdmin();
  if (!isValidObjectId(orderId)) return { ok: false, message: "找不到這筆訂單。" };
  const next = ORDER_STATUSES.find((s) => s.value === status)?.value;
  if (!next) return { ok: false, message: "請選擇訂單狀態。" };
  const tracking = String(trackingNo ?? "").trim();
  if (tracking.length > MAX_TRACKING) return { ok: false, message: `物流單號最多 ${MAX_TRACKING} 個字。` };

  await connectDB();
  const order = await OrderModel.findById(orderId);
  if (!order) return { ok: false, message: "找不到這筆訂單。" };
  if (order.status === "cancelled") return { ok: false, message: "已取消的訂單不能再修改（庫存已經補回去了）。" };

  const statusChanged = order.status !== next;
  if (statusChanged) {
    // 用條件更新，避免和會員同時取消時重複補庫存
    const updated = await OrderModel.findOneAndUpdate(
      { _id: orderId, status: order.status },
      { $set: { status: next, trackingNo: tracking }, $push: { statusHistory: { status: next, by: admin.nickname } } },
    );
    if (!updated) return { ok: false, message: "訂單狀態剛剛被改過了，請重新整理頁面。" };
    if (next === "cancelled") await restoreStock(order.items.map(stockLineOf));
  } else {
    order.trackingNo = tracking;
    await order.save();
  }

  revalidateOrders();
  return { ok: true, message: statusChanged ? `已改成「${orderStatusLabel(next)}」。` : "已儲存。" };
}

// 運費設定：宅配、超商的運費，和滿額免運門檻（0 = 沒有免運）
export async function saveShippingSettings(input: { home: number; cvs: number; freeOver: number }): Promise<AdminOrderResult> {
  const admin = await requireAdmin();
  const values = [input.home, input.cvs, input.freeOver].map((v) => Number(v));
  if (values.some((v) => !Number.isInteger(v) || v < 0 || v > MAX_PRICE)) {
    return { ok: false, message: "運費和免運門檻要是 0 以上的整數。" };
  }
  const [home, cvs, freeOver] = values;
  await connectDB();
  await SettingModel.updateOne(
    { key: "shipping" },
    { $set: { value: { home, cvs, freeOver }, updatedBy: admin.nickname } },
    { upsert: true },
  );
  revalidatePath("/admin/orders");
  revalidatePath("/account", "layout");
  return { ok: true, message: "已儲存運費設定。" };
}
