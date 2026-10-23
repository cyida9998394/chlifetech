import Link from "next/link";
import Logo from "@/components/logo";
import MobileNav from "@/components/mobile-nav";
import AuthStatus from "@/components/auth-status";

const navLinks = [
  { label: "首頁", href: "/", active: true },
  { label: "關於我們", href: "#about" },
  { label: "產品選物", href: "#products" },
  { label: "聯絡我們", href: "#contact" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur">
      <div className="relative mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
        <Link href="/">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-ink/80 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`relative pb-1 transition-colors hover:text-ink ${
                link.active ? "text-ink" : ""
              }`}
            >
              {link.label}
              {link.active && (
                <span className="absolute -bottom-[1px] left-0 h-[2px] w-full bg-ink" />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <AuthStatus />
          <MobileNav navLinks={navLinks} />
        </div>
      </div>
    </header>
  );
}
