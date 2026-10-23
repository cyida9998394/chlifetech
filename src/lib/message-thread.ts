// 留言串的共用邏輯：把留言整理成一則一則的對話，並判斷是否待處理

export const LEGACY_REPLY_ID = "legacy";
// 一則留言串最多幾則回覆，避免無限加長
export const MAX_REPLIES = 50;

export type ThreadEntry = {
  id: string;
  author: "member" | "admin";
  authorName: string;
  body: string;
  createdAt?: Date | null;
  editedAt?: Date | null;
  // 會員的第一則留言不能編輯
  original?: boolean;
};

type MessageLike = {
  body: string;
  nickname: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  reply?: string | null;
  repliedAt?: Date | null;
  repliedBy?: string | null;
  lastFrom?: string | null;
  replies?: Array<{
    _id?: { toString(): string };
    author: string;
    authorName?: string | null;
    body: string;
    createdAt?: Date | null;
    editedAt?: Date | null;
  }> | null;
};

export function threadOf(m: MessageLike): ThreadEntry[] {
  const entries: ThreadEntry[] = [
    { id: "original", author: "member", authorName: m.nickname, body: m.body, createdAt: m.createdAt, original: true },
  ];
  const replies = m.replies ?? [];
  if (replies.length > 0) {
    for (const r of replies) {
      entries.push({
        id: r._id?.toString() ?? "",
        author: r.author === "admin" ? "admin" : "member",
        authorName: r.authorName ?? "",
        body: r.body,
        createdAt: r.createdAt,
        editedAt: r.editedAt,
      });
    }
  } else if (m.reply) {
    // 舊版的單次回覆
    entries.push({
      id: LEGACY_REPLY_ID,
      author: "admin",
      authorName: m.repliedBy || "管理者",
      body: m.reply,
      createdAt: m.repliedAt ?? m.updatedAt,
    });
  }
  return entries;
}

// 最後一則是會員說的就是待處理
export function isOpen(m: MessageLike) {
  return m.lastFrom ? m.lastFrom === "member" : !m.reply;
}

// 給資料庫查詢用的「待處理」條件，要和 isOpen 一致
export const OPEN_MESSAGE_FILTER: Record<string, unknown> = {
  $or: [{ lastFrom: "member" }, { lastFrom: null, reply: { $in: [null, ""] } }],
};
export const ANSWERED_MESSAGE_FILTER: Record<string, unknown> = { $nor: [OPEN_MESSAGE_FILTER] };
