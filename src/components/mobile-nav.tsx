"use client";

import { useState } from "react";
import Link from "next/link";

type NavLink = {
  label: string;
  href: string;
  active?: boolean;
};

export default function MobileNav({ navLinks }: { navLinks: NavLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        aria-label={open ? "關閉選單" : "開啟選單"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 flex-col items-center justify-center gap-1.5 text-ink"
      >
        <span
          className={`h-[1.5px] w-5 bg-current transition-transform ${
            open ? "translate-y-[3.5px] rotate-45" : ""
          }`}
        />
        <span
          className={`h-[1.5px] w-5 bg-current transition-transform ${
            open ? "-translate-y-[3.5px] -rotate-45" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full border-b border-line bg-white px-6 py-4 shadow-sm">
          <nav className="flex flex-col gap-4 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className={link.active ? "text-ink" : "text-ink/70"}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
