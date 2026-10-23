import { connectDB } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth";
import { SubscriberModel } from "@/models/subscriber";
import { deleteSubscriber } from "@/app/admin/actions";
import DeleteButton from "@/components/admin/delete-button";
import { EmptyRow, PageTitle, Table, Td, formatDate } from "@/components/admin/ui";

export default async function AdminSubscribersPage() {
  await requireAdminPage();
  await connectDB();
  const subscribers = await SubscriberModel.find().sort({ subscribedAt: -1 }).lean();

  return (
    <>
      <PageTitle title="電子報訂閱管理" desc={`共 ${subscribers.length} 位訂閱者`} />
      <Table head={["Email", "訂閱時間", ""]}>
        {subscribers.length === 0 && <EmptyRow colSpan={3} text="還沒有人訂閱" />}
        {subscribers.map((s) => {
          const id = s._id.toString();
          return (
            <tr key={id}>
              <Td>{s.email}</Td>
              <Td>{formatDate(s.subscribedAt)}</Td>
              <Td>
                <div className="flex justify-center">
                  <DeleteButton
                    id={id}
                    action={deleteSubscriber}
                    label="移除"
                    confirmText={`確定要把 ${s.email} 從訂閱名單移除嗎？`}
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
