import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { cartCount } from "@/lib/cart";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/user";

export async function GET() {
  const user = await getCurrentUser();
  // 一般會員多回傳購物車件數，給上方的購物車圖示顯示
  const member = user && user.role !== "admin";
  const count = member ? await cartCount(user.id) : 0;
  // 產品頁的配送方式預設成會員上次選的
  let deliveryMethod = "home";
  if (member) {
    await connectDB();
    deliveryMethod = (await UserModel.findById(user.id, { deliveryMethod: 1 }).lean())?.deliveryMethod ?? "home";
  }
  return NextResponse.json({
    user: user
      ? { email: user.email, nickname: user.nickname, role: user.role, cartCount: count, deliveryMethod }
      : null,
  });
}
