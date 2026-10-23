import { Schema, deleteModel, model, models, type InferSchemaType } from "mongoose";

// 後台上傳的產品圖片，直接存在資料庫裡，由 /api/product-images/[id] 提供
const productImageSchema = new Schema(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedBy: { type: String },
  },
  { timestamps: true },
);

export type ProductImage = InferSchemaType<typeof productImageSchema>;

if (models.ProductImage) deleteModel("ProductImage");
export const ProductImageModel = model<ProductImage>("ProductImage", productImageSchema);
