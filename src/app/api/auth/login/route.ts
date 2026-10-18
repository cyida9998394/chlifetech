import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/user";
import { createSession } from "@/lib/session";
import { parseCredentials } from "@/lib/auth-input";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { email, password, emailValid } = parseCredentials(body);

  if (!emailValid || !password) {
    return NextResponse.json({ error: "請輸入 Email 和密碼。" }, { status: 400 });
  }

  await connectDB();
  const user = await UserModel.findOne({ email });

  // 帳號不存在或密碼錯誤都回同一個訊息，避免被用來試探哪些 Email 有註冊
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "Email 或密碼錯誤。" }, { status: 401 });
  }

  // 早期註冊的帳號沒有暱稱，先用 Email 代替
  const nickname = user.nickname ?? user.email;
  await createSession({ userId: user._id.toString(), email: user.email, nickname });

  return NextResponse.json({ user: { email: user.email, nickname } });
}
