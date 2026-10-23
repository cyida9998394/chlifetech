// 總覽的目標進度：可以設定目標的指標，前端和後端共用
// monthly：每個月重新計算，目標也是「每月目標」
export const GOAL_METRICS = [
  { key: "members", label: "總會員數", unit: "人", href: "/admin/users", monthly: false },
  { key: "members_month", label: "本月新增會員", unit: "人", href: "/admin/users", monthly: true },
  { key: "subscribers", label: "電子報總訂閱", unit: "人", href: "/admin/subscribers", monthly: false },
  { key: "subscribers_month", label: "本月新增訂閱", unit: "人", href: "/admin/subscribers", monthly: true },
] as const;

export type GoalMetric = (typeof GOAL_METRICS)[number]["key"];

export const MAX_GOAL = 1_000_000;

export function findGoalMetric(key: unknown) {
  return GOAL_METRICS.find((m) => m.key === key);
}
