import "server-only";
import { CounterModel } from "@/models/counter";

// 台灣時間的日期，例如 20261023
export function taipeiDateKey(date = new Date()) {
  return new Date(date.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, "");
}

// 產品編號：建立日期＋當天第幾個（3 位數），例如 20261023001；用 $inc 一次加一，同時新增也不會重複
export async function nextProductNo(date = new Date()) {
  const day = taipeiDateKey(date);
  const counter = await CounterModel.findOneAndUpdate(
    { key: `product-${day}` },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" },
  );
  return `${day}${String(counter!.seq).padStart(3, "0")}`;
}
