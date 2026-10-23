import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { CartItemModel } from "@/models/cart-item";
import { ProductModel } from "@/models/product";
import { channelsOf, purchaseModeOf } from "@/lib/product-options";

// 一次最多買幾個（也受庫存限制）
export const MAX_CART_QUANTITY = 10;

type ProductLike = {
  status?: string | null;
  purchaseMode?: string | null;
  channels?: string[] | null;
  price: number;
  stock: number;
  variants?: { name: string; stock: number; imageUrl?: string | null }[] | null;
};

// 這個產品（和顏色）現在可以買幾個；0 = 不能買
export function availableStock(p: ProductLike, variantName: string) {
  if (p.status !== "published" || !channelsOf(p).includes("website") || p.price <= 0) return 0;
  if (purchaseModeOf(p) === "shopee") return 0;
  const variants = p.variants ?? [];
  if (variants.length === 0) return variantName ? 0 : p.stock;
  return variants.find((v) => v.name === variantName)?.stock ?? 0;
}

export type CartLine = {
  id: string;
  productId: string;
  productNo: string;
  name: string;
  imageUrl: string;
  variantName: string;
  customColor: string;
  price: number;
  quantity: number;
  // 現在最多可以買幾個；比數量少表示庫存不夠或已下架
  available: number;
  shopeeUrl: string | null;
};

// 會員購物車的內容，和最新的產品資料（價格、庫存、圖片）合在一起
export async function getCartLines(userId: string): Promise<CartLine[]> {
  await connectDB();
  const items = await CartItemModel.find({ userId }).sort({ createdAt: 1 }).lean();
  const products = await ProductModel.find({ _id: { $in: items.map((i) => i.productId) } }).lean();
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  return items.flatMap((item) => {
    const p = byId.get(item.productId.toString());
    if (!p) return []; // 產品被刪除了
    const variant = (p.variants ?? []).find((v) => v.name === item.variantName);
    return [
      {
        id: item._id.toString(),
        productId: p._id.toString(),
        productNo: p.productNo ?? "",
        name: p.name,
        imageUrl: variant?.imageUrl || p.imageUrl || "",
        variantName: item.variantName ?? "",
        customColor: item.customColor ?? "",
        price: p.price,
        quantity: item.quantity,
        // 自訂顏色不對應任何一個顏色，用產品的總庫存計算
        available: Math.min(
          item.customColor ? availableStock({ ...p, variants: [] }, "") : availableStock(p, item.variantName ?? ""),
          MAX_CART_QUANTITY,
        ),
        shopeeUrl: channelsOf(p).includes("shopee") && p.shopeeUrl ? p.shopeeUrl : null,
      },
    ];
  });
}

export async function cartCount(userId: string) {
  await connectDB();
  const [row] = await CartItemModel.aggregate<{ total: number }>([
    { $match: { userId: new Types.ObjectId(userId) } },
    { $group: { _id: null, total: { $sum: "$quantity" } } },
  ]);
  return row?.total ?? 0;
}
