// 留言的字數限制，前端（即時提示）和後端（實際檢查）共用
export const MAX_MESSAGE_LENGTH = 1000;
export const MAX_CONTACT_LENGTH = 100;

export const CONTACT_METHODS = [
  { value: "email", label: "Email", placeholder: "you@example.com" },
  { value: "phone", label: "電話", placeholder: "0912-345-678" },
  { value: "line", label: "LINE ID", placeholder: "你的 LINE ID" },
] as const;

export type ContactMethod = (typeof CONTACT_METHODS)[number]["value"];

// 問題類型：needsOrder 會多出「相關訂單」
export const MESSAGE_CATEGORIES = [
  { value: "product", label: "產品問題", needsOrder: true },
  { value: "order", label: "訂單與配送", needsOrder: true },
  { value: "return", label: "退換貨", needsOrder: true },
  { value: "business", label: "合作洽詢", needsOrder: false },
  { value: "website", label: "網站與帳號", needsOrder: false },
  { value: "other", label: "其他", needsOrder: false },
] as const;

export type MessageCategory = (typeof MESSAGE_CATEGORIES)[number]["value"];

export function findCategory(value?: unknown) {
  return MESSAGE_CATEGORIES.find((c) => c.value === value);
}

export function contactMethodLabel(value?: string | null) {
  return CONTACT_METHODS.find((m) => m.value === value)?.label ?? "聯絡方式";
}

// 留言列表的標題：舊留言有主旨就用主旨，新留言用問題類型
export function messageTitle(m: { subject?: string | null; category?: string | null }) {
  return m.subject || findCategory(m.category)?.label || "留言";
}
