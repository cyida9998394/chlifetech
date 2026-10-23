"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CartIcon,
  DashboardIcon,
  LoginIcon,
  LogoutIcon,
  UserIcon,
  UserPlusIcon,
} from "@/components/icons";

// 手機版只顯示 icon，平板以上才顯示文字
const pillClass =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-ink p-2 font-medium text-ink transition-colors hover:bg-ink hover:text-white sm:px-4";

// 只有 icon 的圓形按鈕，滑鼠移上去會顯示名稱
const iconButtonClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink text-ink transition-colors hover:bg-ink hover:text-white";

// 購物車只給一般會員和訪客（訪客點了會先導到登入頁）
function CartButton({ count = 0 }: { count?: number }) {
  return (
    <Link
      href="/account/cart"
      aria-label={count > 0 ? `購物車（${count} 件）` : "購物車"}
      title="購物車"
      className={`${iconButtonClass} relative`}
    >
      <CartIcon className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

type User = { email: string; nickname: string; role: "user" | "admin"; cartCount?: number } | null;

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

  // 加入購物車或改數量後，馬上更新圖示上的數字
  useEffect(() => {
    const onCart = (e: Event) => {
      const count = (e as CustomEvent<number | undefined>).detail;
      if (typeof count === "number") setUser((u) => (u ? { ...u, cartCount: count } : u));
    };
    window.addEventListener("cart:updated", onCart);
    return () => window.removeEventListener("cart:updated", onCart);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  if (user === undefined) return null;

  if (!user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link href="/login" aria-label="會員登入" className={pillClass}>
          <LoginIcon className="h-4 w-4" />
          <span className="hidden sm:inline">會員登入</span>
        </Link>
        <Link href="/register" aria-label="註冊" className={pillClass}>
          <UserPlusIcon className="h-4 w-4" />
          <span className="hidden sm:inline">註冊</span>
        </Link>
        <CartButton />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="hidden max-w-40 truncate text-ink/70 md:inline" title={user.email}>
        您好，{user.nickname}
      </span>
      <Link href="/account" aria-label="會員中心" title="會員中心" className={iconButtonClass}>
        <UserIcon className="h-4 w-4" />
      </Link>
      {user.role === "admin" && (
        <Link href="/admin" aria-label="後台" title="後台" className={iconButtonClass}>
          <DashboardIcon className="h-4 w-4" />
        </Link>
      )}
      <button onClick={handleLogout} aria-label="登出" title="登出" className={iconButtonClass}>
        <LogoutIcon className="h-4 w-4" />
      </button>
      {user.role !== "admin" && <CartButton count={user.cartCount} />}
    </div>
  );
}
