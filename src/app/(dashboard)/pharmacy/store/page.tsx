"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listMyPharmacyStores } from "@/actions/pharmacy-actions";
import { supabase } from "@/lib/supabase/client";

type StoreRow = {
  id: string;
  name: string;
  slug: string;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
};

type StoreMembershipRow = {
  role: string;
  store: StoreRow;
};

export default function PharmacyStoreDashboardIndexPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [stores, setStores] = useState<StoreMembershipRow[]>([]);

  useEffect(() => {
    setError(null);
    startTransition(async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        if (!accessToken) {
          setStores([]);
          setError("Please sign in to manage your pharmacy store.");
          return;
        }
        const rows = (await listMyPharmacyStores({ accessToken })) as unknown;
        const list = Array.isArray(rows) ? rows : [];
        const normalized = list
          .map((r) => {
            const row = r as Record<string, unknown>;
            const storeObj = row.store as Record<string, unknown>;
            return {
              role: String(row.role),
              store: {
                id: String(storeObj.id),
                name: String(storeObj.name),
                slug: String(storeObj.slug),
                is_approved: Boolean(storeObj.is_approved),
                is_active: Boolean(storeObj.is_active),
                created_at: String(storeObj.created_at),
              },
            } satisfies StoreMembershipRow;
          })
          .filter((r) => r.store.id);
        setStores(normalized);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unable to load stores";
        setError(msg);
      }
    });
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pharmacy store dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage products, orders, and sales</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/pharmacy">Storefront</Link>
          </Button>
          <Button asChild disabled={isPending}>
            <Link href="/pharmacy/store/new">Create store</Link>
          </Button>
        </div>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Access required</CardTitle>
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
        {stores.length === 0 && !error ? (
          <Card>
            <CardHeader>
              <CardTitle>No stores yet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Create a pharmacy store to start listing products.
              </div>
              <Button asChild>
                <Link href="/pharmacy/store/new">Create a store</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {stores.map((m) => (
          <Card key={m.store.id}>
            <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{m.store.name}</div>
                  <Badge variant="outline">{m.role}</Badge>
                  {m.store.is_approved ? (
                    <Badge variant="secondary">approved</Badge>
                  ) : (
                    <Badge variant="outline">pending approval</Badge>
                  )}
                  {!m.store.is_active ? <Badge variant="destructive">inactive</Badge> : null}
                </div>
                <div className="text-sm text-muted-foreground">/{m.store.slug}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link href={`/pharmacy/store/${m.store.id}/products`}>Products</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/pharmacy/store/${m.store.id}/orders`}>Orders</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/pharmacy/store/${m.store.id}/sales`}>Sales</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

