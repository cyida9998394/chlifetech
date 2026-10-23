import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/user";
import { PasswordResetModel } from "@/models/password-reset";
import { createSession } from "@/lib/session";
import { passwordError } from "@/lib/password-policy";
import { MAX_ATTEMPTS, codeMatches } from "@/lib/verification";

// 第二步：驗證碼正確才更新密碼，並直接登入
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "請輸入 6 位數驗證碼。" }, { status: 400 });
  }
  const weakPassword = passwordError(password);
  if (weakPassword) {
    return NextResponse.json({ error: weakPassword }, { status: 400 });
  }

  await connectDB();
  const reset = await PasswordResetModel.findOne({ email });

  if (!reset || reset.expiresAt.getTime() < Date.now()) {
    return NextResponse.json(
      { error: "驗證碼錯誤或已過期，請重新寄送驗證碼。" },
      { status: 410 },
    );
  }
  if (reset.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "錯誤次數過多，請重新寄送驗證碼。" },
      { status: 429 },
    );
  }
  if (!codeMatches(code, reset.codeHash)) {
    reset.attempts += 1;
    await reset.save();
    const left = MAX_ATTEMPTS - reset.attempts;
    return NextResponse.json(
      {
        error:
          left > 0 ? `驗證碼錯誤，還可以再試 ${left} 次。` : "錯誤次數過多，請重新寄送驗證碼。",
      },
      { status: 400 },
    );
  }

  const user = await UserModel.findOneAndUpdate(
    { email },
    { passwordHash: await bcrypt.hash(password, 12) },
    { returnDocument: "after" },
  );
  await reset.deleteOne();

  if (!user) {
    return NextResponse.json({ error: "找不到這個帳號。" }, { status: 404 });
  }

  const nickname = user.nickname ?? user.email;
  await createSession({ userId: user._id.toString(), email: user.email, nickname });

  return NextResponse.json({ user: { email: user.email, nickname } });
}
