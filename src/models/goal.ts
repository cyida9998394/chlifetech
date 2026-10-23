import { Schema, deleteModel, model, models, type InferSchemaType } from "mongoose";
import { GOAL_METRICS } from "@/lib/goals";

// 管理者在總覽設定的目標數，每個指標一筆
const goalSchema = new Schema(
  {
    metric: { type: String, required: true, unique: true, enum: GOAL_METRICS.map((m) => m.key) },
    target: { type: Number, required: true, min: 1 },
    updatedBy: { type: String },
  },
  { timestamps: true },
);

export type Goal = InferSchemaType<typeof goalSchema>;

if (models.Goal) deleteModel("Goal");
export const GoalModel = model<Goal>("Goal", goalSchema);
