import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/product-images";

// 後台上傳一張產品圖片：先在瀏覽器擋格式和大小，成功回傳網址，失敗回傳錯誤訊息
export async function uploadProductImage(file: File): Promise<{ url?: string; error?: string }> {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { error: `「${file.name}」不是 JPG、PNG、WebP 或 GIF 圖片。` };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: `「${file.name}」太大了，請小於 4 MB。` };
  }
  try {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/product-images", { method: "POST", body });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.url) return { url: data.url };
    return { error: data.error ?? "上傳失敗，請稍後再試。" };
  } catch {
    return { error: "網路異常，請稍後再試。" };
  }
}
