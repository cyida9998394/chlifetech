import { Schema, deleteModel, model, models, type InferSchemaType } from "mongoose";

// 會員購物車裡的一項商品：同一個產品、同一個顏色只會有一筆，數量累加
const cartItemSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    productId: { type: Schema.Types.ObjectId, required: true },
    // 選的顏色名稱；沒有分顏色時是空字串
    variantName: { type: String, default: "" },
    // 「自訂」顏色的色碼（#aabbcc）；不是自訂時是空字串
    customColor: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
  },
  { timestamps: true },
);
cartItemSchema.index({ userId: 1, productId: 1, variantName: 1, customColor: 1 }, { unique: true });

export type CartItem = InferSchemaType<typeof cartItemSchema>;

if (models.CartItem) deleteModel("CartItem");
export const CartItemModel = model<CartItem>("CartItem", cartItemSchema);
