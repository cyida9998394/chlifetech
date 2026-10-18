import { Schema, deleteModel, model, models, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    nickname: { type: String, required: true, trim: true },
    // 預留給之後的手機驗證
    phone: { type: String, trim: true },
    emailVerifiedAt: { type: Date },
  },
  { timestamps: true },
);

export type User = InferSchemaType<typeof userSchema>;

// 熱更新時會重新載入這個檔案，先移除舊的 model，欄位修改才會生效
if (models.User) deleteModel("User");
export const UserModel = model<User>("User", userSchema);
