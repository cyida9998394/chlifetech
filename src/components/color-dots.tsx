// 小小的顏色圓點，列出產品有哪些顏色
export default function ColorDots({
  variants,
  size = "sm",
}: {
  variants: { name: string; color: string }[];
  size?: "sm" | "md";
}) {
  if (variants.length === 0) return null;
  const dot = size === "md" ? "h-4 w-4" : "h-3 w-3";
  return (
    <span className="inline-flex items-center gap-1" aria-label={`顏色：${variants.map((v) => v.name).join("、")}`}>
      {variants.map((v) => (
        <span
          key={v.name}
          title={v.name}
          className={`${dot} rounded-full border border-ink/20`}
          style={{ backgroundColor: v.color }}
        />
      ))}
    </span>
  );
}
