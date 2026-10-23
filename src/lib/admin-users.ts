import "server-only";
import type { Types } from "mongoose";
import { UserModel, type User } from "@/models/user";

export type UserRow = User & { _id: Types.ObjectId; createdAt: Date };

// 後台列出會員時，管理者永遠排在最前面，其餘再依 order 排序
export function findUsersAdminFirst({
  filter = {},
  order = { createdAt: -1 },
  limit,
}: {
  filter?: Record<string, unknown>;
  order?: Record<string, 1 | -1>;
  limit: number;
}) {
  return UserModel.aggregate<UserRow>([
    { $match: filter },
    { $addFields: { isAdmin: { $eq: ["$role", "admin"] } } },
    { $sort: { isAdmin: -1, ...order, _id: -1 } },
    { $limit: limit },
  ]).collation({ locale: "zh_Hant" }); // 中文姓名依繁體中文規則排序
}

// 管理者那一列加上淡色底，和一般會員區分
export function adminRowClass(role?: string | null) {
  return role === "admin" ? "bg-cream/70" : undefined;
}
