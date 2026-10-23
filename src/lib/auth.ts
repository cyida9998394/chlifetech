import "server-only";
import { isValidObjectId } from "mongoose";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { UserModel, type Role } from "@/models/user";

export type CurrentUser = { id: string; email: string; nickname: string; role: Role };

// 每次都回資料庫確認，身份被修改或帳號被刪除會立即生效
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session || !isValidObjectId(session.userId)) return null;

  await connectDB();
  const user = await UserModel.findById(session.userId).lean();
  if (!user) return null;

  return {
    id: user._id.toString(),
    email: user.email,
    nickname: user.nickname ?? user.email,
    role: user.role === "admin" ? "admin" : "user",
  };
}

// 會員中心頁面用：沒登入就導回登入頁
export async function requireUserPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// Server Action 用：沒登入直接拒絕
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("請先登入。");
  return user;
}

// 後台頁面用：不是管理者就導回登入頁
export async function requireAdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");
  return user;
}

// Server Action 用：不是管理者直接拒絕
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") throw new Error("沒有權限執行這個動作。");
  return user;
}
