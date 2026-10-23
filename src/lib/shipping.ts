import "server-only";
import { connectDB } from "@/lib/db";
import { SettingModel } from "@/models/setting";
import type { ShippingSettings } from "@/lib/order-options";

// 讀取後台設定的運費；還沒設定時都是 0
export async function getShippingSettings(): Promise<ShippingSettings> {
  await connectDB();
  const row = await SettingModel.findOne({ key: "shipping" }).lean();
  const v = (row?.value ?? {}) as Partial<ShippingSettings>;
  const num = (x: unknown) => (Number.isInteger(x) && (x as number) >= 0 ? (x as number) : 0);
  return { home: num(v.home), cvs: num(v.cvs), freeOver: num(v.freeOver) };
}
