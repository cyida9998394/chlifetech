import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

const SENDER_NAME = "CH LIFE TECH 承禾生活科技";

let transporter: Transporter | null = null;

// 用 Gmail 的「應用程式密碼」寄信，帳密設定在 .env.local
function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  transporter ??= nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
  return transporter;
}

export async function sendMail({ to, subject, text, html }: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const mailer = getTransporter();
  if (!mailer) {
    // 還沒設定 Gmail（開發中或線上暫時）：不報錯，信件內容改寫在紀錄裡（本機是終端機、線上是 Vercel 的 Logs）
    // 設定好 GMAIL_USER 和 GMAIL_APP_PASSWORD 之後就會真的寄出
    console.warn(`[未設定 Gmail，信件改寫在紀錄] 寄給 ${to}：${subject}\n${text}`);
    return;
  }

  await mailer.sendMail({
    from: `"${SENDER_NAME}" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
}
