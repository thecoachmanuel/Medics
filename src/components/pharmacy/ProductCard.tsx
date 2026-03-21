"use client";

import Link from "next/link";
import { usePharmacyCartStore } from "@/store/pharmacyCartStore";

type Product = {
  id: number;
  store_id: string;
  name: string;
  description?: string | null;
  price: number | string;
  currency?: string | null;
  stock_quantity?: number | null;
  image_urls?: unknown;
  pharmacy_categories?: { name?: string | null; slug?: string | null } | null;
  pharmacy_stores?: { name?: string | null; slug?: string | null } | null;
};

export function ProductCard({ product }: { product: Product }) {
  const addItem = usePharmacyCartStore((s) => s.addItem);
  const image = Array.isArray(product.image_urls) ? (product.image_urls as any[])[0] : undefined;
  const storeName = product.pharmacy_stores?.name ? String(product.pharmacy_stores.name) : "Pharmacy";

  return (
    <div className="rounded-lg border overflow-hidden bg-card text-card-foreground">
      <Link href={`/pharmacy/product/${product.id}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image || "/placeholder.svg"}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
      </Link>
      <div className="p-4">
        <div className="text-lg font-bold truncate">{product.name}</div>
        <p className="text-sm text-muted-foreground mt-1">{product.pharmacy_categories?.name || storeName}</p>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-lg font-semibold">{product.currency || "NGN"} {String(product.price)}</p>
          <button
            type="button"
            onClick={() => {
              addItem({
                storeId: product.store_id,
                storeName,
                productId: product.id,
                name: product.name,
                unitPrice: Number(product.price),
                currency: product.currency || "NGN",
                imageUrl: image ? String(image) : undefined,
              });
            }}
            className="px-3 py-1 rounded-md border bg-white text-gray-900 dark:bg-transparent dark:text-foreground"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
