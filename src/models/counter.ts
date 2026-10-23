import { Schema, deleteModel, model, models, type InferSchemaType } from "mongoose";

// 流水號計數器，例如 key = "product-20261023" 記錄那一天已經用到第幾號
const counterSchema = new Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, required: true, default: 0 },
});

export type Counter = InferSchemaType<typeof counterSchema>;

if (models.Counter) deleteModel("Counter");
export const CounterModel = model<Counter>("Counter", counterSchema);
