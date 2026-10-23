import { formatDate } from "@/components/admin/ui";
import EditableBubble from "@/components/messages/editable-bubble";
import type { ThreadEntry } from "@/lib/message-thread";

type Props = {
  messageId: string;
  entries: ThreadEntry[];
  // 從誰的角度看：自己的訊息靠右，對方的靠左
  viewer: "admin" | "member";
};

// 一來一回的留言串
export default function MessageThread({ messageId, entries, viewer }: Props) {
  return (
    <ol className="flex flex-col gap-3">
      {entries.map((e) => {
        const mine = e.author === viewer;
        // 會員看到的管理者名稱統一顯示公司名
        const name = e.author === "admin" && viewer === "member" ? "承禾生活科技" : e.authorName;
        // 管理者的回覆可以在後台編輯，會員的留言不行
        const editable = viewer === "admin" && e.author === "admin" && !e.original;
        const bubble = (
          // 可編輯時寬度限制交給外層 EditableBubble
          <div className={`flex flex-col gap-1 ${editable ? "" : "max-w-[85%]"} ${mine ? "items-end" : "items-start"}`}>
            <p className="text-xs text-ink/40">
              {name}・{formatDate(e.createdAt)}
              {e.editedAt && "・已編輯"}
            </p>
            <p
              className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                mine ? "rounded-tr-md bg-brand-soft text-ink" : "rounded-tl-md bg-mist text-ink/85"
              }`}
            >
              {e.body}
            </p>
          </div>
        );
        return (
          <li key={e.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            {editable ? (
              <EditableBubble messageId={messageId} replyId={e.id} body={e.body}>
                {bubble}
              </EditableBubble>
            ) : (
              bubble
            )}
          </li>
        );
      })}
    </ol>
  );
}
