import Link from "next/link";
import { getPharmacyProducts } from "@/actions/pharmacy-actions";

type Product = Awaited<ReturnType<typeof getPharmacyProducts>>["data"][0];

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="rounded-lg border overflow-hidden bg-card text-card-foreground">
      <Link href={`/pharmacy/product/${product.id}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={(Array.isArray(product.image_urls) ? (product.image_urls as any)[0] : undefined) || "/placeholder.svg"}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
      </Link>
      <div className="p-4">
        <div className="text-lg font-bold truncate">{product.name}</div>
        <p className="text-sm text-muted-foreground mt-1">{(product as any).pharmacy_categories?.name}</p>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-lg font-semibold">${String(product.price)}</p>
          <button className="px-3 py-1 rounded-md border bg-white text-gray-900 dark:bg-transparent dark:text-foreground">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
