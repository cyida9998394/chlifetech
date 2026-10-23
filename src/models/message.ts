import { Schema, deleteModel, model, models, type InferSchemaType } from "mongoose";
import {
  CONTACT_METHODS,
  MAX_CONTACT_LENGTH,
  MESSAGE_CATEGORIES,
  MAX_MESSAGE_LENGTH,
} from "@/lib/message-limits";

// 留言串裡的每一則回覆：管理者回覆、會員補充都放這裡
const replySchema = new Schema({
  author: { type: String, required: true, enum: ["member", "admin"] },
  authorName: { type: String, required: true },
  body: { type: String, required: true, trim: true, maxlength: MAX_MESSAGE_LENGTH },
  createdAt: { type: Date, default: Date.now },
  editedAt: { type: Date },
  editedBy: { type: String },
});

// 會員在會員中心「與我們聯絡」留下的訊息，管理者在後台回覆，可以一來一回
const messageSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    // 留言當下的 Email 和暱稱，會員之後被刪除也看得到是誰留的
    email: { type: String, required: true },
    nickname: { type: String, required: true },
    category: { type: String, enum: MESSAGE_CATEGORIES.map((c) => c.value) },
    // 相關訂單，訂單功能完成後再開始寫入
    orderId: { type: Schema.Types.ObjectId },
    // 會員希望我們用什麼方式聯絡他
    contactMethod: { type: String, enum: CONTACT_METHODS.map((m) => m.value) },
    contact: { type: String, trim: true, maxlength: MAX_CONTACT_LENGTH },
    // 舊留言才有主旨，現在改成只選問題類型
    subject: { type: String, trim: true },
    body: { type: String, required: true, trim: true, maxlength: MAX_MESSAGE_LENGTH },
    replies: { type: [replySchema], default: [] },
    // 最後一則是誰說的：member = 待處理、admin = 已回覆
    lastFrom: { type: String, enum: ["member", "admin"] },
    lastActivityAt: { type: Date },
    // 舊版只能回覆一次的欄位，第一次回覆或編輯時會搬進 replies
    reply: { type: String, trim: true, maxlength: MAX_MESSAGE_LENGTH },
    repliedAt: { type: Date },
    repliedBy: { type: String },
  },
  { timestamps: true },
);

export type Message = InferSchemaType<typeof messageSchema>;

if (models.Message) deleteModel("Message");
export const MessageModel = model<Message>("Message", messageSchema);

type MessageDoc = ReturnType<typeof MessageModel.hydrate>;

// 舊版的單次回覆搬進 replies，之後就只看 replies
export function moveLegacyReply(doc: MessageDoc) {
  if (doc.reply && doc.replies.length === 0) {
    doc.replies.push({
      author: "admin",
      authorName: doc.repliedBy || "管理者",
      body: doc.reply,
      createdAt: doc.repliedAt ?? doc.get("updatedAt"),
    });
  }
  doc.set({ reply: undefined, repliedAt: undefined, repliedBy: undefined });
}
