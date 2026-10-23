import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/user";
import { PasswordResetModel } from "@/models/password-reset";
import { parseCredentials } from "@/lib/auth-input";
import {
  RESEND_COOLDOWN_SECONDS,
  codeExpiry,
  generateCode,
  hashCode,
  sendPasswordResetEmail,
} from "@/lib/verification";

// 第一步：寄出重設密碼的驗證碼（重新寄送也是打這支）
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { email, emailValid } = parseCredentials(body);

  if (!emailValid) {
    return NextResponse.json({ error: "請輸入有效的 Email 地址。" }, { status: 400 });
  }

  await connectDB();

  // 不論 Email 有沒有註冊都回同樣的結果，避免被用來試探哪些 Email 有註冊
  if (!(await UserModel.exists({ email }))) {
    return NextResponse.json({ ok: true });
  }

  // 冷卻時間內不重寄，但同樣不告訴對方，以免透露這個 Email 有註冊
  const existing = await PasswordResetModel.findOne({ email });
  if (
    existing &&
    Date.now() - existing.lastSentAt.getTime() < RESEND_COOLDOWN_SECONDS * 1000
  ) {
    return NextResponse.json({ ok: true });
  }

  const code = generateCode();
  await PasswordResetModel.findOneAndUpdate(
    { email },
    {
      email,
      codeHash: hashCode(code),
      attempts: 0,
      lastSentAt: new Date(),
      expiresAt: codeExpiry(),
    },
    { upsert: true },
  );

  await sendPasswordResetEmail(email, code);

  return NextResponse.json({ ok: true });
}
