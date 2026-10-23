import TabNav from "@/components/tab-nav";
import AdminSubNav from "@/components/admin/admin-sub-nav";

// 後台架構：總覽／會員管理（會員列表、會員留言、待驗證註冊）／產品管理／電子報訂閱管理
export const MEMBER_SECTION = ["/admin/users", "/admin/messages", "/admin/pending"];

export default function AdminNav({ openMessages, pendingOrders = 0 }: { openMessages: number; pendingOrders?: number }) {
  const messageAlert = openMessages > 0 ? `${openMessages} 則待處理留言` : undefined;
  const tabs = [
    { label: "總覽", href: "/admin" },
    { label: "會員管理", href: "/admin/users", match: MEMBER_SECTION, alert: messageAlert },
    { label: "產品管理", href: "/admin/products" },
    {
      label: "訂單管理",
      href: "/admin/orders",
      alert: pendingOrders > 0 ? `${pendingOrders} 筆待出貨訂單` : undefined,
    },
    { label: "電子報訂閱管理", href: "/admin/subscribers" },
  ];
  return <TabNav tabs={tabs} />;
}

export function AdminMemberSubNav({ openMessages }: { openMessages: number }) {
  const messageAlert = openMessages > 0 ? `${openMessages} 則待處理留言` : undefined;
  return (
    <AdminSubNav
      section={MEMBER_SECTION}
      tabs={[
        { label: "會員列表", href: "/admin/users" },
        { label: "會員留言", href: "/admin/messages", alert: messageAlert },
        { label: "待驗證註冊", href: "/admin/pending" },
      ]}
    />
  );
}
