import "server-only";
import { cache } from "react";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { ProductModel } from "@/models/product";
import { channelFilter } from "@/lib/product-options";

// 前台可以看的產品：上架中而且有勾「官網」；找不到或沒上架就回傳 null
// 用 cache 包起來，同一次請求裡 generateMetadata 和頁面只查一次資料庫
export const getPublicProduct = cache(async (id: string) => {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  return ProductModel.findOne({ _id: id, status: "published", ...channelFilter("website") }).lean();
});
