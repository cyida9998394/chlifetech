import {
  MAX_IMAGE_URL,
  MAX_STOCK,
  MAX_VARIANTS,
  MAX_VARIANT_NAME,
  isHexColor,
  isValidImageUrl,
} from "@/lib/product-options";

type VariantInput = { name: string; color: string; stock: number; imageUrl: string };

// 表單把顏色清單用 JSON 放在一個隱藏欄位裡，這裡逐一檢查
export function readVariants(formData: FormData): { variants: VariantInput[]; error: string | null } {
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("variants") || "[]"));
  } catch {
    return { variants: [], error: "顏色資料格式不正確，請重新整理後再試。" };
  }
  if (!Array.isArray(raw)) return { variants: [], error: "顏色資料格式不正確。" };
  if (raw.length > MAX_VARIANTS) return { variants: [], error: `顏色最多 ${MAX_VARIANTS} 種。` };

  const variants: VariantInput[] = [];
  for (const item of raw) {
    const name = String(item?.name ?? "").trim();
    const color = String(item?.color ?? "");
    const stock = Number(item?.stock);
    const imageUrl = String(item?.imageUrl ?? "").trim();
    if (!name || name.length > MAX_VARIANT_NAME) {
      return { variants: [], error: `請輸入每個顏色的名稱（最多 ${MAX_VARIANT_NAME} 個字）。` };
    }
    if (!isHexColor(color)) return { variants: [], error: `「${name}」的色票不正確。` };
    if (!Number.isInteger(stock) || stock < 0 || stock > MAX_STOCK) {
      return { variants: [], error: `「${name}」的庫存要是 0 以上的整數。` };
    }
    if (imageUrl && (imageUrl.length > MAX_IMAGE_URL || !isValidImageUrl(imageUrl))) {
      return { variants: [], error: `「${name}」的圖片網址要以 / 或 https:// 開頭。` };
    }
    variants.push({ name, color: color.toLowerCase(), stock, imageUrl });
  }
  if (new Set(variants.map((v) => v.name)).size !== variants.length) {
    return { variants: [], error: "顏色名稱不能重複。" };
  }
  return { variants, error: null };
}
