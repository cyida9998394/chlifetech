// 有待處理的事情時顯示的小驚嘆號，數字可省略
export default function AlertBadge({ label, size = "md" }: { label: string; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "h-4 w-4 text-[10px]" : "h-7 w-7 text-sm";
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-amber-400 font-black text-white shadow-[0_2px_0_0_#d97706] motion-safe:animate-nudge ${sizeClass}`}
    >
      !
    </span>
  );
}
