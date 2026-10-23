"use client";

import Image from "next/image";
import ColorPreview from "@/components/color-preview";
import CustomColorPicker from "@/components/custom-color-picker";

type Variant = { name: string; color: string; stock: number; imageUrl: string };
type Customizer = { baseUrl: string; maskUrl: string };

// 數字是第幾個顏色，"custom" 是自訂顏色
export type ColorSelection = number | "custom";

// 自訂顏色的預設值和快速色票
export const DEFAULT_CUSTOM_COLOR = "#3a78ad";
const EXTRA_PRESETS = [
  { name: "櫻花粉", color: "#f4a7b9" },
  { name: "薄荷綠", color: "#8fd3b6" },
  { name: "奶茶", color: "#c8a98b" },
  { name: "檸檬黃", color: "#f2d64b" },
  { name: "薰衣草", color: "#b9a7e6" },
];

const tileClass = "relative aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 via-white to-slate-200";

// 產品頁左邊的照片牆：第一張是目前選的顏色（或自訂顏色預覽），後面是更多產品照片
// 電腦版兩欄排列，手機版左右滑動
export function ProductImages({
  name,
  heroUrl,
  heroAlt,
  gallery,
  customizer,
  customColor,
}: {
  name: string;
  // 第一張大圖：選到的顏色的照片，沒有就用主圖
  heroUrl: string;
  heroAlt: string;
  gallery: string[];
  // 有值就表示正在看「自訂」顏色，第一張改成換色預覽
  customizer: Customizer | null;
  customColor: string;
}) {
  const extra = gallery.filter((url) => url && url !== heroUrl);
  const single = extra.length === 0;

  const hero = (
    <div className={tileClass}>
      {customizer ? (
        <ColorPreview
          baseUrl={customizer.baseUrl}
          maskUrl={customizer.maskUrl}
          color={customColor}
          alt={`${name}（自訂顏色 ${customColor.toUpperCase()}）`}
          priority
        />
      ) : (
        heroUrl && (
          <Image
            key={heroUrl}
            src={heroUrl}
            alt={heroAlt}
            fill
            priority
            unoptimized={heroUrl.startsWith("https://")}
            sizes={single ? "(min-width: 768px) 55vw, 90vw" : "(min-width: 768px) 28vw, 90vw"}
            className="object-cover"
          />
        )
      )}
    </div>
  );

  if (single) return hero;

  return (
    <div
      aria-label={`${name} 的產品照片`}
      className="-mx-6 flex snap-x snap-mandatory gap-2 overflow-x-auto px-6 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0"
    >
      <div className="w-[85%] shrink-0 snap-center md:w-auto">{hero}</div>
      {extra.map((url, i) => (
        <div key={url} className="w-[85%] shrink-0 snap-center md:w-auto">
          <div className={tileClass}>
            <Image
              src={url}
              alt={`${name} 照片 ${i + 2}`}
              fill
              unoptimized={url.startsWith("https://")}
              sizes="(min-width: 768px) 28vw, 90vw"
              className="object-cover"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// 產品頁右邊的顏色選擇：色票、自訂顏色
export function ColorOptions({
  variants,
  customizer,
  selected,
  onSelect,
  customColor,
  onCustomColor,
}: {
  variants: Variant[];
  customizer: Customizer | null;
  selected: ColorSelection;
  onSelect: (selection: ColorSelection) => void;
  customColor: string;
  onCustomColor: (color: string) => void;
}) {
  if (variants.length === 0 && !customizer) return null;
  const custom = selected === "custom" && customizer;
  const current = typeof selected === "number" ? variants[selected] : undefined;

  return (
    <div>
      <div role="radiogroup" aria-label="選擇顏色" className="flex flex-wrap gap-2">
        {variants.map((v, i) => (
          <button
            key={v.name}
            type="button"
            role="radio"
            aria-checked={i === selected}
            aria-label={v.stock === 0 ? `${v.name}（缺貨）` : v.name}
            title={v.name}
            onClick={() => onSelect(i)}
            className={`relative h-10 w-10 rounded-full border-2 p-0.5 transition-colors ${
              i === selected ? "border-brand-navy" : "border-transparent hover:border-ink/25"
            }`}
          >
            <span className="block h-full w-full rounded-full border border-ink/15" style={{ backgroundColor: v.color }} />
            {/* 缺貨的顏色畫一條斜線 */}
            {v.stock === 0 && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="h-px w-9 rotate-45 bg-ink/60" />
              </span>
            )}
          </button>
        ))}
        {customizer && (
          <button
            type="button"
            role="radio"
            aria-checked={selected === "custom"}
            aria-label="自訂顏色"
            title="自訂顏色"
            onClick={() => onSelect("custom")}
            className={`flex h-10 items-center gap-1.5 rounded-full border-2 py-0.5 pr-3 pl-0.5 text-xs font-medium text-ink transition-colors ${
              selected === "custom" ? "border-brand-navy" : "border-line hover:border-ink/25"
            }`}
          >
            {/* 彩虹色環代表「任何顏色都可以」 */}
            <span
              className="block h-8 w-8 rounded-full"
              style={{ background: "conic-gradient(#f87171, #fbbf24, #a3e635, #34d399, #38bdf8, #818cf8, #f472b6, #f87171)" }}
            />
            自訂
          </button>
        )}
      </div>
      <p className="mt-2 text-sm text-ink/60">
        顏色：
        <span className="font-medium text-ink">{custom ? `自訂 ${customColor.toUpperCase()}` : current?.name}</span>
        {current && current.stock === 0 && <span className="ml-2 text-xs text-red-600">此顏色缺貨</span>}
      </p>

      {custom && (
        <div className="mt-3 rounded-2xl border border-line bg-cream/50 p-4">
          <p className="mb-3 text-xs text-ink/60">選一個你喜歡的顏色，或貼上色碼；購買時可以把色碼備註給我們。</p>
          <CustomColorPicker
            color={customColor}
            onChange={onCustomColor}
            presets={[...variants.map((v) => ({ name: v.name, color: v.color })), ...EXTRA_PRESETS]}
          />
        </div>
      )}
    </div>
  );
}
