"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPharmacyStoreSalesDaily } from "@/actions/pharmacy-actions";
import { supabase } from "@/lib/supabase/client";

type SalesRow = {
  store_id: string;
  day: string;
  orders_count: number;
  gross_sales: number;
};

export default function PharmacyStoreSalesPage() {
  const params = useParams<{ storeId: string }>();
  const storeId = params?.storeId ? String(params.storeId) : "";
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<SalesRow[]>([]);
  const [fromDay, setFromDay] = useState<string>("");
  const [toDay, setToDay] = useState<string>("");

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
          setRows([]);
          setError("Please sign in to view sales.");
          return;
        }
        const dataRows = (await getPharmacyStoreSalesDaily({
          accessToken,
          storeId,
          fromDay: fromDay.trim() ? fromDay.trim() : undefined,
          toDay: toDay.trim() ? toDay.trim() : undefined,
        })) as unknown;
        const list = Array.isArray(dataRows) ? dataRows : [];
        const normalized = list.map((r) => {
          const row = r as Record<string, unknown>;
          return {
            store_id: String(row.store_id),
            day: String(row.day),
            orders_count: Number(row.orders_count || 0),
            gross_sales: Number(row.gross_sales || 0),
          } satisfies SalesRow;
        });
        setRows(normalized);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unable to load sales";
        setError(msg);
      }
    });
  };

  useEffect(() => {
    load();
  }, [storeId]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Sales</h1>
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
            <Link href={`/pharmacy/store/${storeId}/orders`}>Orders</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="fromDay">From (YYYY-MM-DD)</Label>
            <Input id="fromDay" value={fromDay} onChange={(e) => setFromDay(e.target.value)} placeholder="2026-01-01" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="toDay">To (YYYY-MM-DD)</Label>
            <Input id="toDay" value={toDay} onChange={(e) => setToDay(e.target.value)} placeholder="2026-12-31" />
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={load} disabled={isPending}>
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Action required</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{error}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Daily sales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {rows.length === 0 ? <div className="text-sm text-muted-foreground">No data</div> : null}
          {rows.map((r) => (
            <div key={r.day} className="flex items-center justify-between rounded-md border p-3">
              <div className="text-sm font-medium">{r.day}</div>
              <div className="text-sm text-muted-foreground">Orders {r.orders_count}</div>
              <div className="text-sm font-bold">NGN {r.gross_sales.toLocaleString("en-NG")}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

