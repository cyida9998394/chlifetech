import { connectDB } from "@/lib/db";
import { requireUserPage } from "@/lib/auth";
import { UserModel, ROLE_LABELS } from "@/models/user";
import ProfileForm from "@/components/account/profile-form";
import ShippingInfoForm from "@/components/account/shipping-info-form";
import { EMPTY_SHIPPING_INFO } from "@/lib/order-options";
import { Card } from "@/components/account/ui";
import { PageTitle, formatDate } from "@/components/admin/ui";

export default async function AccountProfilePage() {
  // 換頁時 layout 不一定會重新執行，所以每一頁都要自己檢查登入
  const me = await requireUserPage();
  await connectDB();
  const user = await UserModel.findById(me.id).lean();
  if (!user) return null;

  return (
    <>
      <PageTitle title="會員資料" desc="查看和修改你的基本資料。" />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card>
          <ProfileForm email={user.email} name={user.name ?? ""} nickname={user.nickname ?? ""} />
        </Card>
        <dl className="h-fit rounded-2xl border border-line bg-white p-6 text-sm">
          {[
            ["會員身份", ROLE_LABELS[me.role]],
            ["Email 驗證", user.emailVerifiedAt ? "已驗證" : "未驗證"],
            ["加入時間", formatDate(user.createdAt)],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 border-b border-line py-2.5 last:border-0">
              <dt className="text-ink/50">{label}</dt>
              <dd className="text-right text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* 管理者不會下單，不顯示收件資料 */}
      {me.role !== "admin" && (
        <div className="mt-8">
          <h3 className="text-base font-bold text-ink">收件資料</h3>
          <p className="mt-1 mb-4 text-sm text-ink/50">存好之後，結帳時會自動帶入；結帳時也可以再修改。</p>
          <div className="max-w-3xl">
            <Card>
              <ShippingInfoForm initial={{ ...EMPTY_SHIPPING_INFO, ...(user.shippingInfo ?? {}) }} />
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
