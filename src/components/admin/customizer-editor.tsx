"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import ColorPreview from "@/components/color-preview";
import CustomColorPicker from "@/components/custom-color-picker";
import type { ProductCustomizer } from "@/lib/product-options";
import { uploadProductImage } from "@/lib/upload-image";

// 遮罩一定要有透明背景，所以只收 PNG 和 WebP
const MASK_ACCEPT = "image/png,image/webp";

type Slot = "base" | "mask";

// 後台設定客製化顏色預覽：上傳底圖和上色區域遮罩，旁邊可以直接試顏色
export default function CustomizerEditor({ initial }: { initial?: ProductCustomizer }) {
  const [enabled, setEnabled] = useState(initial?.enabled ?? false);
  const [baseUrl, setBaseUrl] = useState(initial?.baseImageUrl ?? "");
  const [maskUrl, setMaskUrl] = useState(initial?.maskImageUrl ?? "");
  const [color, setColor] = useState("#3a78ad");
  const [uploading, setUploading] = useState<Slot | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const slotRef = useRef<Slot>("base");

  function choose(slot: Slot) {
    slotRef.current = slot;
    if (fileRef.current) {
      fileRef.current.accept = slot === "mask" ? MASK_ACCEPT : "image/jpeg,image/png,image/webp";
      fileRef.current.click();
    }
  }

  async function upload(file: File) {
    const slot = slotRef.current;
    setError("");
    if (slot === "mask" && !["image/png", "image/webp"].includes(file.type)) {
      setError("遮罩要用有透明背景的 PNG 或 WebP。");
      return;
    }
    setUploading(slot);
    const result = await uploadProductImage(file);
    setUploading(null);
    if (result.url) (slot === "base" ? setBaseUrl : setMaskUrl)(result.url);
    else setError(result.error ?? "上傳失敗，請稍後再試。");
    if (fileRef.current) fileRef.current.value = "";
  }

  const ready = baseUrl !== "" && maskUrl !== "";

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name="customizerBase" value={baseUrl} />
      <input type="hidden" name="customizerMask" value={maskUrl} />
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />

      <label className="flex items-start gap-2 text-sm text-ink">
        <input
          type="checkbox"
          name="customizerEnabled"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="mt-0.5 accent-brand-navy"
        />
        <span>
          開啟「自訂顏色」
          <span className="block text-xs text-ink/50">產品頁會多一個「自訂」，讓使用者自己選顏色或貼色碼，畫面即時換色</span>
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_1.2fr]">
        {(
          [
            ["base", "底圖", baseUrl, setBaseUrl, "產品照片；要換色的部分請用白色或淺灰"],
            ["mask", "上色區域遮罩", maskUrl, setMaskUrl, "和底圖同尺寸的透明背景 PNG，要上色的範圍塗滿（任何顏色都可以）"],
          ] as const
        ).map(([slot, label, url, setUrl, hint]) => (
          <div key={slot} className="flex flex-col gap-2">
            <p className="text-sm font-medium text-ink/80">{label}</p>
            <button
              type="button"
              onClick={() => choose(slot)}
              disabled={uploading !== null}
              className="relative aspect-[4/5] overflow-hidden rounded-xl border border-dashed border-ink/25 text-xs text-ink/50 transition-colors hover:border-brand disabled:opacity-50"
              // 遮罩的透明部分用棋盤格表示
              style={slot === "mask" ? { backgroundImage: "repeating-conic-gradient(#eef0f4 0% 25%, #fff 0% 50%)", backgroundSize: "16px 16px" } : undefined}
            >
              {url ? (
                <Image src={url} alt="" fill unoptimized sizes="200px" className="object-cover" />
              ) : uploading === slot ? (
                "上傳中⋯"
              ) : (
                `上傳${label}`
              )}
            </button>
            <p className="text-[11px] leading-snug text-ink/50">{hint}</p>
            {url && (
              <button type="button" onClick={() => setUrl("")} className="self-start text-[11px] text-ink/40 hover:text-red-600">
                移除
              </button>
            )}
          </div>
        ))}

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-ink/80">預覽</p>
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-mist">
            {ready ? (
              <ColorPreview baseUrl={baseUrl} maskUrl={maskUrl} color={color} alt="客製化顏色預覽" sizes="240px" />
            ) : (
              <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-ink/40">
                上傳底圖和遮罩後，可以在這裡試顏色
              </p>
            )}
          </div>
          {ready && <CustomColorPicker color={color} onChange={setColor} />}
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      {enabled && !ready && <p className="text-xs text-red-600">開啟前請先上傳底圖和遮罩</p>}
    </div>
  );
}
