import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { requireUserPage } from "@/lib/auth";
import { MessageModel } from "@/models/message";
import { contactMethodLabel, findCategory, messageTitle } from "@/lib/message-limits";
import { isOpen, threadOf } from "@/lib/message-thread";
import { replyAsMember } from "@/app/account/actions";
import MessageForm from "@/components/account/message-form";
import MessageThread from "@/components/messages/message-thread";
import ThreadReplyForm from "@/components/messages/thread-reply-form";
import { Card } from "@/components/account/ui";
import { PageTitle, formatDate } from "@/components/admin/ui";

export default async function AccountMessagesPage() {
  const me = await requireUserPage();
  if (me.role === "admin") redirect("/admin/messages");
  await connectDB();
  const messages = await MessageModel.find({ userId: me.id })
    .sort({ lastActivityAt: -1, createdAt: -1 })
    .lean();

  return (
    <>
      <PageTitle title="與我們聯絡" desc="有任何問題或建議都可以留言給我們，回覆會顯示在這裡。" />
      <div className="max-w-2xl">
        <Card>
          {/* 訂單功能完成後，這裡改成傳入這位會員的訂單 */}
          <MessageForm email={me.email} orders={[]} />
        </Card>
      </div>

      <h3 className="mt-10 mb-4 text-base font-bold text-ink">我的留言</h3>
      {messages.length === 0 && <p className="text-sm text-ink/40">還沒有留言紀錄</p>}
      <div className="flex max-w-2xl flex-col gap-4">
        {messages.map((m) => {
          const id = m._id.toString();
          const open = isOpen(m);
          return (
          <article key={id} className="rounded-2xl border border-line bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-bold text-ink">
                {m.subject && m.category && (
                  <span className="mr-2 rounded-md bg-mist px-2 py-0.5 align-middle text-xs font-medium text-ink/70">
                    {findCategory(m.category)?.label}
                  </span>
                )}
                {messageTitle(m)}
              </p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  open ? "bg-mist text-ink/60" : "bg-green-50 text-green-700"
                }`}
              >
                {open ? "等待回覆" : "已回覆"}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink/40">
              {formatDate(m.createdAt)}
              {m.contact && `・${contactMethodLabel(m.contactMethod)}：${m.contact}`}
            </p>
            <div className="mt-4">
              <MessageThread messageId={id} entries={threadOf(m)} viewer="member" />
            </div>
            <div className="mt-4 border-t border-line pt-4">
              <ThreadReplyForm
                messageId={id}
                action={replyAsMember}
                placeholder="還有問題嗎？可以在這裡補充說明"
                submitLabel="送出"
              />
            </div>
          </article>
          );
        })}
      </div>
    </>
  );
}
