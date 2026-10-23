"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { MAX_NAME_LENGTH, MAX_NICKNAME_LENGTH } from "@/lib/auth-input";
import { passwordError } from "@/lib/password-policy";
import { UserModel } from "@/models/user";
import {
  CONTACT_METHODS,
  MAX_CONTACT_LENGTH,
  MAX_MESSAGE_LENGTH,
  findCategory,
} from "@/lib/message-limits";
import { isValidObjectId } from "mongoose";
import { MessageModel, moveLegacyReply } from "@/models/message";
import { MAX_REPLIES } from "@/lib/message-thread";
import { cleanShippingInfo } from "@/lib/order-options";

// 防止洗版：一小時內最多留幾則
const MAX_MESSAGES_PER_HOUR = 5;

export type ActionResult = { ok: boolean; message: string };

// 會員只能改自己的姓名和暱稱，Email 和身份不開放修改
export async function updateProfile(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const me = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim();

  if (!name || name.length > MAX_NAME_LENGTH) return { ok: false, message: "請輸入姓名。" };
  if (!nickname || nickname.length > MAX_NICKNAME_LENGTH) {
    return { ok: false, message: `請輸入暱稱（最多 ${MAX_NICKNAME_LENGTH} 個字）。` };
  }

  await connectDB();
  await UserModel.findByIdAndUpdate(me.id, { name, nickname });

  revalidatePath("/account", "layout");
  return { ok: true, message: "已儲存。" };
}

export async function changePassword(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const me = await requireUser();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("password") ?? "");

  const weakPassword = passwordError(next);
  if (weakPassword) return { ok: false, message: weakPassword };

  await connectDB();
  const user = await UserModel.findById(me.id);
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) {
    return { ok: false, message: "目前的密碼不正確。" };
  }
  if (await bcrypt.compare(next, user.passwordHash)) {
    return { ok: false, message: "新密碼不能和目前的密碼相同。" };
  }

  user.passwordHash = await bcrypt.hash(next, 12);
  await user.save();
  return { ok: true, message: "密碼已更新。" };
}

export async function sendMessage(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const me = await requireUser();
  if (me.role === "admin") return { ok: false, message: "管理者請到後台的「會員留言」查看留言。" };
  const category = findCategory(formData.get("category"));
  const body = String(formData.get("body") ?? "").trim();

  if (!category) return { ok: false, message: "請選擇問題類型。" };
  // 相關訂單（orderId）等訂單功能完成後再接上：要檢查訂單屬於這位會員
  const method = CONTACT_METHODS.find((m) => m.value === formData.get("contactMethod"));
  const contact = String(formData.get("contact") ?? "").trim();

  if (!method) return { ok: false, message: "請選擇聯絡方式。" };
  if (!contact || contact.length > MAX_CONTACT_LENGTH) {
    return { ok: false, message: `請輸入你的${method.label}。` };
  }
  if (method.value === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
    return { ok: false, message: "請輸入有效的 Email 地址。" };
  }
  if (method.value === "phone" && !/^[\d\s()+-]{8,20}$/.test(contact)) {
    return { ok: false, message: "請輸入有效的電話號碼。" };
  }
  if (!body || body.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, message: `請輸入留言內容（最多 ${MAX_MESSAGE_LENGTH} 個字）。` };
  }

  await connectDB();
  const recent = await MessageModel.countDocuments({
    userId: me.id,
    createdAt: { $gt: new Date(Date.now() - 60 * 60 * 1000) },
  });
  if (recent >= MAX_MESSAGES_PER_HOUR) {
    return { ok: false, message: "留言次數太多了，請稍後再試。" };
  }

  await MessageModel.create({
    userId: me.id,
    email: me.email,
    nickname: me.nickname,
    category: category.value,
    contactMethod: method.value,
    contact,
    body,
    lastFrom: "member",
    lastActivityAt: new Date(),
  });

  revalidatePath("/account/messages");
  revalidatePath("/admin", "layout");
  return { ok: true, message: "已送出，我們會盡快回覆你。" };
}

// 會員在自己的留言串補充說明，留言會回到「待處理」
export async function replyAsMember(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const me = await requireUser();
  if (me.role === "admin") return { ok: false, message: "管理者請到後台的「會員留言」回覆。" };
  const id = String(formData.get("id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!isValidObjectId(id)) return { ok: false, message: "找不到這則留言。" };
  if (!body || body.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, message: `請輸入內容（最多 ${MAX_MESSAGE_LENGTH} 個字）。` };
  }

  await connectDB();
  // 只能回覆自己的留言
  const message = await MessageModel.findOne({ _id: id, userId: me.id });
  if (!message) return { ok: false, message: "找不到這則留言。" };
  moveLegacyReply(message);
  if (message.replies.length >= MAX_REPLIES) {
    return { ok: false, message: "這則留言的對話已經太長了，請重新留言。" };
  }

  const now = new Date();
  message.replies.push({ author: "member", authorName: me.nickname, body, createdAt: now });
  message.lastFrom = "member";
  message.lastActivityAt = now;
  await message.save();

  revalidatePath("/account/messages");
  revalidatePath("/admin", "layout");
  return { ok: true, message: "已送出。" };
}

// 會員資料頁：儲存預設收件資料
export async function updateShippingInfo(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const me = await requireUser();
  const { info, error } = cleanShippingInfo({
    recipientName: formData.get("recipientName"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    cvsBrand: formData.get("cvsBrand"),
    cvsStore: formData.get("cvsStore"),
  });
  if (error) return { ok: false, message: error };
  await connectDB();
  await UserModel.updateOne({ _id: me.id }, { shippingInfo: info });
  revalidatePath("/account", "layout");
  return { ok: true, message: "已儲存收件資料，結帳時會自動帶入。" };
}
