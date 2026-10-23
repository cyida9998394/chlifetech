import BackLink from "@/components/back-link";
import { requireAdminPage } from "@/lib/auth";
import ProductForm from "@/components/admin/product-form";
import { PageTitle } from "@/components/admin/ui";

export default async function NewProductPage() {
  await requireAdminPage();

  return (
    <>
      <BackLink href="/admin/products">回產品列表</BackLink>
      <div className="mt-4">
        <PageTitle title="新增產品" desc="先存成草稿，確認沒問題再上架。" />
      </div>
      <ProductForm />
    </>
  );
}
