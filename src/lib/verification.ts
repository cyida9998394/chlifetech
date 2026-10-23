import "server-only";
import { createHash, randomInt, timingSafeEqual } from "crypto";
import { sendMail } from "@/lib/mailer";

export const CODE_TTL_MINUTES = 10;
export const RESEND_COOLDOWN_SECONDS = 60;
export const MAX_ATTEMPTS = 5;

export function generateCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export function codeMatches(code: string, codeHash: string) {
  const a = Buffer.from(hashCode(code), "hex");
  const b = Buffer.from(codeHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function codeExpiry() {
  return new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
}

function codeEmail(title: string, intro: string, code: string) {
  const note = `驗證碼 ${CODE_TTL_MINUTES} 分鐘內有效。如果這不是你本人的操作，請忽略這封信。`;
  return {
    subject: `${title}｜CH LIFE TECH 承禾生活科技`,
    text: `${intro}\n\n驗證碼：${code}\n\n${note}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1c2331">
        <h2 style="margin:0 0 16px">${title}</h2>
        <p>${intro}</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:24px 0">${code}</p>
        <p style="color:#666;font-size:13px">${note}</p>
      </div>`,
  };
}

export async function sendVerificationEmail(email: string, code: string) {
  await sendMail({ to: email, ...codeEmail("Email 驗證碼", "請輸入以下驗證碼完成註冊：", code) });
}

export async function sendPasswordResetEmail(email: string, code: string) {
  await sendMail({ to: email, ...codeEmail("重設密碼驗證碼", "請輸入以下驗證碼來設定新密碼：", code) });
}

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

// 管理者刪除會員前，確認碼寄到管理者自己的信箱
export async function sendDeleteUserEmail(adminEmail: string, code: string, targetEmail: string) {
  await sendMail({
    to: adminEmail,
    ...codeEmail("刪除會員確認碼", `你正在刪除會員 ${escapeHtml(targetEmail)}，請輸入以下確認碼完成刪除：`, code),
  });
}
