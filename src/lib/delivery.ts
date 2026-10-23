// 配送方式：沒有實體店面，只有宅配和超商取貨；前端和後端共用
export const DELIVERY_METHODS = [
  { value: "home", label: "宅配到府", hint: "送到你指定的地址" },
  { value: "cvs", label: "超商取貨", hint: "到附近的便利商店取貨" },
] as const;

export type DeliveryMethod = (typeof DELIVERY_METHODS)[number]["value"];

export const DEFAULT_DELIVERY: DeliveryMethod = "home";

export function findDelivery(value: unknown) {
  return DELIVERY_METHODS.find((d) => d.value === value);
}
