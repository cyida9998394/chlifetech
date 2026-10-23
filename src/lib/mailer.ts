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
    // 開發時沒設定 Gmail 也能測試：信件內容改印在終端機
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[未設定 Gmail，信件改印在這裡] 寄給 ${to}：${subject}\n${text}\n`);
      return;
    }
    throw new Error("缺少 GMAIL_USER 或 GMAIL_APP_PASSWORD 環境變數。");
  }

  await mailer.sendMail({
    from: `"${SENDER_NAME}" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
}
