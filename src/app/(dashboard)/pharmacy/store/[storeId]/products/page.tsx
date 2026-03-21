"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  deletePharmacyProduct,
  listPharmacyStoreProducts,
  upsertPharmacyProduct,
} from "@/actions/pharmacy-actions";
import { supabase } from "@/lib/supabase/client";

type StoreProductRow = {
  id: number;
  store_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  sku: string;
  stock_quantity: number;
  category_id: number | null;
  image_urls: string[];
  is_active: boolean;
  created_at: string;
};

type ProductFormState = {
  productId: number | null;
  name: string;
  sku: string;
  price: string;
  currency: string;
  stockQuantity: string;
  isActive: boolean;
  description: string;
  imageUrls: string;
};

const normalizeProduct = (r: unknown): StoreProductRow => {
  const row = r as Record<string, unknown>;
  return {
    id: Number(row.id),
    store_id: String(row.store_id),
    name: String(row.name),
    description: row.description ? String(row.description) : null,
    price: Number(row.price || 0),
    currency: String(row.currency || "NGN"),
    sku: String(row.sku || ""),
    stock_quantity: Number(row.stock_quantity || 0),
    category_id: row.category_id === null || row.category_id === undefined ? null : Number(row.category_id),
    image_urls: Array.isArray(row.image_urls) ? row.image_urls.map((v) => String(v)) : [],
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
  };
};

export default function PharmacyStoreProductsPage() {
  const params = useParams<{ storeId: string }>();
  const storeId = params?.storeId ? String(params.storeId) : "";

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<StoreProductRow[]>([]);

  const [form, setForm] = useState<ProductFormState>({
    productId: null,
    name: "",
    sku: "",
    price: "",
    currency: "NGN",
    stockQuantity: "0",
    isActive: true,
    description: "",
    imageUrls: "",
  });

  const title = useMemo(() => (form.productId ? `Edit product #${form.productId}` : "Create product"), [form.productId]);

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
          setProducts([]);
          setError("Please sign in to manage products.");
          return;
        }
        const rows = (await listPharmacyStoreProducts({ accessToken, storeId })) as unknown;
        const list = Array.isArray(rows) ? rows : [];
        setProducts(list.map(normalizeProduct));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unable to load products";
        setError(msg);
      }
    });
  };

  useEffect(() => {
    load();
  }, [storeId]);

  const setField = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => {
    setForm((s) => ({ ...s, [key]: value }));
  };

  const resetForm = () => {
    setForm({
      productId: null,
      name: "",
      sku: "",
      price: "",
      currency: "NGN",
      stockQuantity: "0",
      isActive: true,
      description: "",
      imageUrls: "",
    });
  };

  const onSave = () => {
    setError(null);
    startTransition(async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        if (!accessToken) {
          setError("Please sign in to manage products.");
          return;
        }

        const imageUrls = form.imageUrls
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        const price = Number(form.price);
        const stockQuantity = Number(form.stockQuantity);

        await upsertPharmacyProduct({
          accessToken,
          storeId,
          productId: form.productId ?? undefined,
          name: form.name,
          sku: form.sku,
          price,
          currency: form.currency,
          stockQuantity,
          description: form.description.trim() ? form.description : undefined,
          imageUrls,
          isActive: form.isActive,
        });

        resetForm();
        load();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unable to save product";
        setError(msg);
      }
    });
  };

  const onEdit = (p: StoreProductRow) => {
    setForm({
      productId: p.id,
      name: p.name,
      sku: p.sku,
      price: String(p.price),
      currency: p.currency,
      stockQuantity: String(p.stock_quantity),
      isActive: p.is_active,
      description: p.description || "",
      imageUrls: (p.image_urls || []).join(", "),
    });
  };

  const onDelete = (p: StoreProductRow) => {
    if (!window.confirm(`Delete product "${p.name}"?`)) return;
    setError(null);
    startTransition(async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        if (!accessToken) {
          setError("Please sign in to manage products.");
          return;
        }
        await deletePharmacyProduct({ accessToken, storeId, productId: p.id });
        if (form.productId === p.id) resetForm();
        load();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unable to delete product";
        setError(msg);
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">Store ID: {storeId}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/pharmacy/store">Back</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/pharmacy/store/${storeId}/orders`}>Orders</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/pharmacy/store/${storeId}/sales`}>Sales</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setField("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" value={form.sku} onChange={(e) => setField("sku", e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input id="price" value={form.price} onChange={(e) => setField("price", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" value={form.currency} onChange={(e) => setField("currency", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input id="stock" value={form.stockQuantity} onChange={(e) => setField("stockQuantity", e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="images">Image URLs (comma separated)</Label>
            <Input id="images" value={form.imageUrls} onChange={(e) => setField("imageUrls", e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Description (optional)</Label>
            <Textarea id="desc" value={form.description} onChange={(e) => setField("description", e.target.value)} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={onSave} disabled={isPending}>
              Save
            </Button>
            <Button variant="outline" onClick={resetForm} disabled={isPending}>
              Reset
            </Button>
            <Button
              variant={form.isActive ? "outline" : "destructive"}
              onClick={() => setField("isActive", !form.isActive)}
              disabled={isPending}
            >
              {form.isActive ? "Active" : "Inactive"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product list</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {products.length === 0 ? <div className="text-sm text-muted-foreground">No products</div> : null}
          {products.map((p) => (
            <div key={p.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-md border p-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium">{p.name}</div>
                  {!p.is_active ? <Badge variant="destructive">inactive</Badge> : <Badge variant="secondary">active</Badge>}
                </div>
                <div className="text-sm text-muted-foreground">
                  {p.currency} {p.price.toLocaleString("en-NG")} · Stock {p.stock_quantity} · SKU {p.sku}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onEdit(p)} disabled={isPending}>
                  Edit
                </Button>
                <Button variant="destructive" onClick={() => onDelete(p)} disabled={isPending}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

