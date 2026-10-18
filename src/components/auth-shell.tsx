import Image from "next/image";
import Reveal from "@/components/reveal";

// 登入、註冊共用的版面：官網的淡色背景，中間是表單卡片
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <Image src="/about-bg.webp" alt="" fill priority sizes="100vw" className="object-cover" />

      <div className="relative flex items-center justify-center px-4 py-12 sm:px-6 lg:min-h-[calc(100vh-5rem)] lg:py-16">
        <Reveal className="w-full max-w-md rounded-3xl border border-white/70 bg-white/85 p-7 shadow-[0_20px_60px_-20px_rgba(28,35,49,0.25)] backdrop-blur-md sm:p-10">
          {children}
        </Reveal>
      </div>
    </section>
  );
}
