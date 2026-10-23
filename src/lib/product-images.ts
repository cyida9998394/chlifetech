// 產品圖片上傳的規則，前端（先擋一次）和後端（實際檢查）共用
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(",");

const UPLOADED_PREFIX = "/api/product-images/";

export function uploadedImageUrl(id: string) {
  return `${UPLOADED_PREFIX}${id}`;
}

// 是我們自己上傳的圖片就回傳圖片編號，否則回傳 null
export function uploadedImageId(url?: string | null) {
  if (!url?.startsWith(UPLOADED_PREFIX)) return null;
  const id = url.slice(UPLOADED_PREFIX.length);
  return /^[a-f0-9]{24}$/.test(id) ? id : null;
}
