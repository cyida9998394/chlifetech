"use client";

import { useState } from "react";
import { ArrowRightIcon } from "@/components/icons";

type Status = "idle" | "loading" | "success" | "error";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "訂閱失敗，請稍後再試。");
        return;
      }
      setStatus("success");
      setMessage(data.message ?? "訂閱成功！");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("網路異常，請稍後再試。");
    }
  }

  if (status === "success") {
    return (
      <p className="text-sm font-medium text-white">🎉 {message}</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-2 sm:items-end">
      <div className="flex w-full items-center gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="輸入你的 Email"
          className="w-full rounded-full border border-white/30 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/50 outline-none focus:border-white/70"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white hover:text-ink disabled:opacity-60"
        >
          {status === "loading" ? "傳送中" : "訂閱"}
          <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
      {status === "error" && (
        <p className="text-xs text-red-300">{message}</p>
      )}
    </form>
  );
}
