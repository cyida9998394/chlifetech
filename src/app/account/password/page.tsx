import { requireUserPage } from "@/lib/auth";
import PasswordForm from "@/components/account/password-form";
import { Card } from "@/components/account/ui";
import { PageTitle } from "@/components/admin/ui";

export default async function AccountPasswordPage() {
  await requireUserPage();

  return (
    <>
      <PageTitle title="修改密碼" desc="需要先輸入目前的密碼。忘記密碼請登出後使用「忘記密碼」。" />
      <div className="max-w-xl">
        <Card>
          <PasswordForm />
        </Card>
      </div>
    </>
  );
}
