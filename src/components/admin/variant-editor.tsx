"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { IMAGE_ACCEPT } from "@/lib/product-images";
import { MAX_STOCK, MAX_VARIANT_NAME, MAX_VARIANTS, type ProductVariant } from "@/lib/product-options";
import { uploadProductImage } from "@/lib/upload-image";

const inputClass =
  "rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-brand";

// 新增顏色時輪流用的預設色票
const DEFAULT_COLORS = ["#1c2331", "#f5f5f0", "#3a78ad", "#c0392b", "#7f8c8d", "#e6b450"];

type Row = ProductVariant & { key: string };

let nextKey = 0;
const toRow = (v: ProductVariant): Row => ({ ...v, key: `v${nextKey++}` });

// 產品顏色清單：每個顏色有名稱、色票、庫存、照片（選填）；整份清單用 JSON 放進隱藏欄位送出
export default function VariantEditor({
  name,
  initial,
  onChange,
}: {
  name: string;
  initial: ProductVariant[];
  // 顏色變動時通知表單（用來顯示總庫存）
  onChange?: (variants: ProductVariant[]) => void;
}) {
  const [rows, setRows] = useState<Row[]>(() => initial.map(toRow));
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<string | null>(null);

  function update(next: Row[]) {
    setRows(next);
    onChange?.(next);
  }

  function patch(key: string, values: Partial<ProductVariant>) {
    update(rows.map((r) => (r.key === key ? { ...r, ...values } : r)));
  }

  function add() {
    update([...rows, toRow({ name: "", color: DEFAULT_COLORS[rows.length % DEFAULT_COLORS.length], stock: 0, imageUrl: "" })]);
  }

  function remove(key: string) {
    update(rows.filter((r) => r.key !== key));
  }

  function move(key: string, delta: -1 | 1) {
    const i = rows.findIndex((r) => r.key === key);
    const j = i + delta;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    update(next);
  }

  async function upload(file: File) {
    const key = uploadTarget.current;
    if (!key) return;
    setError("");
    setUploadingKey(key);
    const result = await uploadProductImage(file);
    setUploadingKey(null);
    if (result.url) patch(key, { imageUrl: result.url });
    else setError(result.error ?? "上傳失敗，請稍後再試。");
    if (fileRef.current) fileRef.current.value = "";
  }

  const payload = JSON.stringify(rows.map(({ name, color, stock, imageUrl }) => ({ name, color, stock, imageUrl })));

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name={name} value={payload} />
      <input
        ref={fileRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />

      {rows.length === 0 && (
        <p className="rounded-xl border border-dashed border-line px-4 py-3 text-xs text-ink/50">
          沒有分顏色的話不用設定；有分顏色時，每個顏色可以分開記庫存、放不同照片。
        </p>
      )}

      {rows.map((r, i) => (
        <div key={r.key} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-cream/40 p-2.5">
          <label className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-full border border-ink/15" title="選擇色票">
            <span className="absolute inset-0" style={{ backgroundColor: r.color }} />
            <input
              type="color"
              value={r.color}
              onChange={(e) => patch(r.key, { color: e.target.value })}
              aria-label={`${r.name || `第 ${i + 1} 個顏色`}的色票`}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
          <input
            value={r.name}
            onChange={(e) => patch(r.key, { name: e.target.value })}
            maxLength={MAX_VARIANT_NAME}
            placeholder="顏色名稱，例如 霧面黑"
            aria-label="顏色名稱"
            required
            className={`${inputClass} min-w-0 flex-1 basis-32`}
          />
          <label className="flex items-center gap-1.5 text-xs text-ink/60">
            庫存
            <input
              type="number"
              min={0}
              max={MAX_STOCK}
              step={1}
              value={r.stock}
              onChange={(e) => patch(r.key, { stock: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
              aria-label={`${r.name || "這個顏色"}的庫存`}
              className={`${inputClass} w-20`}
            />
          </label>
          <button
            type="button"
            onClick={() => {
              uploadTarget.current = r.key;
              fileRef.current?.click();
            }}
            disabled={uploadingKey !== null}
            title={r.imageUrl ? "更換這個顏色的照片" : "上傳這個顏色的照片（選填）"}
            className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-dashed border-ink/25 bg-white text-[10px] text-ink/50 hover:border-brand disabled:opacity-50"
          >
            {r.imageUrl ? (
              <Image src={r.imageUrl} alt="" fill unoptimized sizes="36px" className="object-cover" />
            ) : uploadingKey === r.key ? (
              "⋯"
            ) : (
              "照片"
            )}
          </button>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => move(r.key, -1)}
              disabled={i === 0}
              aria-label="往上移"
              className="rounded px-1.5 py-1 text-xs text-ink/50 hover:text-ink disabled:opacity-25"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(r.key, 1)}
              disabled={i === rows.length - 1}
              aria-label="往下移"
              className="rounded px-1.5 py-1 text-xs text-ink/50 hover:text-ink disabled:opacity-25"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => remove(r.key)}
              aria-label={`移除${r.name || "這個顏色"}`}
              className="rounded px-1.5 py-1 text-xs text-ink/50 hover:text-red-600"
            >
              ✕
            </button>
          </div>
          {r.imageUrl && (
            <button
              type="button"
              onClick={() => patch(r.key, { imageUrl: "" })}
              className="basis-full text-left text-[11px] text-ink/40 hover:text-red-600"
            >
              移除這個顏色的照片
            </button>
          )}
        </div>
      ))}

      {error && <p className="text-xs text-red-600">{error}</p>}
      {rows.length < MAX_VARIANTS && (
        <button
          type="button"
          onClick={add}
          className="self-start rounded-full border border-brand-navy px-4 py-1.5 text-xs font-medium text-brand-navy transition-colors hover:bg-brand-navy hover:text-white"
        >
          ＋ 新增顏色
        </button>
      )}
    </div>
  );
}
