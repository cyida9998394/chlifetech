import Image from "next/image";

export default function Logo({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const isLight = variant === "light";
  return (
    <div className="flex items-center gap-2.5">
      <Image
        src="/ch-logo.png"
        alt="CH Life Tech"
        width={462}
        height={277}
        className="h-9 w-auto"
        style={{ width: "auto" }}
        priority
      />
      <div className="leading-tight">
        <p
          className={`text-sm font-bold tracking-wide ${
            isLight ? "text-white" : "text-ink"
          }`}
        >
          CH LIFE TECH
        </p>
        <p
          className={`w-full text-justify text-[11px] font-medium [text-align-last:justify] [text-justify:inter-character] ${
            isLight ? "text-white/60" : "text-ink/50"
          }`}
        >
          承禾生活科技
        </p>
      </div>
    </div>
  );
}
