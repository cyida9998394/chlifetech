import "server-only";
import { connection } from "next/server";
import { connectDB } from "@/lib/db";
import { ProductModel } from "@/models/product";
import { products as fallbackProducts } from "@/lib/products";
import { channelFilter, channelsOf } from "@/lib/product-options";

export type HomeProduct = {
  no: string;
  name: string;
  title: string;
  desc: string;
  tags: string[];
  image: string;
  photo: string;
  // 有在蝦皮販售而且有填連結，首頁才會出現「到蝦皮購買」
  shopeeUrl?: string;
  // 資料庫的產品才有產品頁
  href?: string;
  colors?: { name: string; color: string }[];
};

const DEFAULT_GRADIENT = "from-slate-100 via-white to-slate-200";

// 首頁的產品選物：有上架中的產品就用資料庫的，否則先用原本寫死的清單，避免首頁空白
export async function getHomeProducts(): Promise<HomeProduct[]> {
  // 每次有人瀏覽都重新讀取，後台上架後首頁馬上更新
  await connection();
  try {
    await connectDB();
    // 只顯示「上架中」而且通路有勾「官網」的產品
    const published = await ProductModel.find({ status: "published", ...channelFilter("website") })
      .sort({ sortOrder: 1, publishedAt: -1 })
      .lean();
    if (published.length === 0) return fallbackProducts;
    return published.map((p, i) => ({
      no: String(i + 1).padStart(2, "0"),
      name: p.name,
      title: "",
      desc: p.summary ?? "",
      tags: p.tags ?? [],
      image: DEFAULT_GRADIENT,
      photo: p.imageUrl ?? "",
      shopeeUrl: channelsOf(p).includes("shopee") && p.shopeeUrl ? p.shopeeUrl : undefined,
      href: `/products/${p._id.toString()}`,
      colors: (p.variants ?? []).map((v) => ({ name: v.name, color: v.color })),
    }));
  } catch (err) {
    // 資料庫連不上時首頁照常顯示
    console.error("讀取首頁產品失敗：", err);
    return fallbackProducts;
  }
}
