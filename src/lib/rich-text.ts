import "server-only";
import sanitizeHtml from "sanitize-html";
import { uploadedImageId } from "@/lib/product-images";
import { isValidImageUrl } from "@/lib/product-options";

// 只允許這些 YouTube 嵌入網址，其他 iframe 一律拿掉
const YOUTUBE_EMBED = /^https:\/\/www\.youtube(-nocookie)?\.com\/embed\/[\w-]{6,20}(\?[\w=&%-]*)?$/;

// 和產品主圖一樣：網站內的路徑或 https 網址
function isAllowedImageSrc(src: string) {
  return isValidImageUrl(src);
}

// 編輯器存下來的 HTML 用白名單清乾淨，避免被塞入惡意程式碼；存檔和顯示時都會跑一次
export function sanitizeRichText(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "h2", "h3", "strong", "em", "u", "s", "a",
      "ul", "ol", "li", "blockquote", "hr", "img", "div", "iframe",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt"],
      div: ["data-youtube-video"],
      iframe: ["src", "width", "height", "allowfullscreen", "allow", "frameborder"],
    },
    allowedSchemes: ["https", "mailto"],
    allowedSchemesAppliedToAttributes: ["href"],
    allowProtocolRelative: false,
    exclusiveFilter: (frame) =>
      (frame.tag === "img" && !isAllowedImageSrc(frame.attribs.src ?? "")) ||
      (frame.tag === "iframe" && !YOUTUBE_EMBED.test(frame.attribs.src ?? "")),
    transformTags: {
      // 外部連結一律開新分頁，並且不把來源網址帶過去
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, target: "_blank", rel: "noopener noreferrer nofollow" },
      }),
    },
  });
}

// 舊的純文字介紹：一行一段，轉成 HTML 給編輯器用
export function plainTextToHtml(text: string) {
  if (!text || text.trimStart().startsWith("<")) return text;
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${sanitizeHtml(line, { allowedTags: [], allowedAttributes: {} })}</p>`)
    .join("");
}

// 文章裡用到的上傳圖片編號（刪除產品或換掉圖片時，用來清掉沒用到的圖片）
export function uploadedImageIdsIn(html?: string | null) {
  const ids = new Set<string>();
  for (const match of (html ?? "").matchAll(/src="([^"]+)"/g)) {
    const id = uploadedImageId(match[1]);
    if (id) ids.add(id);
  }
  return ids;
}

// 有沒有實際內容（只有空段落就算沒有）
export function hasRichContent(html?: string | null) {
  if (!html) return false;
  if (/<(img|iframe)\b/.test(html)) return true;
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).trim() !== "";
}
