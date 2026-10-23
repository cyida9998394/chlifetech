import Link from "next/link";
import { connectDB } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth";
import { adminRowClass, findUsersAdminFirst } from "@/lib/admin-users";
import { UserModel } from "@/models/user";
import { PendingRegistrationModel } from "@/models/pending-registration";
import { SubscriberModel } from "@/models/subscriber";
import { MessageModel } from "@/models/message";
import { OrderModel } from "@/models/order";
import { OPEN_MESSAGE_FILTER } from "@/lib/message-thread";
import AlertBadge from "@/components/admin/alert-badge";
import GoalCard from "@/components/admin/goal-card";
import { GoalModel } from "@/models/goal";
import { GOAL_METRICS, type GoalMetric } from "@/lib/goals";
import { EmptyRow, HeadingIcon, RoleBadge, Section, Table, Td, formatDate } from "@/components/admin/ui";
import {
  ChartIcon,
  ChatIcon,
  ClockIcon,
  FlagIcon,
  MailIcon,
  PackageIcon,
  UserPlusIcon,
  UsersIcon,
} from "@/components/icons";

// 「最新加入的會員」可以選的時間範圍
const RANGES = [
  { value: "today", label: "今天" },
  { value: "7d", label: "近 7 天" },
  { value: "30d", label: "近 30 天" },
  { value: "", label: "全部" },
] as const;

const DAY_MS = 24 * 60 * 60 * 1000;
const TAIPEI_OFFSET_MS = 8 * 60 * 60 * 1000;

// 回傳時間範圍的起點；「今天」以台灣時間的午夜起算
function rangeStart(range: string) {
  const now = Date.now();
  if (range === "today") return new Date(Math.floor((now + TAIPEI_OFFSET_MS) / DAY_MS) * DAY_MS - TAIPEI_OFFSET_MS);
  if (range === "7d") return new Date(now - 7 * DAY_MS);
  if (range === "30d") return new Date(now - 30 * DAY_MS);
  return null;
}

// 這個月 1 號的台灣時間午夜，以及月份（1–12）
function monthStart() {
  const taipeiNow = new Date(Date.now() + TAIPEI_OFFSET_MS);
  const year = taipeiNow.getUTCFullYear();
  const month = taipeiNow.getUTCMonth();
  return { start: new Date(Date.UTC(year, month, 1) - TAIPEI_OFFSET_MS), month: month + 1 };
}

type Stat = {
  label: string;
  icon: (props: { className?: string }) => React.ReactNode;
  value: number;
  note?: string;
  href: string;
  // 有值就顯示驚嘆號提示（內容是給螢幕閱讀器的說明）
  alert?: string;
  breakdown?: { label: string; value: number; className: string }[];
};

