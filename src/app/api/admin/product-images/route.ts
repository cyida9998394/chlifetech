import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ProductImageModel } from "@/models/product-image";
import { MAX_IMAGE_BYTES, uploadedImageUrl } from "@/lib/product-images";

// 用檔案開頭的位元組判斷真正的格式，不相信瀏覽器傳來的類型
function detectImageType(bytes: Uint8Array) {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (starts(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (starts(0x47, 0x49, 0x46, 0x38)) return "image/gif";
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

// 後台上傳產品圖片，只有管理者可以用
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") {
    return NextResponse.json({ error: "沒有權限上傳圖片。" }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "請選擇圖片檔案。" }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "圖片太大了，請小於 4 MB。" }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = detectImageType(bytes);
  if (!contentType) {
    return NextResponse.json({ error: "只能上傳 JPG、PNG、WebP 或 GIF 圖片。" }, { status: 415 });
  }

  const image = await ProductImageModel.create({
    data: Buffer.from(bytes),
    contentType,
    size: bytes.length,
    uploadedBy: user.nickname,
  });

  return NextResponse.json({ url: uploadedImageUrl(image._id.toString()) }, { status: 201 });
}
