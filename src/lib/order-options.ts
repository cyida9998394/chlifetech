// 訂單相關的選項和限制，前端和後端共用
export const ORDER_STATUSES = [
  { value: "pending", label: "待出貨" },
  { value: "shipped", label: "已出貨" },
  { value: "completed", label: "已完成" },
  { value: "cancelled", label: "已取消" },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number]["value"];

export function orderStatusLabel(value?: string | null) {
  return ORDER_STATUSES.find((s) => s.value === value)?.label ?? "待出貨";
}

// 超商取貨可以選的超商
export const CVS_BRANDS = [
  { value: "711", label: "7-ELEVEN" },
  { value: "family", label: "全家" },
  { value: "hilife", label: "萊爾富" },
  { value: "ok", label: "OK 超商" },
] as const;

export function cvsBrandLabel(value?: string | null) {
  return CVS_BRANDS.find((b) => b.value === value)?.label ?? "";
}

// 目前只有貨到付款（宅配付給物流、超商取貨在門市付款）
export const PAYMENT_LABEL = "貨到付款";

export const MAX_RECIPIENT_NAME = 30;
export const MAX_ADDRESS = 120;
export const MAX_STORE = 40;
export const MAX_ORDER_NOTE = 300;
export const MAX_TRACKING = 40;

// 台灣手機（09 開頭 10 碼）或市話（含區碼 9–10 碼），可以有 - 或空白
export function isValidPhone(value: string) {
  const digits = value.replace(/[\s-]/g, "");
  return /^09\d{8}$/.test(digits) || /^0[2-8]\d{7,8}$/.test(digits);
}

// 運費設定：宅配、超商各一個金額，加上滿額免運門檻（0 = 沒有免運）
export type ShippingSettings = { home: number; cvs: number; freeOver: number };

export function shippingFee(settings: ShippingSettings, method: string, subtotal: number) {
  if (settings.freeOver > 0 && subtotal >= settings.freeOver) return 0;
  return method === "cvs" ? settings.cvs : settings.home;
}

// 會員的預設收件資料
export type ShippingInfo = { recipientName: string; phone: string; address: string; cvsBrand: string; cvsStore: string };

export const EMPTY_SHIPPING_INFO: ShippingInfo = { recipientName: "", phone: "", address: "", cvsBrand: "", cvsStore: "" };

// 檢查並整理收件資料（每一欄都可以空白，有填才檢查格式）；回傳錯誤訊息或整理好的資料
export function cleanShippingInfo(input: Partial<Record<keyof ShippingInfo, unknown>>): { info: ShippingInfo; error: string | null } {
  const text = (v: unknown) => String(v ?? "").trim();
  const info: ShippingInfo = {
    recipientName: text(input.recipientName),
    phone: text(input.phone),
    address: text(input.address),
    cvsBrand: CVS_BRANDS.find((b) => b.value === input.cvsBrand)?.value ?? "",
    cvsStore: text(input.cvsStore),
  };
  if (info.recipientName.length > MAX_RECIPIENT_NAME) return { info, error: `收件人姓名最多 ${MAX_RECIPIENT_NAME} 個字。` };
  if (info.phone && !isValidPhone(info.phone)) return { info, error: "請輸入正確的聯絡電話，例如 0912-345-678。" };
  if (info.address.length > MAX_ADDRESS) return { info, error: `地址最多 ${MAX_ADDRESS} 個字。` };
  if (info.cvsStore.length > MAX_STORE) return { info, error: `門市名稱最多 ${MAX_STORE} 個字。` };
  if (info.cvsStore && !info.cvsBrand) return { info, error: "請選擇超商。" };
  return { info, error: null };
}
