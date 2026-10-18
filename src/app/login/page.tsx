import type { Metadata } from "next";
import AuthForm from "@/components/auth-form";

export const metadata: Metadata = { title: "會員登入｜CH LIFE TECH 承禾生活科技" };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
