import { connectDB } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth";
import { PendingRegistrationModel } from "@/models/pending-registration";
import { deletePendingRegistration } from "@/app/admin/actions";
import DeleteButton from "@/components/admin/delete-button";
import { EmptyRow, PageTitle, Table, Td, formatDate } from "@/components/admin/ui";

function isExpired(expiresAt: Date) {
  return expiresAt.getTime() < Date.now();
}

export default async function AdminPendingPage() {
  await requireAdminPage();
  await connectDB();
  const pending = await PendingRegistrationModel.find().sort({ lastSentAt: -1 }).lean();

  return (
    <>
      <PageTitle
        title="待驗證註冊"
        desc="已填寫註冊資料、但還沒輸入驗證碼的人。過期後系統會自動清除。"
      />
      <Table head={["姓名", "暱稱", "Email", "驗證碼寄出時間", "狀態", ""]}>
        {pending.length === 0 && <EmptyRow colSpan={6} text="目前沒有待驗證的註冊" />}
        {pending.map((p) => {
          const id = p._id.toString();
          const expired = isExpired(p.expiresAt);
          return (
            <tr key={id}>
              <Td>{p.name}</Td>
              <Td>{p.nickname}</Td>
              <Td align="left">{p.email}</Td>
              <Td>{formatDate(p.lastSentAt)}</Td>
              <Td>
                {expired ? (
                  <span className="text-ink/40">已過期</span>
                ) : (
                  <span>等待驗證（錯誤 {p.attempts} 次）</span>
                )}
              </Td>
              <Td>
                <div className="flex justify-center">
                  <DeleteButton
                    id={id}
                    action={deletePendingRegistration}
                    confirmText={`確定要刪除 ${p.email} 的註冊資料嗎？對方需要重新註冊。`}
                  />
                </div>
              </Td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}
