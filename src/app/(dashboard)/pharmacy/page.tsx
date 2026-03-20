import { getPharmacyProducts, getPharmacyCategories } from "@/actions/pharmacy-actions";
import { ProductCard } from "@/components/pharmacy/ProductCard";
import { Pagination } from "@/components/shared/Pagination";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PharmacyPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const page = typeof sp.page === "string" ? Number(sp.page) : 1;
  const limit = typeof sp.limit === "string" ? Number(sp.limit) : 12;
  const categoryId = typeof sp.category === "string" ? Number(sp.category) : undefined;
  const q = typeof sp.q === "string" ? sp.q : "";

  const [productsData, categories] = await Promise.all([
    getPharmacyProducts({ page, limit, categoryId, q }),
    getPharmacyCategories(),
  ]);

  const { data: products, count } = productsData;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Pharmacy</h1>
          <Link
            href="/pharmacy/cart"
            className="px-3 py-2 rounded-md border bg-white text-gray-900 dark:bg-transparent dark:text-foreground text-sm"
          >
            Cart
          </Link>
          <Link
            href="/pharmacy/orders"
            className="px-3 py-2 rounded-md border bg-white text-gray-900 dark:bg-transparent dark:text-foreground text-sm"
          >
            Orders
          </Link>
          <Link
            href="/pharmacy/store"
            className="px-3 py-2 rounded-md border bg-white text-gray-900 dark:bg-transparent dark:text-foreground text-sm"
          >
            Store Dashboard
          </Link>
        </div>
        <form className="flex gap-3 w-full md:w-auto" action="" method="get">
          <input
            name="q"
            placeholder="Search products..."
            defaultValue={q}
            className="max-w-xs w-full px-3 py-2 rounded-md border bg-white text-gray-900 dark:bg-transparent dark:text-foreground"
          />
          <select
            name="category"
            defaultValue={categoryId ? String(categoryId) : ""}
            className="w-[180px] px-3 py-2 rounded-md border bg-white text-gray-900 dark:bg-transparent dark:text-foreground"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={String(category.id)}>
                {category.name}
              </option>
            ))}
          </select>
          <button className="px-4 py-2 rounded-md border bg-white text-gray-900 dark:bg-transparent dark:text-foreground">
            Apply
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {count && count > limit && (
        <div className="mt-8">
          <Pagination
            currentPage={page}
            totalCount={count}
            pageSize={limit}
          />
        </div>
      )}
    </div>
  );
}
