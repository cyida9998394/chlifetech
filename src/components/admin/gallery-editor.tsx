"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { IMAGE_ACCEPT } from "@/lib/product-images";
import { MAX_GALLERY_IMAGES } from "@/lib/product-options";
import { uploadProductImage } from "@/lib/upload-image";

// 「更多產品照片」：產品頁左邊照片牆主圖後面的照片，可以一次選多張、調整順序
export default function GalleryEditor({
  name,
  initial,
  onChange,
}: {
  name: string;
  initial: string[];
  onChange?: (urls: string[]) => void;
}) {
  const [urls, setUrls] = useState(initial);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function update(next: string[]) {
    setUrls(next);
    onChange?.(next);
  }

  function move(i: number, delta: -1 | 1) {
    const j = i + delta;
    if (j < 0 || j >= urls.length) return;
    const next = [...urls];
    [next[i], next[j]] = [next[j], next[i]];
    update(next);
  }

  async function add(files: FileList) {
    setError("");
    const room = MAX_GALLERY_IMAGES - urls.length;
    const picked = Array.from(files).slice(0, room);
    const errors: string[] = [];
    if (files.length > room) errors.push(`最多 ${MAX_GALLERY_IMAGES} 張，多的沒有上傳。`);
    let next = urls;
    for (const file of picked) {
      setUploading((n) => n + 1);
      const result = await uploadProductImage(file);
      setUploading((n) => n - 1);
      if (result.url) {
        next = [...next, result.url];
        update(next);
      } else {
        errors.push(result.error ?? "上傳失敗");
      }
    }
    setError(errors.join(" "));
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-3">
      {urls.map((url) => (
        <input key={url} type="hidden" name={name} value={url} />
      ))}
      <input
        ref={fileRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => e.target.files?.length && add(e.target.files)}
      />

      <div className="grid grid-cols-4 gap-2">
        {urls.map((url, i) => (
          <div key={url} className="group relative aspect-[4/5] overflow-hidden rounded-lg border border-line bg-mist">
            <Image src={url} alt={`產品照片 ${i + 1}`} fill unoptimized sizes="80px" className="object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink/60 px-1 py-0.5 text-[11px] text-white">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="往前移" className="px-1 disabled:opacity-30">
                ←
              </button>
              <button type="button" onClick={() => update(urls.filter((u) => u !== url))} aria-label="移除這張照片" className="px-1 hover:text-red-200">
                ✕
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === urls.length - 1}
                aria-label="往後移"
                className="px-1 disabled:opacity-30"
              >
                →
              </button>
            </div>
          </div>
        ))}
        {urls.length < MAX_GALLERY_IMAGES && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading > 0}
            className="flex aspect-[4/5] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-ink/25 text-[11px] text-ink/50 transition-colors hover:border-brand hover:text-brand-navy disabled:opacity-50"
          >
            <span className="text-lg leading-none">＋</span>
            {uploading > 0 ? `上傳中（${uploading}）` : "新增照片"}
          </button>
        )}
      </div>
      <p className="text-xs text-ink/50">
        產品頁左邊會排成照片牆，主圖（或選到的顏色）在第一張，這些照片接在後面；最多 {MAX_GALLERY_IMAGES} 張，可以一次選多張。
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
