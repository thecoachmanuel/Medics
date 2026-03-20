"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPharmacyOrders } from "@/actions/pharmacy-actions";
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
};

export default function OrdersClient() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  const page = useMemo(() => {
    const p = Number(searchParams.get("page") || "1");
    return Number.isFinite(p) && p > 0 ? Math.floor(p) : 1;
  }, [searchParams]);

  const limit = 10;

  useEffect(() => {
    setError(null);

    startTransition(async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        if (!accessToken) {
          setOrders([]);
          setError("Please sign in to view your orders.");
          return;
        }

        const rows = (await getPharmacyOrders({ accessToken, page, limit })) as unknown;
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
          } satisfies OrderRow;
        });
        setOrders(normalized);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unable to load orders";
        setError(msg);
      }
    });
  }, [page]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-muted-foreground">Your pharmacy purchases</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/pharmacy">Shop pharmacy</Link>
        </Button>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load orders</CardTitle>
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

      <div className="space-y-4">
        {orders.length === 0 && !error ? (
          <Card>
            <CardHeader>
              <CardTitle>No orders yet</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/pharmacy">Browse products</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {orders.map((o) => (
          <Card key={o.id}>
            <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">Order #{o.id}</div>
                  <Badge variant="outline">{o.status}</Badge>
                  <Badge variant="secondary">{o.payment_status}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(o.created_at).toLocaleString()}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 sm:justify-end sm:w-[320px]">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Total</div>
                  <div className="font-bold">
                    {o.currency} {o.total_amount.toLocaleString("en-NG")}
                  </div>
                </div>
                <Button asChild disabled={isPending}>
                  <Link href={`/pharmacy/orders/${o.id}`}>View</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button asChild variant="outline" disabled={page <= 1}>
          <Link href={`/pharmacy/orders?page=${Math.max(1, page - 1)}`}>Previous</Link>
        </Button>
        <div className="text-sm text-muted-foreground">Page {page}</div>
        <Button asChild variant="outline" disabled={orders.length < limit}>
          <Link href={`/pharmacy/orders?page=${page + 1}`}>Next</Link>
        </Button>
      </div>
    </div>
  );
}

