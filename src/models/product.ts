import { Schema, deleteModel, model, models, type InferSchemaType } from "mongoose";
import {
  MAX_PRODUCT_DESCRIPTION,
  MAX_PRODUCT_NAME,
  MAX_PRODUCT_SUMMARY,
  PRODUCT_CHANNELS,
  PRODUCT_STATUSES,
  MAX_VARIANT_NAME,
} from "@/lib/product-options";

// 產品的顏色選項
const variantSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: MAX_VARIANT_NAME },
  // 色票，#rrggbb
  color: { type: String, required: true, match: /^#[0-9a-fA-F]{6}$/ },
  stock: { type: Number, required: true, min: 0, default: 0 },
  imageUrl: { type: String, trim: true, default: "" },
});

// 產品上架管理：後台新增、編輯，狀態是「上架中」的才會出現在首頁
const productSchema = new Schema(
  {
    // 自動編號：建立日期＋當天流水號，例如 20261023001（顯示時前面加 #），建立後不會再變
    productNo: { type: String, unique: true, sparse: true },
    name: { type: String, required: true, trim: true, maxlength: MAX_PRODUCT_NAME },
    // 首頁卡片上的一句話介紹
    summary: { type: String, trim: true, maxlength: MAX_PRODUCT_SUMMARY, default: "" },
    description: { type: String, trim: true, maxlength: MAX_PRODUCT_DESCRIPTION, default: "" },
    tags: { type: [String], default: [] },
    // 新台幣，整數
    price: { type: Number, required: true, min: 0 },
    // 原價（選填），比售價高時產品頁會顯示「特價商品」
    originalPrice: { type: Number, min: 0, default: 0 },
    // 有分顏色時是各顏色庫存的總和（存檔時自動計算）
    stock: { type: Number, required: true, min: 0, default: 0 },
    variants: { type: [variantSchema], default: [] },
    // 客製化顏色預覽：前台讓使用者自己選顏色，畫面即時換色
    customizer: {
      enabled: { type: Boolean, default: false },
      baseImageUrl: { type: String, trim: true, default: "" },
      maskImageUrl: { type: String, trim: true, default: "" },
    },
    imageUrl: { type: String, trim: true, default: "" },
    // 產品頁左邊照片牆的更多照片（主圖之外）
    gallery: { type: [String], default: [] },
    status: { type: String, enum: PRODUCT_STATUSES.map((s) => s.value), default: "draft", index: true },
    // 販售通路，至少一個；官網＋上架中才會顯示在首頁
    channels: { type: [{ type: String, enum: PRODUCT_CHANNELS.map((c) => c.value) }], default: undefined },
    shopeeUrl: { type: String, trim: true, default: "" },
    // 購買方式：website = 官網加入購物車、shopee = 按鈕直接連到蝦皮
    purchaseMode: { type: String, enum: ["website", "shopee"], default: "website" },
    // 數字小的排前面
    sortOrder: { type: Number, default: 0 },
    publishedAt: { type: Date },
    updatedBy: { type: String },
  },
  { timestamps: true },
);

export type Product = InferSchemaType<typeof productSchema>;

if (models.Product) deleteModel("Product");
export const ProductModel = model<Product>("Product", productSchema);
