"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  selectCartTotal,
  usePharmacyCartStore,
} from "@/store/pharmacyCartStore";

export default function PharmacyCartPage() {
  const router = useRouter();
  const storeId = usePharmacyCartStore((s) => s.storeId);
  const storeName = usePharmacyCartStore((s) => s.storeName);
  const items = usePharmacyCartStore((s) => s.items);
  const removeItem = usePharmacyCartStore((s) => s.removeItem);
  const setQuantity = usePharmacyCartStore((s) => s.setQuantity);
  const clear = usePharmacyCartStore((s) => s.clear);

  const total = usePharmacyCartStore(selectCartTotal);

  const currency = useMemo(() => {
    const first = items[0];
    return first?.currency || "NGN";
  }, [items]);

  const hasItems = items.length > 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Your Cart</h1>
          {storeId ? (
            <p className="text-sm text-muted-foreground">Store: {storeName || storeId}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/pharmacy">Continue shopping</Link>
          </Button>
          <Button
            variant="destructive"
            disabled={!hasItems}
            onClick={() => clear()}
          >
            Clear cart
          </Button>
        </div>
      </div>

      {!hasItems ? (
        <Card>
          <CardHeader>
            <CardTitle>Your cart is empty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add items from a pharmacy store to place an order.
            </p>
            <Button asChild>
              <Link href="/pharmacy">Browse products</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.productId}>
                <CardContent className="p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-md bg-muted overflow-hidden flex items-center justify-center">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} width={64} height={64} className="h-full w-full object-cover" />
                      ) : (
                        <div className="text-xs text-muted-foreground">No image</div>
                      )}
                    </div>

                    <div>
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.currency} {Number(item.unitPrice).toLocaleString("en-NG")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-24">
                      <Input
                        inputMode="numeric"
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => {
                          const next = Math.max(1, Math.floor(Number(e.target.value || 1)));
                          setQuantity(item.productId, next);
                        }}
                      />
                    </div>
                    <Button variant="outline" onClick={() => removeItem(item.productId)}>
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Items</span>
                <span className="text-sm">{items.reduce((n, i) => n + i.quantity, 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-lg font-bold">
                  {currency} {Number(total).toLocaleString("en-NG")}
                </span>
              </div>

              <Button
                className="w-full"
                onClick={() => router.push("/pharmacy/checkout")}
              >
                Proceed to checkout
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
