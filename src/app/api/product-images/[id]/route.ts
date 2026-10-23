import { NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { ProductImageModel } from "@/models/product-image";

// 提供後台上傳的產品圖片；圖片內容不會變（換圖會產生新的網址），所以可以長時間快取
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/product-images/[id]">) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return new Response("Not found", { status: 404 });

  await connectDB();
  // 不用 lean()：這樣 data 才會是 Buffer，而不是 MongoDB 的 Binary 物件
  const image = await ProductImageModel.findById(id);
  if (!image) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.contentType,
      "Content-Length": String(image.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
