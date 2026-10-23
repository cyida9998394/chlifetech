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
    // 使用者身份：admin = 管理者、user = 一般會員
    role: { type: String, enum: ["user", "admin"], default: "user" },
    // 購物車選的配送方式：home = 宅配、cvs = 超商取貨
    deliveryMethod: { type: String, enum: ["home", "cvs"], default: "home" },
    // 預設收件資料：結帳時會自動帶入
    shippingInfo: {
      recipientName: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" },
      address: { type: String, trim: true, default: "" },
      cvsBrand: { type: String, default: "" },
      cvsStore: { type: String, trim: true, default: "" },
    },
  },
  { timestamps: true },
);

export type User = InferSchemaType<typeof userSchema>;
export type Role = "user" | "admin";
export const ROLE_LABELS: Record<Role, string> = { admin: "管理者", user: "一般會員" };

// 熱更新時會重新載入這個檔案，先移除舊的 model，欄位修改才會生效
if (models.User) deleteModel("User");
export const UserModel = model<User>("User", userSchema);
