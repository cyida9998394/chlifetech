import type { Metadata } from "next";
import AuthForm from "@/components/auth-form";

export const metadata: Metadata = { title: "建立帳號｜CH LIFE TECH 承禾生活科技" };

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
