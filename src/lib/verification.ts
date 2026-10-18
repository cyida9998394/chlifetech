import "server-only";
import { createHash, randomInt, timingSafeEqual } from "crypto";

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

// 目前先印在終端機，之後接上 Gmail / Resend 時只要改這個函式
export async function sendVerificationEmail(email: string, code: string) {
  console.log(`\n[驗證碼] ${email} 的驗證碼是 ${code}（${CODE_TTL_MINUTES} 分鐘內有效）\n`);
}
