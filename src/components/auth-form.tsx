"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth-shell";
import PasswordStrength from "@/components/password-strength";
import { passwordError } from "@/lib/password-policy";

type Mode = "login" | "register";

const RESEND_COOLDOWN_SECONDS = 60;

const copy = {
  login: {
    cardEyebrow: "SIGN IN",
    title: "會員登入",
    submit: "登入",
    loading: "登入中",
    endpoint: "/api/auth/login",
    switchText: "還沒有帳號？",
    switchLabel: "立即註冊",
    switchHref: "/register",
  },
  register: {
    cardEyebrow: "SIGN UP",
    title: "建立帳號",
    submit: "寄送驗證碼",
    loading: "寄送中",
    endpoint: "/api/auth/register",
    switchText: "已經有帳號了？",
    switchLabel: "前往登入",
    switchHref: "/login",
  },
};

const inputClass =
  "rounded-xl border border-line bg-white/90 px-4 py-2.5 text-ink outline-none transition-colors focus:border-ink";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium text-ink/80";
const buttonClass =
  "mt-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-ink/85 disabled:opacity-60";

async function postJSON(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const t = copy[mode];

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

  function finishLogin() {
    router.push("/");
    router.refresh();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "register") {
      const weakPassword = passwordError(password);
      if (weakPassword) {
        setError(weakPassword);
        return;
      }
    }
    run(async () => {
      const body = mode === "register" ? { name, nickname, email, password } : { email, password };
      const { ok, data } = await postJSON(t.endpoint, body);
      if (!ok) {
        setError(data.error ?? "發生錯誤，請稍後再試。");
        return;
      }
      if (mode === "login") {
        finishLogin();
        return;
      }
      setStep("verify");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    });
  }

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    run(async () => {
      const { ok, data } = await postJSON("/api/auth/register/verify", { email, code });
      if (!ok) {
        setError(data.error ?? "驗證失敗，請稍後再試。");
        return;
      }
      finishLogin();
    });
  }

  function handleResend() {
    run(async () => {
      const { ok, data } = await postJSON("/api/auth/register/resend", { email });
      if (!ok) {
        setError(data.error ?? "寄送失敗，請稍後再試。");
        return;
      }
      setCode("");
      setNotice("新的驗證碼已寄出。");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    });
  }

  if (step === "verify") {
    return (
      <AuthShell>
        <p className="text-xs font-medium tracking-[0.3em] text-ink/40">VERIFY</p>
        <h1 className="mt-3 text-2xl font-black text-ink">驗證 Email</h1>
        <p className="mt-3 text-sm text-ink/60">
          驗證碼已寄到 <span className="font-medium text-ink">{email}</span>，請在 10 分鐘內輸入。
        </p>
        <form onSubmit={handleVerify} className="mt-8 flex flex-col gap-4">
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          {notice && <p className="text-sm text-green-700">{notice}</p>}
          <button type="submit" disabled={loading} className={buttonClass}>
            {loading ? "驗證中" : "完成註冊"}
          </button>
        </form>
        <div className="mt-6 flex items-center justify-between text-sm text-ink/60">
          <button
            type="button"
            onClick={() => {
              setStep("form");
              setError("");
              setNotice("");
            }}
            className="underline underline-offset-4 hover:text-ink"
          >
            修改註冊資料
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
      <p className="text-xs font-medium tracking-[0.3em] text-ink/40">{t.cardEyebrow}</p>
      <h1 className="mt-3 text-2xl font-black text-ink">{t.title}</h1>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        {mode === "register" && (
          <>
            <label className={labelClass}>
              姓名
              <input
                required
                maxLength={50}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              暱稱
              <input
                required
                maxLength={30}
                autoComplete="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className={inputClass}
              />
              <span className="text-xs font-normal text-ink/50">會顯示在網站上</span>
            </label>
          </>
        )}
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
        <label className={labelClass}>
          密碼
          <input
            type="password"
            required
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          {mode === "register" && <PasswordStrength password={password} />}
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? t.loading : t.submit}
        </button>
      </form>
      <p className="mt-6 text-sm text-ink/60">
        {t.switchText}
        <Link href={t.switchHref} className="ml-1 font-medium text-ink underline underline-offset-4">
          {t.switchLabel}
        </Link>
      </p>
    </AuthShell>
  );
}
