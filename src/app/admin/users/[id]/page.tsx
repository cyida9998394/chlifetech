import BackLink from "@/components/back-link";
import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth";
import { UserModel } from "@/models/user";
import DeleteUserButton from "@/components/admin/delete-user-button";
import UserEditForm from "@/components/admin/user-edit-form";
import { PageTitle, formatDate } from "@/components/admin/ui";
import { cvsBrandLabel } from "@/lib/order-options";

export default async function AdminUserDetailPage({ params }: PageProps<"/admin/users/[id]">) {
  const admin = await requireAdminPage();
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  await connectDB();
  const user = await UserModel.findById(id).lean();
  if (!user) notFound();

  const isSelf = id === admin.id;

  return (
    <>
      <BackLink href="/admin/users">回會員列表</BackLink>
      <div className="mt-4">
        <PageTitle title={user.nickname ?? user.email} desc={user.email} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">
          <UserEditForm
            id={id}
            name={user.name ?? ""}
            nickname={user.nickname ?? ""}
            role={user.role === "admin" ? "admin" : "user"}
            isSelf={isSelf}
          />
        </div>

        <div className="flex flex-col gap-6">
          <dl className="rounded-2xl border border-line bg-white p-6 text-sm">
            {[
              ["Email", user.email],
              ["Email 驗證", user.emailVerifiedAt ? formatDate(user.emailVerifiedAt) : "未驗證"],
              ["手機", user.phone || "—"],
              ["收件人", user.shippingInfo?.recipientName || "—"],
              ["收件電話", user.shippingInfo?.phone || "—"],
              ["宅配地址", user.shippingInfo?.address || "—"],
              [
                "常用超商",
                user.shippingInfo?.cvsBrand
                  ? `${cvsBrandLabel(user.shippingInfo.cvsBrand)} ${user.shippingInfo.cvsStore ?? ""}`
                  : "—",
              ],
              ["加入時間", formatDate(user.createdAt)],
              ["最後更新", formatDate(user.updatedAt)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-line py-2.5 last:border-0">
                <dt className="text-ink/50">{label}</dt>
                <dd className="text-right text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          {!isSelf && (
            <div className="rounded-2xl border border-red-200 bg-white p-6">
              <p className="text-sm font-bold text-ink">刪除會員</p>
              <p className="mt-1 mb-4 text-xs text-ink/50">刪除後這位會員將無法登入，資料無法復原。</p>
              <DeleteUserButton id={id} email={user.email} label="刪除這位會員" redirectTo="/admin/users" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
