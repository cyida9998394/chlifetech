"use server";

import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { MAX_NAME_LENGTH, MAX_NICKNAME_LENGTH } from "@/lib/auth-input";
import { UserModel } from "@/models/user";
import { PendingRegistrationModel } from "@/models/pending-registration";
import { SubscriberModel } from "@/models/subscriber";
import { DeleteConfirmationModel } from "@/models/delete-confirmation";
import { MessageModel, moveLegacyReply } from "@/models/message";
import { LEGACY_REPLY_ID, MAX_REPLIES } from "@/lib/message-thread";
import { GoalModel } from "@/models/goal";
import { MAX_GOAL, findGoalMetric } from "@/lib/goals";
import { MAX_MESSAGE_LENGTH } from "@/lib/message-limits";
import {
  MAX_ATTEMPTS,
  RESEND_COOLDOWN_SECONDS,
  codeExpiry,
  codeMatches,
  generateCode,
  hashCode,
  sendDeleteUserEmail,
} from "@/lib/verification";

export type ActionResult = { ok: boolean; message: string };

function getId(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!isValidObjectId(id)) throw new Error("資料編號不正確。");
  return id;
}

export async function updateUser(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const id = getId(formData);
  const name = String(formData.get("name") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim();
  const role = formData.get("role") === "admin" ? "admin" : "user";

  if (!name || name.length > MAX_NAME_LENGTH) return { ok: false, message: "請輸入姓名。" };
  if (!nickname || nickname.length > MAX_NICKNAME_LENGTH) {
    return { ok: false, message: `請輸入暱稱（最多 ${MAX_NICKNAME_LENGTH} 個字）。` };
  }
  // 避免把自己降級後，再也沒有人能進後台
  if (id === admin.id && role !== "admin") {
    return { ok: false, message: "不能移除自己的管理者身份。" };
  }

  const updated = await UserModel.findByIdAndUpdate(id, { name, nickname, role });
  if (!updated) return { ok: false, message: "找不到這位會員，可能已被刪除。" };

  revalidatePath("/admin", "layout");
  return { ok: true, message: "已儲存。" };
}

// 刪除會員第一步：把確認碼寄到管理者自己的信箱
export async function requestDeleteUserCode(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!isValidObjectId(id)) return { ok: false, message: "資料編號不正確。" };
  if (id === admin.id) return { ok: false, message: "不能刪除自己的帳號。" };

  const target = await UserModel.findById(id).lean();
  if (!target) return { ok: false, message: "找不到這位會員，可能已被刪除。" };

  const existing = await DeleteConfirmationModel.findOne({ adminId: admin.id });
  if (existing) {
    const waitSeconds = Math.ceil(
      RESEND_COOLDOWN_SECONDS - (Date.now() - existing.lastSentAt.getTime()) / 1000,
    );
    // 同一位會員在冷卻時間內不重寄，沿用剛寄出的確認碼
    if (waitSeconds > 0 && existing.targetId === id) {
      return { ok: true, message: `確認碼剛寄出，${waitSeconds} 秒後才能重新寄送。` };
    }
  }

  const code = generateCode();
  await DeleteConfirmationModel.findOneAndUpdate(
    { adminId: admin.id },
    {
      adminId: admin.id,
      targetId: id,
      codeHash: hashCode(code),
      attempts: 0,
      lastSentAt: new Date(),
      expiresAt: codeExpiry(),
    },
    { upsert: true },
  );
  await sendDeleteUserEmail(admin.email, code, target.email);

  return { ok: true, message: `確認碼已寄到 ${admin.email}。` };
}

// 刪除會員第二步：確認碼正確才真的刪除
export async function deleteUser(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const id = getId(formData);
  const code = String(formData.get("code") ?? "").trim();
  if (id === admin.id) return { ok: false, message: "不能刪除自己的帳號。" };
  if (!/^\d{6}$/.test(code)) return { ok: false, message: "請輸入 6 位數確認碼。" };

  const confirmation = await DeleteConfirmationModel.findOne({ adminId: admin.id, targetId: id });
  if (!confirmation || confirmation.expiresAt.getTime() < Date.now()) {
    return { ok: false, message: "確認碼已過期，請重新寄送。" };
  }
  if (confirmation.attempts >= MAX_ATTEMPTS) {
    return { ok: false, message: "錯誤次數過多，請重新寄送確認碼。" };
  }
  if (!codeMatches(code, confirmation.codeHash)) {
    confirmation.attempts += 1;
    await confirmation.save();
    const left = MAX_ATTEMPTS - confirmation.attempts;
    return {
      ok: false,
      message: left > 0 ? `確認碼錯誤，還可以再試 ${left} 次。` : "錯誤次數過多，請重新寄送確認碼。",
    };
  }

  await confirmation.deleteOne();
  await UserModel.findByIdAndDelete(id);
  revalidatePath("/admin", "layout");
  return { ok: true, message: "已刪除。" };
}

