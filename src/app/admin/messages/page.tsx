import Link from "next/link";
import { connectDB } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth";
import { MessageModel } from "@/models/message";
import {
  MESSAGE_CATEGORIES,
  contactMethodLabel,
  findCategory,
  messageTitle,
} from "@/lib/message-limits";
import {
  ANSWERED_MESSAGE_FILTER,
  OPEN_MESSAGE_FILTER,
  isOpen,
  threadOf,
} from "@/lib/message-thread";
import { deleteMessage, replyMessage } from "@/app/admin/actions";
import DeleteButton from "@/components/admin/delete-button";
import MessageThread from "@/components/messages/message-thread";
import ThreadReplyForm from "@/components/messages/thread-reply-form";
import { PageTitle, formatDate } from "@/components/admin/ui";

const statusFilters = [
  { value: "", label: "全部" },
  { value: "open", label: "待處理" },
  { value: "replied", label: "已回覆" },
];

// 舊留言沒有問題類型，歸在「未分類」
const UNCATEGORIZED = "none";

// 切換其中一種篩選時，保留另一種篩選
function filterHref(status: string, category: string) {
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (category) query.set("category", category);
  const qs = query.toString();
  return qs ? `/admin/messages?${qs}` : "/admin/messages";
}

function chipClass(active: boolean) {
  return `rounded-full border px-4 py-1.5 text-sm transition-colors ${
    active ? "border-ink bg-ink text-white" : "border-line bg-white text-ink/60 hover:text-ink"
  }`;
}

export default async function AdminMessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  await requireAdminPage();
  const params = await searchParams;
  const status = params.status === "open" || params.status === "replied" ? params.status : "";
  const category =
    params.category === UNCATEGORIZED || findCategory(params.category)
      ? String(params.category)
      : "";

  const statusFilter: Record<string, unknown> =
    status === "open" ? OPEN_MESSAGE_FILTER : status === "replied" ? ANSWERED_MESSAGE_FILTER : {};

  const filter: Record<string, unknown> = { ...statusFilter };
  if (category === UNCATEGORIZED) filter.category = { $in: [null, ""] };
  else if (category) filter.category = category;

  await connectDB();
  const [messages, openCount, categoryCounts] = await Promise.all([
    MessageModel.find(filter).sort({ lastActivityAt: -1, createdAt: -1 }).limit(200).lean(),
    MessageModel.countDocuments(OPEN_MESSAGE_FILTER),
    // 各問題類型的數量，會跟著「待處理／已回覆」的篩選變動
    MessageModel.aggregate<{ _id: string | null; count: number }>([
      { $match: statusFilter },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
  ]);
  const countOf = (value: string) =>
    categoryCounts
      .filter((c) => (value === UNCATEGORIZED ? !c._id : c._id === value))
      .reduce((sum, c) => sum + c.count, 0);
  const totalCount = categoryCounts.reduce((sum, c) => sum + c.count, 0);
  const uncategorizedCount = countOf(UNCATEGORIZED);
  // 待處理的排在前面，其次是最近有新訊息的
  messages.sort((a, b) => Number(!isOpen(a)) - Number(!isOpen(b)));

  return (
    <>
      <PageTitle title="會員留言" desc={`會員在會員中心「與我們聯絡」的留言，目前 ${openCount} 則待處理。`} />

      <div className="mb-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-16 shrink-0 text-xs text-ink/40">回覆狀態</span>
          {statusFilters.map((f) => (
            <Link key={f.value} href={filterHref(f.value, category)} className={chipClass(status === f.value)}>
              {f.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-16 shrink-0 text-xs text-ink/40">問題類型</span>
          <Link href={filterHref(status, "")} className={chipClass(category === "")}>
            全部 <span className="opacity-60">{totalCount}</span>
          </Link>
          {MESSAGE_CATEGORIES.map((c) => (
            <Link key={c.value} href={filterHref(status, c.value)} className={chipClass(category === c.value)}>
              {c.label} <span className="opacity-60">{countOf(c.value)}</span>
            </Link>
          ))}
          {(uncategorizedCount > 0 || category === UNCATEGORIZED) && (
            <Link
              href={filterHref(status, UNCATEGORIZED)}
              className={chipClass(category === UNCATEGORIZED)}
            >
              未分類 <span className="opacity-60">{uncategorizedCount}</span>
            </Link>
          )}
        </div>
      </div>

      {messages.length === 0 && (
        <p className="rounded-2xl border border-line bg-white px-6 py-10 text-center text-sm text-ink/40">
          目前沒有留言
        </p>
      )}
      <div className="flex flex-col gap-4">
        {messages.map((m) => {
          const id = m._id.toString();
          const open = isOpen(m);
          return (
            <article key={id} className="rounded-2xl border border-line bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-ink">
                    {m.subject && m.category && (
                      <span className="mr-2 rounded-md bg-mist px-2 py-0.5 align-middle text-xs font-medium text-ink/70">
                        {findCategory(m.category)?.label}
                      </span>
                    )}
                    {messageTitle(m)}
                  </p>
                  <p className="mt-1 text-xs text-ink/50">
                    <Link href={`/admin/users/${m.userId}`} className="hover:underline">
                      {m.nickname}（{m.email}）
                    </Link>
                    ・{formatDate(m.createdAt)}
                  </p>
                  {m.orderId && (
                    <p className="mt-2 text-xs text-ink/60">
                      訂單：<span className="font-medium text-ink">{m.orderId.toString()}</span>
                    </p>
                  )}
                  {m.contact && (
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-mist px-3 py-1 text-xs text-ink">
                      <span className="text-ink/50">{contactMethodLabel(m.contactMethod)}</span>
                      <span className="font-medium select-all">{m.contact}</span>
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    open ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"
                  }`}
                >
                  {open ? "待處理" : "已回覆"}
                </span>
              </div>
              <div className="mt-4">
                <MessageThread messageId={id} entries={threadOf(m)} viewer="admin" />
              </div>
              <div className="mt-4 border-t border-line pt-4">
                <ThreadReplyForm
                  messageId={id}
                  action={replyMessage}
                  placeholder="輸入回覆內容，會員會在會員中心看到"
                  submitLabel="送出回覆"
                />
              </div>
              <div className="mt-3 flex justify-end">
                <DeleteButton
                  id={id}
                  action={deleteMessage}
                  label="刪除留言"
                  confirmText={`確定要刪除「${messageTitle(m)}」這則留言嗎？會員那邊也會看不到。`}
                />
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
