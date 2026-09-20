import Link from "next/link";
import Logo from "@/components/logo";
import { FacebookIcon, InstagramIcon, LineIcon } from "@/components/icons";

const footerLinks = [
  { label: "首頁", href: "/" },
  { label: "關於我們", href: "#about" },
  { label: "產品選物", href: "#products" },
  { label: "聯絡我們", href: "#contact" },
];

export default function SiteFooter() {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <Logo variant="light" />

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/70">
          {footerLinks.map((link) => (
            <Link key={link.label} href={link.href} className="transition-colors hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col items-start gap-4 lg:items-end">
          <div className="flex items-center gap-3">
            {[InstagramIcon, FacebookIcon, LineIcon].map((Icon, i) => (
              <span
                key={i}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-white/80 transition-colors hover:border-white hover:text-white"
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
          <p className="text-xs text-white/50">
            © 2026 承禾生活科技 All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
