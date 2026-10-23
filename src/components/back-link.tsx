import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";

// 「回上一層」的膠囊按鈕：外框＋左箭頭
export default function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium text-ink/70 transition-colors hover:border-brand-navy hover:text-brand-navy"
    >
      <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
      {children}
    </Link>
  );
}
