import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/forgot-password-form";

export const metadata: Metadata = { title: "忘記密碼｜CH LIFE TECH 承禾生活科技" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
