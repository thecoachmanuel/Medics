"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPharmacyOrderDetails } from "@/actions/pharmacy-actions";
import { supabase } from "@/lib/supabase/client";

type OrderItemRow = {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  currency: string;
  pharmacy_products?: { name?: string | null } | null;
};

type OrderDetails = {
  id: number;
  store_id: string;
  status: string;
  payment_status: string;
  delivery_status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  shipping_address: Record<string, unknown> | null;
  delivery_provider?: string | null;
  tracking_number?: string | null;
  pharmacy_order_items?: OrderItemRow[] | null;
};

export default function PharmacyOrderDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDetails | null>(null);

  const orderId = useMemo(() => {
    const raw = params?.id;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
  }, [params]);

  useEffect(() => {
    setError(null);
    setOrder(null);

    if (!orderId) {
      setError("Invalid order id");
      return;
    }

    startTransition(async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        if (!accessToken) {
          setError("Please sign in to view this order.");
          return;
        }
        const details = (await getPharmacyOrderDetails({ accessToken, orderId })) as unknown;
        const row = details as Record<string, unknown>;
        setOrder({
          id: Number(row.id),
          store_id: String(row.store_id),
          status: String(row.status),
          payment_status: String(row.payment_status),
          delivery_status: String(row.delivery_status),
          total_amount: Number(row.total_amount || 0),
          currency: String(row.currency || "NGN"),
          created_at: String(row.created_at),
          shipping_address:
            row.shipping_address && typeof row.shipping_address === "object"
              ? (row.shipping_address as Record<string, unknown>)
              : null,
          delivery_provider: row.delivery_provider ? String(row.delivery_provider) : null,
          tracking_number: row.tracking_number ? String(row.tracking_number) : null,
          pharmacy_order_items: Array.isArray(row.pharmacy_order_items)
            ? (row.pharmacy_order_items as unknown as OrderItemRow[])
            : [],
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unable to load order";
        setError(msg);
      }
    });
  }, [orderId]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Order details</h1>
          {order ? (
            <p className="text-sm text-muted-foreground">Order #{order.id}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/pharmacy/orders">Back to orders</Link>
          </Button>
          <Button variant="outline" onClick={() => router.refresh()} disabled={isPending}>
            Refresh
          </Button>
        </div>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">{error}</div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/login/patient">Patient login</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/login/doctor">Doctor login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {order ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(order.pharmacy_order_items || []).length === 0 ? (
                <div className="text-sm text-muted-foreground">No items</div>
              ) : null}
              {(order.pharmacy_order_items || []).map((i) => (
                <div key={i.id} className="flex items-start justify-between gap-3">
                  <div className="text-sm">
                    <div className="font-medium">{i.pharmacy_products?.name || `Product #${i.product_id}`}</div>
                    <div className="text-muted-foreground">Qty {i.quantity}</div>
                  </div>
                  <div className="text-sm font-medium">
                    {i.currency} {(Number(i.unit_price) * i.quantity).toLocaleString("en-NG")}
                  </div>
                </div>
              ))}
              <div className="border-t pt-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-lg font-bold">
                  {order.currency} {order.total_amount.toLocaleString("en-NG")}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{order.status}</Badge>
                <Badge variant="secondary">{order.payment_status}</Badge>
                <Badge variant="outline">{order.delivery_status}</Badge>
              </div>

              <div className="text-sm text-muted-foreground">
                Placed on {new Date(order.created_at).toLocaleString()}
              </div>

              {order.delivery_provider || order.tracking_number ? (
                <div className="space-y-1 text-sm">
                  {order.delivery_provider ? (
                    <div>
                      <span className="text-muted-foreground">Carrier:</span> {order.delivery_provider}
                    </div>
                  ) : null}
                  {order.tracking_number ? (
                    <div>
                      <span className="text-muted-foreground">Tracking:</span> {order.tracking_number}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="border-t pt-4 space-y-2">
                <div className="font-medium">Shipping address</div>
                {order.shipping_address ? (
                  <pre className="text-xs rounded-md border bg-muted/30 p-3 overflow-auto">
                    {JSON.stringify(order.shipping_address, null, 2)}
                  </pre>
                ) : (
                  <div className="text-sm text-muted-foreground">Not provided</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

