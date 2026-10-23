"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth-shell";
import PasswordStrength from "@/components/password-strength";
import PasswordInput from "@/components/password-input";
import {
  RESEND_COOLDOWN_SECONDS,
  buttonClass,
  inputClass,
  labelClass,
  postJSON,
} from "@/components/auth-form";
import { passwordError } from "@/lib/password-policy";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "reset">("email");
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function run(action: () => Promise<void>) {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch {
      setError("網路異常，請稍後再試。");
    }
    setLoading(false);
  }

  async function sendCode() {
    const { ok, data } = await postJSON("/api/auth/password-reset", { email });
    if (!ok) {
      setError(data.error ?? "寄送失敗，請稍後再試。");
      return false;
    }
    setCooldown(RESEND_COOLDOWN_SECONDS);
    return true;
  }

  function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    run(async () => {
      if (await sendCode()) setStep("reset");
    });
  }

  function handleResend() {
    run(async () => {
      if (await sendCode()) {
        setCode("");
        setNotice("新的驗證碼已寄出。");
      }
    });
  }

  function handleReset(e: React.FormEvent) {
    e.preventDefault();
    const weakPassword = passwordError(password);
    if (weakPassword) {
      setError(weakPassword);
      return;
    }
    run(async () => {
      const { ok, data } = await postJSON("/api/auth/password-reset/confirm", {
        email,
        code,
        password,
      });
      if (!ok) {
        setError(data.error ?? "重設失敗，請稍後再試。");
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  if (step === "reset") {
    return (
      <AuthShell>
        <p className="text-xs font-medium tracking-[0.3em] text-ink/40">RESET</p>
        <h1 className="mt-3 text-2xl font-black text-ink">設定新密碼</h1>
        <p className="mt-3 text-sm text-ink/60">
          如果 <span className="font-medium text-ink">{email}</span>{" "}
          有註冊過，我們已寄出驗證碼，請在 10 分鐘內輸入。
        </p>
        <form onSubmit={handleReset} className="mt-8 flex flex-col gap-4">
          <label className={labelClass}>
            6 位數驗證碼
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className={`${inputClass} tracking-[0.5em]`}
            />
          </label>
          <label className={labelClass}>
            新密碼
            <PasswordInput
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            <PasswordStrength password={password} />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {notice && <p className="text-sm text-green-700">{notice}</p>}
          <button type="submit" disabled={loading} className={buttonClass}>
            {loading ? "處理中" : "重設密碼並登入"}
          </button>
        </form>
        <div className="mt-6 flex items-center justify-between text-sm text-ink/60">
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setError("");
              setNotice("");
            }}
            className="underline underline-offset-4 hover:text-ink"
          >
            修改 Email
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={loading || cooldown > 0}
            className="font-medium text-ink underline underline-offset-4 disabled:text-ink/40 disabled:no-underline"
          >
            {cooldown > 0 ? `${cooldown} 秒後可重新寄送` : "重新寄送驗證碼"}
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <p className="text-xs font-medium tracking-[0.3em] text-ink/40">FORGOT PASSWORD</p>
      <h1 className="mt-3 text-2xl font-black text-ink">忘記密碼</h1>
      <p className="mt-3 text-sm text-ink/60">輸入註冊時使用的 Email，我們會寄驗證碼給你。</p>
      <form onSubmit={handleRequest} className="mt-8 flex flex-col gap-4">
        <label className={labelClass}>
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? "寄送中" : "寄送驗證碼"}
        </button>
      </form>
      <p className="mt-6 text-sm text-ink/60">
        想起密碼了？
        <Link href="/login" className="ml-1 font-medium text-ink underline underline-offset-4">
          返回登入
        </Link>
      </p>
    </AuthShell>
  );
}
