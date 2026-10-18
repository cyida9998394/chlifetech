import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PendingRegistrationModel } from "@/models/pending-registration";
import {
  RESEND_COOLDOWN_SECONDS,
  codeExpiry,
  generateCode,
  hashCode,
  sendVerificationEmail,
} from "@/lib/verification";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  await connectDB();
  const pending = await PendingRegistrationModel.findOne({ email });

  if (!pending) {
    return NextResponse.json(
      { error: "找不到這筆註冊資料，請重新填寫註冊表單。" },
      { status: 404 },
    );
  }

  const waitSeconds = Math.ceil(
    RESEND_COOLDOWN_SECONDS - (Date.now() - pending.lastSentAt.getTime()) / 1000,
  );
  if (waitSeconds > 0) {
    return NextResponse.json({ error: `請 ${waitSeconds} 秒後再重新寄送。` }, { status: 429 });
  }

  const code = generateCode();
  pending.codeHash = hashCode(code);
  pending.attempts = 0;
  pending.lastSentAt = new Date();
  pending.expiresAt = codeExpiry();
  await pending.save();

  await sendVerificationEmail(email, code);

  return NextResponse.json({ ok: true });
}
