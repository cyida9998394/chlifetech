import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/user";
import { PendingRegistrationModel } from "@/models/pending-registration";
import {
  MAX_NAME_LENGTH,
  MAX_NICKNAME_LENGTH,
  parseCredentials,
  parseProfile,
} from "@/lib/auth-input";
import { passwordError } from "@/lib/password-policy";
import {
  RESEND_COOLDOWN_SECONDS,
  codeExpiry,
  generateCode,
  hashCode,
  sendVerificationEmail,
} from "@/lib/verification";

// 第一步：收到註冊資料後先寄出驗證碼，帳號要等驗證成功才會建立
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { email, password, emailValid } = parseCredentials(body);
  const { name, nickname } = parseProfile(body);

  if (!name || name.length > MAX_NAME_LENGTH) {
    return NextResponse.json({ error: "請輸入姓名。" }, { status: 400 });
  }
  if (!nickname || nickname.length > MAX_NICKNAME_LENGTH) {
    return NextResponse.json(
      { error: `請輸入暱稱（最多 ${MAX_NICKNAME_LENGTH} 個字）。` },
      { status: 400 },
    );
  }
  if (!emailValid) {
    return NextResponse.json({ error: "請輸入有效的 Email 地址。" }, { status: 400 });
  }
  const weakPassword = passwordError(password);
  if (weakPassword) {
    return NextResponse.json({ error: weakPassword }, { status: 400 });
  }

  await connectDB();

  if (await UserModel.exists({ email })) {
    return NextResponse.json({ error: "這個 Email 已經註冊過了。" }, { status: 409 });
  }

  const existing = await PendingRegistrationModel.findOne({ email });
  if (existing) {
    const waitSeconds = Math.ceil(
      RESEND_COOLDOWN_SECONDS - (Date.now() - existing.lastSentAt.getTime()) / 1000,
    );
    if (waitSeconds > 0) {
      return NextResponse.json(
        { error: `驗證碼剛寄出，請 ${waitSeconds} 秒後再試。` },
        { status: 429 },
      );
    }
  }

  const code = generateCode();
  await PendingRegistrationModel.findOneAndUpdate(
    { email },
    {
      email,
      name,
      nickname,
      passwordHash: await bcrypt.hash(password, 12),
      codeHash: hashCode(code),
      attempts: 0,
      lastSentAt: new Date(),
      expiresAt: codeExpiry(),
    },
    { upsert: true },
  );

  await sendVerificationEmail(email, code);

  return NextResponse.json({ pending: true, email });
}
