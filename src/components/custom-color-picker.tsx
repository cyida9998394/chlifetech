"use client";

import { useState } from "react";
import { normalizeHex } from "@/lib/product-options";

// 自訂顏色：調色盤、貼上色碼、快速色票、複製色碼
export default function CustomColorPicker({
  color,
  onChange,
  presets = [],
}: {
  color: string;
  onChange: (color: string) => void;
  presets?: { name: string; color: string }[];
}) {
  const [text, setText] = useState(color.toUpperCase());
  const [copied, setCopied] = useState(false);
  const valid = normalizeHex(text) !== null;

  function pick(next: string) {
    onChange(next);
    setText(next.toUpperCase());
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(color.toUpperCase());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 不能複製時（例如瀏覽器不允許），色碼本來就顯示在輸入框裡
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-full border border-ink/15" title="打開調色盤">
          <span className="absolute inset-0" style={{ backgroundColor: color }} />
          <input
            type="color"
            value={color}
            onChange={(e) => pick(e.target.value)}
            aria-label="打開調色盤選顏色"
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            const hex = normalizeHex(e.target.value);
            if (hex) onChange(hex);
          }}
          onBlur={() => setText(color.toUpperCase())}
          placeholder="#3A78AD"
          aria-label="貼上色碼"
          aria-invalid={!valid}
          maxLength={7}
          className={`w-28 rounded-lg border px-3 py-2 font-mono text-sm uppercase text-ink outline-none transition-colors ${
            valid ? "border-line focus:border-brand" : "border-red-400"
          }`}
        />
        <button
          type="button"
          onClick={copy}
          className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink/70 transition-colors hover:border-ink hover:text-ink"
        >
          {copied ? "已複製 ✓" : "複製色碼"}
        </button>
      </div>
      {!valid && <p className="-mt-1 text-xs text-red-600">請輸入像 #3A78AD 這樣的色碼</p>}
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p.name + p.color}
              type="button"
              title={p.name}
              aria-label={`套用 ${p.name}`}
              onClick={() => pick(p.color)}
              className={`h-7 w-7 rounded-full border-2 p-0.5 ${
                p.color.toLowerCase() === color.toLowerCase() ? "border-brand-navy" : "border-transparent hover:border-ink/25"
              }`}
            >
              <span className="block h-full w-full rounded-full border border-ink/15" style={{ backgroundColor: p.color }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
