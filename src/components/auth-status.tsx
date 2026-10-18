"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type User = { email: string; nickname: string } | null;

export default function AuthStatus() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | undefined>(undefined);

  // 換頁時重新確認登入狀態（例如登入後跳回首頁）
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  if (user === undefined) return null;

  if (!user) {
    return (
      <Link href="/login" className="text-sm font-medium text-ink/70 transition-colors hover:text-ink">
        登入
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="hidden max-w-40 truncate text-ink/70 md:inline" title={user.email}>
        嗨，{user.nickname}
      </span>
      <button
        onClick={handleLogout}
        className="font-medium text-ink/70 transition-colors hover:text-ink"
      >
        登出
      </button>
    </div>
  );
}
