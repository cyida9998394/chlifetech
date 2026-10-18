import { Schema, deleteModel, model, models, type InferSchemaType } from "mongoose";

// 尚未完成 Email 驗證的註冊資料，驗證成功後才會建立真正的 User
const pendingRegistrationSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  nickname: { type: String, required: true, trim: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  lastSentAt: { type: Date, required: true },
  // MongoDB 會在這個時間之後自動刪除這筆資料
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

export type PendingRegistration = InferSchemaType<typeof pendingRegistrationSchema>;

if (models.PendingRegistration) deleteModel("PendingRegistration");
export const PendingRegistrationModel = model<PendingRegistration>(
  "PendingRegistration",
  pendingRegistrationSchema,
);
