"use server";

import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { CartItemModel } from "@/models/cart-item";
import { ProductModel } from "@/models/product";
import { MAX_CART_QUANTITY, availableStock, cartCount } from "@/lib/cart";
import { normalizeHex } from "@/lib/product-options";
import { findDelivery } from "@/lib/delivery";
import { UserModel } from "@/models/user";

export type CartResult = { ok: boolean; message: string; needLogin?: boolean; count?: number };

async function requireMember(): Promise<{ id: string } | CartResult> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, message: "請先登入會員。", needLogin: true };
  if (me.role === "admin") return { ok: false, message: "管理者帳號不能使用購物車。" };
  return me;
}

// 加入購物車：同一個產品、顏色已經在購物車裡就把數量加上去，但不能超過庫存
export async function addToCart(input: {
  productId: string;
  variantName: string;
  customColor: string;
  quantity: number;
  // 產品頁選的配送方式，加入購物車時一起記下來
  deliveryMethod?: string;
}): Promise<CartResult> {
  const me = await requireMember();
  if (!("id" in me)) return me;

  const quantity = Math.floor(Number(input.quantity));
  if (!isValidObjectId(input.productId) || !Number.isInteger(quantity) || quantity < 1) {
    return { ok: false, message: "資料不正確，請重新整理後再試。" };
  }
  const customColor = input.customColor ? normalizeHex(String(input.customColor)) : "";
  if (customColor === null) return { ok: false, message: "自訂顏色的色碼不正確。" };

  await connectDB();
  const product = await ProductModel.findById(input.productId).lean();
  if (!product) return { ok: false, message: "找不到這個產品。" };
  if (product.purchaseMode === "shopee") return { ok: false, message: "這個商品請到蝦皮購買。" };

  const variants = product.variants ?? [];
  const variantName = String(input.variantName ?? "");
  // 有分顏色時，一般顏色要選清單裡的；自訂顏色不對應任何一個顏色
  if (!customColor && variants.length > 0 && !variants.some((v) => v.name === variantName)) {
    return { ok: false, message: "請選擇顏色。" };
  }
  if (customColor && !product.customizer?.enabled) return { ok: false, message: "這個產品沒有開放自訂顏色。" };

  // 自訂顏色用產品的總庫存計算
  const stock = customColor
    ? availableStock({ ...product, variants: [] }, "")
    : availableStock(product, variantName);
  const limit = Math.min(stock, MAX_CART_QUANTITY);
  if (limit <= 0) return { ok: false, message: "這個商品目前無法購買。" };

  const key = { userId: me.id, productId: product._id, variantName: customColor ? "" : variantName, customColor };
  const existing = await CartItemModel.findOne(key);
  const next = (existing?.quantity ?? 0) + quantity;
  if (next > limit) {
    return {
      ok: false,
      message: existing
        ? `購物車裡已經有 ${existing.quantity} 個，這個商品最多只能買 ${limit} 個。`
        : `這個商品最多只能買 ${limit} 個。`,
    };
  }
  await CartItemModel.updateOne(key, { $set: { quantity: next } }, { upsert: true });
  const delivery = findDelivery(input.deliveryMethod);
  if (delivery) await UserModel.updateOne({ _id: me.id }, { deliveryMethod: delivery.value });

  revalidatePath("/account/cart");
  return { ok: true, message: "已加入購物車。", count: await cartCount(me.id) };
}

// 購物車頁面改數量；數量 0 就是移除
export async function updateCartItem(itemId: string, quantity: number): Promise<CartResult> {
  const me = await requireMember();
  if (!("id" in me)) return me;
  if (!isValidObjectId(itemId)) return { ok: false, message: "資料不正確。" };

  await connectDB();
  const item = await CartItemModel.findOne({ _id: itemId, userId: me.id });
  if (!item) return { ok: false, message: "購物車裡找不到這個商品。" };

  const qty = Math.floor(Number(quantity));
  if (!Number.isInteger(qty) || qty <= 0) {
    await item.deleteOne();
  } else {
    const product = await ProductModel.findById(item.productId).lean();
    const stock = product
      ? item.customColor
        ? availableStock({ ...product, variants: [] }, "")
        : availableStock(product, item.variantName ?? "")
      : 0;
    const limit = Math.min(stock, MAX_CART_QUANTITY);
    if (qty > limit) return { ok: false, message: limit > 0 ? `最多只能買 ${limit} 個。` : "這個商品目前無法購買。" };
    item.quantity = qty;
    await item.save();
  }
  revalidatePath("/account/cart");
  return { ok: true, message: "已更新。", count: await cartCount(me.id) };
}

// 購物車頁面改配送方式（整筆訂單共用一種）
export async function setDeliveryMethod(value: string): Promise<CartResult> {
  const me = await requireMember();
  if (!("id" in me)) return me;
  const delivery = findDelivery(value);
  if (!delivery) return { ok: false, message: "請選擇配送方式。" };
  await connectDB();
  await UserModel.updateOne({ _id: me.id }, { deliveryMethod: delivery.value });
  return { ok: true, message: `已改成${delivery.label}。` };
}
