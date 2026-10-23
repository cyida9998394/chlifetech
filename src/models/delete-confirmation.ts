import { Schema, deleteModel, model, models, type InferSchemaType } from "mongoose";

// 管理者刪除會員用的確認碼，每位管理者同時只會有一組
const deleteConfirmationSchema = new Schema({
  adminId: { type: String, required: true, unique: true },
  targetId: { type: String, required: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  lastSentAt: { type: Date, required: true },
  // MongoDB 會在這個時間之後自動刪除這筆資料
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

export type DeleteConfirmation = InferSchemaType<typeof deleteConfirmationSchema>;

if (models.DeleteConfirmation) deleteModel("DeleteConfirmation");
export const DeleteConfirmationModel = model<DeleteConfirmation>(
  "DeleteConfirmation",
  deleteConfirmationSchema,
);
