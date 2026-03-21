"use client";

import { useRouter } from "next/navigation";
import { usePharmacyCartStore } from "@/store/pharmacyCartStore";

type ProductActionsProps = {
  product: {
    id: number;
    store_id: string;
    name: string;
    price: number | string;
    currency?: string | null;
    image_urls?: unknown;
    pharmacy_stores?: { name?: string | null } | null;
  };
};

export function ProductActions({ product }: ProductActionsProps) {
  const router = useRouter();
  const addItem = usePharmacyCartStore((s) => s.addItem);

  const image = Array.isArray(product.image_urls) ? (product.image_urls as any[])[0] : undefined;
  const storeName = product.pharmacy_stores?.name ? String(product.pharmacy_stores.name) : "Pharmacy";

  const add = () => {
    addItem({
      storeId: product.store_id,
      storeName,
      productId: product.id,
      name: product.name,
      unitPrice: Number(product.price),
      currency: product.currency || "NGN",
      imageUrl: image ? String(image) : undefined,
    });
  };

  return (
    <div className="mt-6 flex gap-3">
      <button
        type="button"
        onClick={add}
        className="px-4 py-2 rounded-md border bg-white text-gray-900 dark:bg-transparent dark:text-foreground"
      >
        Add to Cart
      </button>
      <button
        type="button"
        onClick={() => {
          add();
          router.push("/pharmacy/checkout");
        }}
        className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
      >
        Buy Now
      </button>
    </div>
  );
}