export async function deletePendingRegistration(formData: FormData) {
  await requireAdmin();
  await PendingRegistrationModel.findByIdAndDelete(getId(formData));
  revalidatePath("/admin", "layout");
}

export async function deleteSubscriber(formData: FormData) {
  await requireAdmin();
  await SubscriberModel.findByIdAndDelete(getId(formData));
  revalidatePath("/admin", "layout");
}

function readReplyBody(formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  if (!body || body.length > MAX_MESSAGE_LENGTH) {
    return { body, error: `請輸入回覆內容（最多 ${MAX_MESSAGE_LENGTH} 個字）。` };
  }
  return { body, error: null };
}

function revalidateMessages() {
  revalidatePath("/admin", "layout");
  revalidatePath("/account/messages");
}

// 管理者在留言串新增一則回覆
export async function replyMessage(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const id = getId(formData);
  const { body, error } = readReplyBody(formData);
  if (error) return { ok: false, message: error };

  const message = await MessageModel.findById(id);
  if (!message) return { ok: false, message: "找不到這則留言，可能已被刪除。" };
  moveLegacyReply(message);
  if (message.replies.length >= MAX_REPLIES) {
    return { ok: false, message: "這則留言的對話已經太長了，請另外聯絡會員。" };
  }

  const now = new Date();
  message.replies.push({ author: "admin", authorName: admin.nickname, body, createdAt: now });
  message.lastFrom = "admin";
  message.lastActivityAt = now;
  await message.save();

  revalidateMessages();
  return { ok: true, message: "已送出回覆。" };
}

// 管理者修改已送出的回覆（只能改管理者的回覆，會員的留言不能改）
export async function editReply(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const id = getId(formData);
  const replyId = String(formData.get("replyId") ?? "");
  const { body, error } = readReplyBody(formData);
  if (error) return { ok: false, message: error };

  const message = await MessageModel.findById(id);
  if (!message) return { ok: false, message: "找不到這則留言，可能已被刪除。" };

  const wasLegacy = replyId === LEGACY_REPLY_ID && message.replies.length === 0;
  moveLegacyReply(message);
  const target = wasLegacy ? message.replies[0] : message.replies.id(replyId);
  if (!target || target.author !== "admin") return { ok: false, message: "找不到這則回覆。" };
  if (target.body === body) return { ok: true, message: "內容沒有變更。" };

  target.body = body;
  target.editedAt = new Date();
  target.editedBy = admin.nickname;
  await message.save();

  revalidateMessages();
  return { ok: true, message: "已修改。" };
}

export async function deleteMessage(formData: FormData) {
  await requireAdmin();
  await MessageModel.findByIdAndDelete(getId(formData));
  revalidateMessages();
}

// 設定總覽的目標數；清空就是取消目標
export async function setGoal(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const metric = findGoalMetric(formData.get("metric"));
  if (!metric) return { ok: false, message: "找不到這個目標項目。" };

  const raw = String(formData.get("target") ?? "").trim();
  if (!raw) {
    await GoalModel.deleteOne({ metric: metric.key });
    revalidatePath("/admin");
    return { ok: true, message: "已取消目標。" };
  }

  const target = Number(raw);
  if (!Number.isInteger(target) || target < 1 || target > MAX_GOAL) {
    return { ok: false, message: `目標要是 1 到 ${MAX_GOAL.toLocaleString()} 之間的整數。` };
  }

  await GoalModel.findOneAndUpdate(
    { metric: metric.key },
    { metric: metric.key, target, updatedBy: admin.nickname },
    { upsert: true },
  );
  revalidatePath("/admin");
  return { ok: true, message: "已儲存目標。" };
}
