import { Schema, deleteModel, model, models, type InferSchemaType } from "mongoose";
import { ORDER_STATUSES } from "@/lib/order-options";

// 訂單裡的一項商品：下單當下的名稱、顏色、價格都存下來，之後產品改了也不影響訂單
const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, required: true },
    productNo: { type: String, default: "" },
    name: { type: String, required: true },
    variantName: { type: String, default: "" },
    customColor: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const statusChangeSchema = new Schema(
  {
    status: { type: String, required: true },
    at: { type: Date, default: Date.now },
    by: { type: String },
  },
  { _id: false },
);

// 官網訂單：目前只有貨到付款
const orderSchema = new Schema(
  {
    // 訂單流水號（10 碼），例如 2610230001
    orderNo: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    email: { type: String, required: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, default: "cod" },
    delivery: {
      method: { type: String, enum: ["home", "cvs"], required: true },
      recipientName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      // 宅配用
      address: { type: String, trim: true, default: "" },
      // 超商取貨用
      cvsBrand: { type: String, default: "" },
      cvsStore: { type: String, trim: true, default: "" },
    },
    note: { type: String, trim: true, default: "" },
    status: { type: String, enum: ORDER_STATUSES.map((s) => s.value), default: "pending", index: true },
    statusHistory: { type: [statusChangeSchema], default: [] },
    trackingNo: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

export type Order = InferSchemaType<typeof orderSchema>;

if (models.Order) deleteModel("Order");
export const OrderModel = model<Order>("Order", orderSchema);
