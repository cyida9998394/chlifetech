import Image from "next/image";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth";
import { ProductModel } from "@/models/product";
import {
  channelsOf,
  formatProductNo,
  productStatusLabel,
  PURCHASE_MODES,
  purchaseModeOf,
  type PurchaseMode,
} from "@/lib/product-options";
import { deleteProduct, importHomepageProducts } from "@/app/admin/products/actions";
import DeleteButton from "@/components/admin/delete-button";
import ColorDots from "@/components/color-dots";
import { EmptyRow, PageTitle, Table, Td, formatDate } from "@/components/admin/ui";

const statusFilters = [
  { value: "", label: "全部" },
  { value: "published", label: "上架中" },
  { value: "draft", label: "草稿" },
];

function filterHref(status: string) {
  return status ? `/admin/products?status=${status}` : "/admin/products";
}

function chipClass(active: boolean) {
  return `rounded-full border px-4 py-1.5 text-sm transition-colors ${
    active ? "border-ink bg-ink text-white" : "border-line bg-white text-ink/60 hover:text-ink"
  }`;
}

// 購買方式欄：和產品表單的「購買方式」一樣，顯示「在官網購買」或「到蝦皮購買」
function PurchaseModeBadge({ mode, shopeeUrl, onWebsite }: { mode: PurchaseMode; shopeeUrl: string; onWebsite: boolean }) {
  const badge = "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium";
  const label = PURCHASE_MODES.find((m) => m.value === mode)?.label;
  return (
    <div className="flex flex-col items-center gap-1">
      {mode === "shopee" ? (
        shopeeUrl ? (
          <a
            href={shopeeUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="開啟蝦皮商品頁"
            className={`${badge} bg-orange-50 text-orange-700 hover:underline`}
          >
            {label} ↗
          </a>
        ) : (
          <span className={`${badge} bg-orange-50 text-orange-700`}>{label}（缺連結）</span>
        )
      ) : (
        <span className={`${badge} bg-brand-soft text-brand-navy`}>{label}</span>
      )}
      {!onWebsite && <span className="text-[11px] text-ink/40">官網不顯示</span>}
    </div>
  );
}

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdminPage();
  const params = await searchParams;
  const status = params.status === "published" || params.status === "draft" ? params.status : "";
  const filter: Record<string, unknown> = status ? { status } : {};

  await connectDB();
  const [products, totalCount, publishedCount] = await Promise.all([
    ProductModel.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean(),
    ProductModel.countDocuments(),
    ProductModel.countDocuments({ status: "published" }),
  ]);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <PageTitle title="產品管理" desc={`共 ${totalCount} 個產品，${publishedCount} 個上架中。上架中且有勾「官網」的產品會在首頁顯示介紹，有填蝦皮連結的會多一個「到蝦皮購買」按鈕。`} />
        <Link
          href="/admin/products/new"
          className="mb-6 rounded-full bg-brand-navy px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-navy/85"
        >
          ＋ 新增產品
        </Link>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {statusFilters.map((f) => (
          <Link key={f.value} href={filterHref(f.value)} className={chipClass(status === f.value)}>
            {f.label}
          </Link>
        ))}
      </div>

      {totalCount === 0 && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-brand/40 bg-brand-soft/40 px-6 py-5">
          <p className="text-sm text-ink/70">
            還沒有任何產品。首頁目前顯示的是原本寫在程式裡的產品，可以一鍵匯入成草稿再補上價格。
          </p>
          <form action={importHomepageProducts}>
            <button className="rounded-full border border-brand-navy px-4 py-2 text-sm font-medium text-brand-navy transition-colors hover:bg-brand-navy hover:text-white">
              匯入首頁現有產品
            </button>
          </form>
        </div>
      )}

      <Table head={["產品編號", "產品", "價格", "庫存", "狀態", "排序", "最後更新", "購買方式", ""]}>
        {products.length === 0 && <EmptyRow colSpan={9} text="沒有符合的產品" />}
        {products.map((p) => {
          const id = p._id.toString();
          const published = p.status === "published";
          return (
            <tr key={id}>
              {/* 產品編號：藍色、純文字（不是連結） */}
              <Td className="whitespace-nowrap">
                <span className="font-medium tabular-nums text-brand">{formatProductNo(p.productNo) || "—"}</span>
              </Td>
              <Td align="left">
                <Link href={`/admin/products/${id}`} className="inline-flex items-center gap-3 hover:underline">
                  <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md bg-mist">
                    {p.imageUrl && (
                      <Image src={p.imageUrl} alt="" fill unoptimized sizes="40px" className="object-cover" />
                    )}
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="font-medium text-ink">{p.name}</span>
                    <ColorDots variants={p.variants ?? []} />
                  </span>
                </Link>
              </Td>
              <Td className="tabular-nums">NT$ {p.price.toLocaleString()}</Td>
              <Td className="tabular-nums">
                {p.stock === 0 ? <span className="text-red-600">缺貨</span> : p.stock.toLocaleString()}
              </Td>
              <Td>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    published ? "bg-green-50 text-green-700" : "bg-mist text-ink/60"
                  }`}
                >
                  {productStatusLabel(p.status)}
                </span>
              </Td>
              <Td className="tabular-nums">{p.sortOrder}</Td>
              <Td>
                <p>{formatDate(p.updatedAt)}</p>
                {p.updatedBy && <p className="mt-0.5 text-xs text-ink/50">{p.updatedBy} 更新</p>}
              </Td>
              <Td>
                <PurchaseModeBadge
                  mode={purchaseModeOf(p)}
                  shopeeUrl={channelsOf(p).includes("shopee") ? p.shopeeUrl ?? "" : ""}
                  onWebsite={channelsOf(p).includes("website")}
                />
              </Td>
              <Td>
                {/* 上架狀態請到編輯頁修改，列表只放編輯和刪除，避免誤按 */}
                <div className="flex items-center justify-center gap-2">
                  <Link
                    href={`/admin/products/${id}`}
                    className="rounded-full border border-ink/20 bg-white px-3 py-1 text-sm font-medium text-ink transition-colors hover:border-brand-navy hover:text-brand-navy"
                  >
                    編輯
                  </Link>
                  <DeleteButton
                    id={id}
                    action={deleteProduct}
                    variant="boxed"
                    confirmText={`確定要刪除產品「${p.name}」嗎？刪除後無法復原。`}
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
