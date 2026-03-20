"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPharmacyOrder } from "@/actions/pharmacy-actions";
import { supabase } from "@/lib/supabase/client";
import {
  selectCartTotal,
  usePharmacyCartStore,
} from "@/store/pharmacyCartStore";

type ShippingFormState = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes: string;
};

export default function PharmacyCheckoutPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const storeId = usePharmacyCartStore((s) => s.storeId);
  const storeName = usePharmacyCartStore((s) => s.storeName);
  const items = usePharmacyCartStore((s) => s.items);
  const clear = usePharmacyCartStore((s) => s.clear);
  const total = usePharmacyCartStore(selectCartTotal);

  const currency = useMemo(() => {
    const first = items[0];
    return first?.currency || "NGN";
  }, [items]);

  const [form, setForm] = useState<ShippingFormState>({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Nigeria",
    notes: "",
  });

  const hasItems = items.length > 0;

  const update = (key: keyof ShippingFormState, value: string) => {
    setForm((s) => ({ ...s, [key]: value }));
  };

  const onPlaceOrder = () => {
    setError(null);
    if (!storeId || !hasItems) {
      setError("Your cart is empty.");
      return;
    }

    startTransition(async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        if (!accessToken) {
          setError("Please sign in to place an order.");
          return;
        }

        const res = await createPharmacyOrder({
          accessToken,
          storeId,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
          shippingAddress: {
            full_name: form.fullName,
            phone: form.phone,
            address_line1: form.addressLine1,
            address_line2: form.addressLine2 || undefined,
            city: form.city,
            state: form.state,
            postal_code: form.postalCode || undefined,
            country: form.country || "Nigeria",
            notes: form.notes || undefined,
          },
        });

        clear();
        router.replace(`/pharmacy/orders/${res.orderId}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unable to place order";
        setError(msg);
      }
    });
  };

  if (!hasItems || !storeId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Checkout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/pharmacy">Browse products</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/pharmacy/cart">View cart</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Checkout</h1>
          <p className="text-sm text-muted-foreground">Store: {storeName || storeId}</p>
        </div>

        <Button asChild variant="outline">
          <Link href="/pharmacy/cart">Back to cart</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Shipping details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address line 1</Label>
              <Input
                id="addressLine1"
                value={form.addressLine1}
                onChange={(e) => update("addressLine1", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address line 2 (optional)</Label>
              <Input
                id="addressLine2"
                value={form.addressLine2}
                onChange={(e) => update("addressLine2", e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={form.city} onChange={(e) => update("city", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" value={form.state} onChange={(e) => update("state", e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal code (optional)</Label>
                <Input
                  id="postalCode"
                  value={form.postalCode}
                  onChange={(e) => update("postalCode", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={form.country} onChange={(e) => update("country", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Order notes (optional)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </div>

            <div className="pt-2">
              <Button className="w-full" disabled={isPending} onClick={onPlaceOrder}>
                Place order
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {items.map((i) => (
                <div key={i.productId} className="flex items-start justify-between gap-3">
                  <div className="text-sm">
                    <div className="font-medium">{i.name}</div>
                    <div className="text-muted-foreground">Qty {i.quantity}</div>
                  </div>
                  <div className="text-sm font-medium">
                    {i.currency} {(Number(i.unitPrice) * i.quantity).toLocaleString("en-NG")}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-bold">
                {currency} {Number(total).toLocaleString("en-NG")}
              </span>
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link href="/pharmacy/orders">View orders</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
