import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/user";
import { PendingRegistrationModel } from "@/models/pending-registration";
import { createSession } from "@/lib/session";
import { MAX_ATTEMPTS, codeMatches } from "@/lib/verification";

// 第二步：驗證碼正確才正式建立帳號並登入
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";

  if (!email || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "請輸入 6 位數驗證碼。" }, { status: 400 });
  }

  await connectDB();
  const pending = await PendingRegistrationModel.findOne({ email });

  if (!pending || pending.expiresAt.getTime() < Date.now()) {
    return NextResponse.json(
      { error: "驗證碼已過期，請重新寄送驗證碼。" },
      { status: 410 },
    );
  }
  if (pending.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "錯誤次數過多，請重新寄送驗證碼。" },
      { status: 429 },
    );
  }
  if (!codeMatches(code, pending.codeHash)) {
    pending.attempts += 1;
    await pending.save();
    const left = MAX_ATTEMPTS - pending.attempts;
    return NextResponse.json(
      {
        error:
          left > 0 ? `驗證碼錯誤，還可以再試 ${left} 次。` : "錯誤次數過多，請重新寄送驗證碼。",
      },
      { status: 400 },
    );
  }

  if (await UserModel.exists({ email })) {
    await pending.deleteOne();
    return NextResponse.json({ error: "這個 Email 已經註冊過了。" }, { status: 409 });
  }

  const user = await UserModel.create({
    email,
    passwordHash: pending.passwordHash,
    name: pending.name,
    nickname: pending.nickname,
    emailVerifiedAt: new Date(),
  });
  await pending.deleteOne();

  await createSession({ userId: user._id.toString(), email: user.email, nickname: user.nickname });

  return NextResponse.json({ user: { email: user.email, nickname: user.nickname } }, { status: 201 });
}
