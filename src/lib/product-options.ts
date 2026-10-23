// 產品上架管理的欄位限制，前端（即時提示）和後端（實際檢查）共用
export const MAX_PRODUCT_NAME = 40;
export const MAX_PRODUCT_SUMMARY = 80;
// 詳細介紹是編輯器產生的 HTML，所以上限比純文字大
export const MAX_PRODUCT_DESCRIPTION = 100_000;
export const MAX_PRODUCT_TAGS = 5;
export const MAX_TAG_LENGTH = 12;
export const MAX_PRICE = 10_000_000;
export const MAX_STOCK = 1_000_000;
export const MAX_IMAGE_URL = 300;

export const PRODUCT_STATUSES = [
  { value: "draft", label: "草稿" },
  { value: "published", label: "上架中" },
] as const;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number]["value"];

// 販售通路：官網會顯示在首頁的產品選物，蝦皮只是標記（之後可以串接）
export const PRODUCT_CHANNELS = [
  { value: "website", label: "官網" },
  { value: "shopee", label: "蝦皮" },
] as const;

export type ProductChannel = (typeof PRODUCT_CHANNELS)[number]["value"];

// 舊產品還沒有通路欄位，當作只在官網販售
export function channelsOf(p: { channels?: string[] | null }): ProductChannel[] {
  if (!p.channels) return ["website"];
  return PRODUCT_CHANNELS.map((c) => c.value).filter((v) => p.channels!.includes(v));
}

export function channelLabel(value: string) {
  return PRODUCT_CHANNELS.find((c) => c.value === value)?.label ?? value;
}

// 給資料庫查詢用：在某個通路販售的產品（官網要包含還沒有通路欄位的舊產品）
export function channelFilter(channel: ProductChannel): Record<string, unknown> {
  return channel === "website"
    ? { $or: [{ channels: "website" }, { channels: { $exists: false } }] }
    : { channels: channel };
}

export function productStatusLabel(value?: string | null) {
  return PRODUCT_STATUSES.find((s) => s.value === value)?.label ?? "草稿";
}

// 標籤用逗號、頓號或換行分開
export function parseTags(raw: string) {
  return raw
    .split(/[,，、\n]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

// 圖片只接受網站內的路徑（/products/xxx.webp）或 https 網址
export function isValidImageUrl(url: string) {
  return (url.startsWith("/") && !url.startsWith("//")) || url.startsWith("https://");
}

// 產品顏色：每個顏色有自己的名稱、色票、庫存，也可以有自己的照片；價格共用
export const MAX_VARIANTS = 20;
export const MAX_VARIANT_NAME = 20;

export type ProductVariant = { id?: string; name: string; color: string; stock: number; imageUrl: string };

export function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

// 有分顏色時，總庫存就是各顏色加起來
export function totalStock(p: { stock: number; variants?: { stock: number }[] | null }) {
  return p.variants && p.variants.length > 0 ? p.variants.reduce((sum, v) => sum + v.stock, 0) : p.stock;
}

// 客製化顏色預覽：底圖（可上色的部分是白色或淺灰）＋遮罩（透明背景 PNG，可上色的範圍不透明）
export type ProductCustomizer = { enabled: boolean; baseImageUrl: string; maskImageUrl: string };

// 「#abc」「abc」「#aabbcc」「aabbcc」都接受，統一轉成 #aabbcc；格式不對回傳 null
export function normalizeHex(input: string) {
  const value = input.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(value)) return `#${value.split("").map((c) => c + c).join("")}`.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(value)) return `#${value}`.toLowerCase();
  return null;
}

// 產品頁左邊照片牆的「更多產品照片」最多幾張
export const MAX_GALLERY_IMAGES = 8;

// 有填原價而且比售價高，才算特價
export function isOnSale(p: { price: number; originalPrice?: number | null }) {
  return !!p.originalPrice && p.originalPrice > p.price && p.price > 0;
}

// 購買方式：在官網買（加入購物車、貨到付款）或直接到蝦皮買
export const PURCHASE_MODES = [
  { value: "website", label: "在官網購買", hint: "加入購物車、貨到付款" },
  { value: "shopee", label: "到蝦皮購買", hint: "按鈕直接連到蝦皮" },
] as const;

export type PurchaseMode = (typeof PURCHASE_MODES)[number]["value"];

// 舊產品沒有這個欄位，當作在官網購買
export function purchaseModeOf(p: { purchaseMode?: string | null }): PurchaseMode {
  return p.purchaseMode === "shopee" ? "shopee" : "website";
}

// 產品編號顯示時前面加 #，例如 #20261023001
export function formatProductNo(no?: string | null) {
  return no ? `#${no}` : "";
}
