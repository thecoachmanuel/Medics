"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState, useTransition } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPharmacyOrders, updatePharmacyOrder } from "@/actions/pharmacy-actions";
import { supabase } from "@/lib/supabase/client";

type OrderRow = {
  id: number;
  store_id: string;
  status: string;
  payment_status: string;
  delivery_status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  delivery_provider?: string | null;
  tracking_number?: string | null;
};

type OrderPatch = {
  status: string;
  paymentStatus: string;
  deliveryStatus: string;
  deliveryProvider: string;
  trackingNumber: string;
};

const orderStatusOptions = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;
const paymentStatusOptions = ["unpaid", "pending", "paid", "refunded", "failed"] as const;
const deliveryStatusOptions = ["not_shipped", "in_transit", "delivered", "returned", "cancelled"] as const;

const isOneOf = <T extends readonly string[]>(options: T, value: string): value is T[number] => {
  return (options as readonly string[]).includes(value);
};

export default function PharmacyStoreOrdersPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto p-6">Loading orders…</div>}>
      <PharmacyStoreOrdersInner />
    </Suspense>
  );
}

function PharmacyStoreOrdersInner() {
  const params = useParams<{ storeId: string }>();
  const storeId = params?.storeId ? String(params.storeId) : "";
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [patches, setPatches] = useState<Record<number, OrderPatch>>({});

  const page = useMemo(() => {
    const p = Number(searchParams.get("page") || "1");
    return Number.isFinite(p) && p > 0 ? Math.floor(p) : 1;
  }, [searchParams]);

  const limit = 10;

  const load = () => {
    setError(null);
    startTransition(async () => {
      try {
        if (!storeId) {
          setError("Invalid store id");
          return;
        }
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        if (!accessToken) {
          setOrders([]);
          setError("Please sign in to manage orders.");
          return;
        }
        const rows = (await getPharmacyOrders({ accessToken, storeId, page, limit })) as unknown;
        const list = Array.isArray(rows) ? rows : [];
        const normalized = list.map((r) => {
          const row = r as Record<string, unknown>;
          return {
            id: Number(row.id),
            store_id: String(row.store_id),
            status: String(row.status),
            payment_status: String(row.payment_status),
            delivery_status: String(row.delivery_status),
            total_amount: Number(row.total_amount || 0),
            currency: String(row.currency || "NGN"),
            created_at: String(row.created_at),
            delivery_provider: row.delivery_provider ? String(row.delivery_provider) : null,
            tracking_number: row.tracking_number ? String(row.tracking_number) : null,
          } satisfies OrderRow;
        });
        setOrders(normalized);
        setPatches((prev) => {
          const next = { ...prev };
          for (const o of normalized) {
            if (!next[o.id]) {
              next[o.id] = {
                status: o.status,
                paymentStatus: o.payment_status,
                deliveryStatus: o.delivery_status,
                deliveryProvider: o.delivery_provider || "",
                trackingNumber: o.tracking_number || "",
              };
            }
          }
          return next;
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unable to load orders";
        setError(msg);
      }
    });
  };

  useEffect(() => {
    load();
  }, [storeId, page]);

  const setPatch = (orderId: number, patch: Partial<OrderPatch>) => {
    setPatches((s) => ({
      ...s,
      [orderId]: { ...s[orderId], ...patch } as OrderPatch,
    }));
  };

  const onSave = (orderId: number) => {
    const patch = patches[orderId];
    if (!patch) return;
    setError(null);
    startTransition(async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        if (!accessToken) {
          setError("Please sign in to manage orders.");
          return;
        }
        const status = isOneOf(orderStatusOptions, patch.status) ? patch.status : undefined;
        const paymentStatus = isOneOf(paymentStatusOptions, patch.paymentStatus) ? patch.paymentStatus : undefined;
        const deliveryStatus = isOneOf(deliveryStatusOptions, patch.deliveryStatus) ? patch.deliveryStatus : undefined;

        await updatePharmacyOrder({
          accessToken,
          storeId,
          orderId,
          status,
          paymentStatus,
          deliveryStatus,
          deliveryProvider: patch.deliveryProvider.trim() ? patch.deliveryProvider : undefined,
          trackingNumber: patch.trackingNumber.trim() ? patch.trackingNumber : undefined,
        });
        load();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unable to update order";
        setError(msg);
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-muted-foreground">Store ID: {storeId}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/pharmacy/store">Back</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/pharmacy/store/${storeId}/products`}>Products</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/pharmacy/store/${storeId}/sales`}>Sales</Link>
          </Button>
        </div>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Action required</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{error}</CardContent>
        </Card>
      ) : null}

      <div className="space-y-4">
        {orders.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No orders</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Orders will appear here once customers checkout.</CardContent>
          </Card>
        ) : null}

        {orders.map((o) => {
          const patch = patches[o.id];
          return (
            <Card key={o.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>Order #{o.id}</span>
                    <Badge variant="outline">{o.status}</Badge>
                    <Badge variant="secondary">{o.payment_status}</Badge>
                    <Badge variant="outline">{o.delivery_status}</Badge>
                  </div>
                  <div className="text-sm font-bold">
                    {o.currency} {o.total_amount.toLocaleString("en-NG")}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select
                      className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                      value={patch?.status || o.status}
                      onChange={(e) => setPatch(o.id, { status: e.target.value })}
                    >
                      {orderStatusOptions.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment</Label>
                    <select
                      className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                      value={patch?.paymentStatus || o.payment_status}
                      onChange={(e) => setPatch(o.id, { paymentStatus: e.target.value })}
                    >
                      {paymentStatusOptions.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Delivery</Label>
                    <select
                      className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                      value={patch?.deliveryStatus || o.delivery_status}
                      onChange={(e) => setPatch(o.id, { deliveryStatus: e.target.value })}
                    >
                      {deliveryStatusOptions.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Carrier (optional)</Label>
                    <Input
                      value={patch?.deliveryProvider || ""}
                      onChange={(e) => setPatch(o.id, { deliveryProvider: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tracking number (optional)</Label>
                    <Input
                      value={patch?.trackingNumber || ""}
                      onChange={(e) => setPatch(o.id, { trackingNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Button onClick={() => onSave(o.id)} disabled={isPending}>
                    Save update
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/pharmacy/orders/${o.id}`}>Customer view</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <Button asChild variant="outline" disabled={page <= 1}>
          <Link href={`/pharmacy/store/${storeId}/orders?page=${Math.max(1, page - 1)}`}>Previous</Link>
        </Button>
        <div className="text-sm text-muted-foreground">Page {page}</div>
        <Button asChild variant="outline" disabled={orders.length < limit}>
          <Link href={`/pharmacy/store/${storeId}/orders?page=${page + 1}`}>Next</Link>
        </Button>
      </div>
    </div>
  );
}
