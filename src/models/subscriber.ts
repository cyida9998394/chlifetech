import { Schema, deleteModel, model, models, type InferSchemaType } from "mongoose";

// 電子報訂閱名單
const subscriberSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  subscribedAt: { type: Date, default: Date.now },
});

export type Subscriber = InferSchemaType<typeof subscriberSchema>;

if (models.Subscriber) deleteModel("Subscriber");
export const SubscriberModel = model<Subscriber>("Subscriber", subscriberSchema);
