import "server-only";
import { Types } from "mongoose";
import { ProductModel } from "@/models/product";
import { CounterModel } from "@/models/counter";
import { taipeiDateKey } from "@/lib/product-no";

type StockLine = { productId: string | Types.ObjectId; variantName: string; customColor: string; quantity: number };

// 扣庫存（或補回庫存，delta 是正數時）。用條件更新，庫存不夠就不會扣，兩個人同時買也不會超賣
// 自訂顏色：有分顏色的產品是接單訂製，不扣任何顏色；沒分顏色的產品扣總庫存
async function changeStock(line: StockLine, delta: number) {
  const id = new Types.ObjectId(String(line.productId));
  const product = await ProductModel.findById(id, { variants: 1 }).lean();
  if (!product) return delta > 0; // 產品被刪除了：補回時當作成功，扣的時候當作失敗
  const hasVariants = (product.variants ?? []).length > 0;

  if (line.customColor && hasVariants) return true;
  if (!line.customColor && hasVariants) {
    const filter =
      delta < 0
        ? { _id: id, variants: { $elemMatch: { name: line.variantName, stock: { $gte: -delta } } } }
        : { _id: id, "variants.name": line.variantName };
    const r = await ProductModel.updateOne(filter, { $inc: { "variants.$.stock": delta, stock: delta } });
    return r.matchedCount === 1 || delta > 0;
  }
  const filter = delta < 0 ? { _id: id, stock: { $gte: -delta } } : { _id: id };
  const r = await ProductModel.updateOne(filter, { $inc: { stock: delta } });
  return r.matchedCount === 1 || delta > 0;
}

// 一次扣好幾項；中間有一項不夠，前面扣掉的會全部補回去
export async function reserveStock(lines: StockLine[]) {
  const done: StockLine[] = [];
  for (const line of lines) {
    if (await changeStock(line, -line.quantity)) {
      done.push(line);
      continue;
    }
    for (const d of done) await changeStock(d, d.quantity);
    return { ok: false as const, failed: line };
  }
  return { ok: true as const };
}

// 訂單商品 → 補庫存需要的欄位（不要直接展開 mongoose 的子文件）
export function stockLineOf(item: { productId: Types.ObjectId | string; variantName?: string | null; customColor?: string | null; quantity: number }): StockLine {
  return {
    productId: item.productId.toString(),
    variantName: item.variantName ?? "",
    customColor: item.customColor ?? "",
    quantity: item.quantity,
  };
}

// 取消訂單時把庫存補回去
export async function restoreStock(lines: StockLine[]) {
  for (const line of lines) await changeStock(line, line.quantity);
}

// 訂單流水號（10 碼）：西元年後兩位＋月＋日（台灣時間）＋當天第幾筆（4 碼），例如 2610230001
// 用 $inc 一次加一，同時有人下單也不會拿到同一個號碼
export async function newOrderNo(date = new Date()) {
  const day = taipeiDateKey(date).slice(2); // 20261023 → 261023
  const counter = await CounterModel.findOneAndUpdate(
    { key: `order-${day}` },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" },
  );
  return `${day}${String(counter!.seq).padStart(4, "0")}`;
}
