import Image from "next/image";

// 客製化顏色預覽：底圖上面疊一層顏色，只在遮罩的範圍內顯示，
// 用 multiply 混合保留底圖的陰影和亮面；底圖和遮罩要是同樣尺寸的圖片
export default function ColorPreview({
  baseUrl,
  maskUrl,
  color,
  alt,
  priority,
  sizes = "(min-width: 768px) 45vw, 100vw",
}: {
  baseUrl: string;
  maskUrl: string;
  color: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
}) {
  const mask = `url("${maskUrl}")`;
  return (
    <div className="relative h-full w-full">
      <Image
        src={baseUrl}
        alt={alt}
        fill
        priority={priority}
        unoptimized={baseUrl.startsWith("https://")}
        sizes={sizes}
        className="object-cover"
      />
      {/* 遮罩的大小和位置要跟底圖的 object-cover 一樣，才會對齊 */}
      <div
        aria-hidden
        className="absolute inset-0 transition-colors duration-200"
        style={{
          backgroundColor: color,
          mixBlendMode: "multiply",
          maskImage: mask,
          WebkitMaskImage: mask,
          maskSize: "cover",
          WebkitMaskSize: "cover",
          maskPosition: "center",
          WebkitMaskPosition: "center",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
        }}
      />
    </div>
  );
}
