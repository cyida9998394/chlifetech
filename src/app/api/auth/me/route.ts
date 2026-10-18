import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  return NextResponse.json({ user: session ? { email: session.email, nickname: session.nickname } : null });
}
