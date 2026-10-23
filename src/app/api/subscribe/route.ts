import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { SubscriberModel } from "@/models/subscriber";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "請輸入有效的 Email 地址。" }, { status: 400 });
  }

  await connectDB();

  if (await SubscriberModel.exists({ email })) {
    return NextResponse.json({ message: "這個 Email 已經在名單中囉！" });
  }

  await SubscriberModel.create({ email });

  return NextResponse.json({ message: "訂閱成功，感謝加入！" });
}
