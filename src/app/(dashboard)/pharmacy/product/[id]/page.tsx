import { getPharmacyProductById } from "@/actions/pharmacy-actions";
import Link from "next/link";

type Params = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: Params) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const product = await getPharmacyProductById({ id });

  const image = Array.isArray(product.image_urls)
    ? (product.image_urls as any)[0]
    : undefined;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/pharmacy" className="text-sm text-muted-foreground">← Back to Pharmacy</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image || "/placeholder.svg"}
          alt={product.name}
          className="w-full h-80 object-cover rounded-lg border"
        />
        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          {product.pharmacy_categories && (
            <p className="text-sm text-muted-foreground mt-1">
              {(product as any).pharmacy_categories.name}
            </p>
          )}
          <p className="mt-4 text-lg font-semibold">${String(product.price)}</p>
          {product.description && (
            <p className="mt-4 text-sm leading-6">{product.description}</p>
          )}
          <div className="mt-6 flex gap-3">
            <button className="px-4 py-2 rounded-md border bg-white text-gray-900 dark:bg-transparent dark:text-foreground">
              Add to Cart
            </button>
            <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground">
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
