import { Schema, deleteModel, model, models, type InferSchemaType } from "mongoose";

// 網站設定：一個 key 一筆，例如 "shipping" 存運費設定
const settingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    updatedBy: { type: String },
  },
  { timestamps: true },
);

export type Setting = InferSchemaType<typeof settingSchema>;

if (models.Setting) deleteModel("Setting");
export const SettingModel = model<Setting>("Setting", settingSchema);