// 總覽的數字卡片
function StatCard({ stat: s }: { stat: Stat }) {
  return (
    <Link
      href={s.href}
      className={`relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${
        s.alert ? "border-amber-300" : "border-brand/25"
      }`}
    >
      {/* 卡片上緣的科技藍漸層細線（和表格表頭同色），待處理時改成琥珀色 */}
      <span
        className={`absolute inset-x-0 top-0 h-1 ${s.alert ? "bg-amber-400" : "bg-gradient-to-r from-brand-navy to-brand"}`}
      />
      {s.alert && (
        <span className="absolute top-5 right-5">
          <AlertBadge label={s.alert} />
        </span>
      )}
      <p className="flex items-center gap-2 text-sm text-ink/50">
        <HeadingIcon size="sm">
          <s.icon className="h-4 w-4" />
        </HeadingIcon>
        {s.label}
      </p>
      <p className="mt-2 text-3xl font-black tabular-nums text-brand-navy">{s.value}</p>
      {s.breakdown ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {s.breakdown.map((b) => (
            <span key={b.label} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${b.className}`}>
              {b.label}
              <span className="tabular-nums">{b.value}</span>位
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-xs text-ink/40">{s.note}</p>
      )}
    </Link>
  );
}

export default async function AdminHome({ searchParams }: PageProps<"/admin">) {
  // 換頁時 layout 不一定會重新執行，所以每一頁都要自己檢查權限
  await requireAdminPage();
  const params = await searchParams;
  const range = RANGES.find((r) => r.value === params.range)?.value ?? "";
  const since = rangeStart(range);
  const joinedFilter = since ? { createdAt: { $gte: since } } : {};
  const thisMonth = monthStart();
  await connectDB();
  const [
    userCount,
    adminCount,
    openMessageCount,
    pendingCount,
    subscriberCount,
    recentUsers,
    goals,
    joinedCount,
    monthUserCount,
    monthSubscriberCount,
    pendingOrderCount,
  ] = await Promise.all([
    UserModel.countDocuments(),
    UserModel.countDocuments({ role: "admin" }),
    MessageModel.countDocuments(OPEN_MESSAGE_FILTER),
    PendingRegistrationModel.countDocuments({ expiresAt: { $gt: new Date() } }),
    SubscriberModel.countDocuments(),
    findUsersAdminFirst({ filter: joinedFilter, limit: 10 }),
    GoalModel.find().lean(),
    UserModel.countDocuments(joinedFilter),
    UserModel.countDocuments({ createdAt: { $gte: thisMonth.start } }),
    SubscriberModel.countDocuments({ subscribedAt: { $gte: thisMonth.start } }),
    OrderModel.countDocuments({ status: "pending" }),
  ]);

  const goalValues: Record<GoalMetric, number> = {
    members: userCount,
    members_month: monthUserCount,
    subscribers: subscriberCount,
    subscribers_month: monthSubscriberCount,
  };
  const targetOf = (metric: GoalMetric) => goals.find((g) => g.metric === metric)?.target ?? null;

  // 待處理工作：要管理者動手處理的事
  const tasks: Stat[] = [
    {
      label: "待出貨訂單",
      icon: PackageIcon,
      value: pendingOrderCount,
      note: pendingOrderCount > 0 ? "有訂單還沒出貨喔" : "都出貨了",
      href: "/admin/orders?status=pending",
      alert: pendingOrderCount > 0 ? `${pendingOrderCount} 筆待出貨訂單` : undefined,
    },
    {
      label: "待處理留言",
      icon: ChatIcon,
      value: openMessageCount,
      note: openMessageCount > 0 ? "有留言還沒回覆喔" : "都處理完了",
      href: "/admin/messages?status=open",
      alert: openMessageCount > 0 ? `${openMessageCount} 則待處理留言` : undefined,
    },
    { label: "待驗證註冊", icon: ClockIcon, value: pendingCount, note: "尚未輸入驗證碼", href: "/admin/pending" },
  ];

  // 數據瀏覽：看看就好的數字
  const metrics: Stat[] = [
    {
      label: "會員總數",
      icon: UsersIcon,
      value: userCount,
      href: "/admin/users",
      // 依身份拆開：管理者、一般會員（舊帳號沒有 role 也算一般會員）
      breakdown: [
        { label: "管理者", value: adminCount, className: "bg-ink text-white" },
        { label: "一般會員", value: userCount - adminCount, className: "bg-mist text-ink/70" },
      ],
    },
    { label: "電子報訂閱", icon: MailIcon, value: subscriberCount, note: "訂閱名單", href: "/admin/subscribers" },
  ];

  return (
    <>
      <div className="flex flex-col gap-6">
        <Section title="待處理工作" icon={<ClockIcon className="h-4 w-4" />} desc="需要處理的事情">
          <div className="grid gap-4 sm:grid-cols-3">
            {tasks.map((s) => (
              <StatCard key={s.label} stat={s} />
            ))}
          </div>
        </Section>

        <Section title="數據瀏覽" icon={<ChartIcon className="h-4 w-4" />} desc="網站目前的狀況">
          <div className="grid gap-4 sm:grid-cols-2">
            {metrics.map((s) => (
              <StatCard key={s.label} stat={s} />
            ))}
          </div>
        </Section>

        <Section
          title="目標進度"
          icon={<FlagIcon className="h-4 w-4" />}
          desc="設定目標後顯示達成率"
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {GOAL_METRICS.map((m) => (
              <GoalCard
                key={m.key}
                metric={m.key}
                label={m.label}
                unit={m.unit}
                href={m.href}
                value={goalValues[m.key]}
                target={targetOf(m.key)}
                hint={m.monthly ? `${thisMonth.month} 月・每月目標` : undefined}
              />
            ))}
          </div>
        </Section>

        <Section
          title="最新加入的會員"
          icon={<UserPlusIcon className="h-4 w-4" />}
          desc={`${since ? `共 ${joinedCount} 位・` : ""}管理者置頂`}
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-1.5">
                {RANGES.map((r) => (
                  <Link
                    key={r.value}
                    href={r.value ? `/admin?range=${r.value}` : "/admin"}
                    scroll={false}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      range === r.value
                        ? "border-brand-navy bg-brand-navy text-white"
                        : "border-line bg-white text-ink/60 hover:text-ink"
                    }`}
                  >
                    {r.label}
                  </Link>
                ))}
              </div>
              <Link href="/admin/users" className="text-sm font-medium text-ink underline underline-offset-4">
                查看全部 →
              </Link>
            </div>
          }
        >
          <Table head={["暱稱", "Email", "身份", "加入時間"]}>
            {recentUsers.length === 0 && (
              <EmptyRow colSpan={4} text={since ? "這段期間沒有新加入的會員" : "還沒有會員"} />
            )}
            {recentUsers.map((u) => (
              <tr key={u._id.toString()} className={adminRowClass(u.role)}>
                <Td>
                  <Link href={`/admin/users/${u._id}`} className="font-medium text-ink hover:underline">
                    {u.nickname ?? "—"}
                  </Link>
                </Td>
                <Td align="left">{u.email}</Td>
                <Td>
                  <RoleBadge role={u.role} />
                </Td>
                <Td>{formatDate(u.createdAt)}</Td>
              </tr>
            ))}
          </Table>
        </Section>
      </div>
    </>
  );
}
