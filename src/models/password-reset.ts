import { Schema, deleteModel, model, models, type InferSchemaType } from "mongoose";

// 忘記密碼的驗證碼，重設成功或過期後就會刪除
const passwordResetSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  lastSentAt: { type: Date, required: true },
  // MongoDB 會在這個時間之後自動刪除這筆資料
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

export type PasswordReset = InferSchemaType<typeof passwordResetSchema>;

if (models.PasswordReset) deleteModel("PasswordReset");
export const PasswordResetModel = model<PasswordReset>("PasswordReset", passwordResetSchema);
