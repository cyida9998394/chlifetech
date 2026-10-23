import Link from "next/link";
import { connectDB } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth";
import { adminRowClass, findUsersAdminFirst } from "@/lib/admin-users";
import DeleteUserButton from "@/components/admin/delete-user-button";
import { EmptyRow, PageTitle, RoleBadge, Table, Td, formatDate } from "@/components/admin/ui";

const selectClass =
  "rounded-full border border-line bg-white px-4 py-2 text-sm outline-none focus:border-ink";

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const admin = await requireAdminPage();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const role = params.role === "admin" || params.role === "user" ? params.role : "";
  const verified = params.verified === "yes" || params.verified === "no" ? params.verified : "";
  const sort = params.sort === "oldest" || params.sort === "name" ? params.sort : "newest";
  const filtering = Boolean(q || role || verified || sort !== "newest");

  const filter: Record<string, unknown> = {};
  if (q) {
    const re = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ email: re }, { name: re }, { nickname: re }];
  }
  // 舊帳號沒有 role 欄位，視為一般會員
  if (role === "admin") filter.role = "admin";
  if (role === "user") filter.role = { $ne: "admin" };
  if (verified === "yes") filter.emailVerifiedAt = { $ne: null };
  if (verified === "no") filter.emailVerifiedAt = null;

  const order: Record<string, 1 | -1> =
    sort === "oldest" ? { createdAt: 1 } : sort === "name" ? { name: 1 } : { createdAt: -1 };

  await connectDB();
  const users = await findUsersAdminFirst({ filter, order, limit: 200 });

  return (
    <>
      <PageTitle title="會員列表" desc={`共 ${users.length} 位${filtering ? "符合條件" : ""}，管理者固定排在最前面`} />

      <form className="mb-5 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="搜尋 Email、姓名或暱稱"
          className="w-full max-w-xs rounded-full border border-line bg-white px-4 py-2 text-sm outline-none focus:border-ink"
        />
        <select name="role" defaultValue={role} className={selectClass}>
          <option value="">全部身份</option>
          <option value="admin">管理者</option>
          <option value="user">一般會員</option>
        </select>
        <select name="verified" defaultValue={verified} className={selectClass}>
          <option value="">全部驗證狀態</option>
          <option value="yes">Email 已驗證</option>
          <option value="no">Email 未驗證</option>
        </select>
        <select name="sort" defaultValue={sort} className={selectClass}>
          <option value="newest">最新加入</option>
          <option value="oldest">最早加入</option>
          <option value="name">依姓名</option>
        </select>
        <button className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-white hover:bg-ink/85">
          搜尋
        </button>
        {filtering && (
          <Link href="/admin/users" className="self-center text-sm text-ink/50 underline underline-offset-4">
            清除
          </Link>
        )}
      </form>

      <Table head={["姓名", "暱稱", "Email", "身份", "Email 驗證", "加入時間", ""]}>
        {users.length === 0 && <EmptyRow colSpan={7} text="找不到符合的會員" />}
        {users.map((u) => {
          const id = u._id.toString();
          const isSelf = id === admin.id;
          return (
            <tr key={id} className={adminRowClass(u.role)}>
              <Td>{u.name ?? "—"}</Td>
              <Td>{u.nickname ?? "—"}</Td>
              <Td align="left">{u.email}</Td>
              <Td>
                <RoleBadge role={u.role} />
              </Td>
              <Td>{u.emailVerifiedAt ? "已驗證" : <span className="text-ink/40">未驗證</span>}</Td>
              <Td>{formatDate(u.createdAt)}</Td>
              <Td>
                <div className="flex items-center justify-center gap-4">
                  <Link href={`/admin/users/${id}`} className="text-sm font-medium text-ink hover:underline">
                    編輯
                  </Link>
                  {isSelf ? (
                    <span className="text-xs text-ink/40">（你自己）</span>
                  ) : (
                    <DeleteUserButton id={id} email={u.email} />
                  )}
                </div>
              </Td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}
