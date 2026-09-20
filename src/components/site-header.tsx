import Link from "next/link";
import Logo from "@/components/logo";
import MobileNav from "@/components/mobile-nav";
import { ArrowRightIcon, CartIcon, SearchIcon } from "@/components/icons";

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

        <div className="flex items-center gap-3 sm:gap-5">
          <button
            aria-label="搜尋"
            className="hidden text-ink/70 transition-colors hover:text-ink md:block"
          >
            <SearchIcon className="h-5 w-5" />
          </button>
          <button
            aria-label="購物車"
            className="hidden text-ink/70 transition-colors hover:text-ink md:block"
          >
            <CartIcon className="h-5 w-5" />
          </button>
          <Link
            href="#products"
            className="group inline-flex items-center gap-2 rounded-full bg-ink px-3.5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ink/85 sm:px-5"
          >
            <span className="hidden sm:inline">探索更好的生活</span>
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <MobileNav navLinks={navLinks} />
        </div>
      </div>
    </header>
  );
}
