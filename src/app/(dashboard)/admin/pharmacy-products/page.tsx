import Link from "next/link";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getServiceSupabase } from "@/lib/supabase/service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

type ProductRow = {
  id: number;
  store_id: string;
  name: string;
  sku: string;
  price: number;
  currency: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  pharmacy_stores?: { name?: string | null; slug?: string | null } | null;
};

export default async function AdminPharmacyProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("medics_admin")?.value === "1";
  if (!isAdmin) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/login">Admin login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sp = await searchParams;
  const q = (sp.q || "").trim();

  const supabase = getServiceSupabase();
  let query = supabase
    .from("pharmacy_products")
    .select("id,store_id,name,sku,price,currency,stock_quantity,is_active,created_at, pharmacy_stores(name,slug)")
    .order("created_at", { ascending: false });

  if (q) {
    const like = `%${q}%`;
    query = query.or(`name.ilike.${like},sku.ilike.${like}`);
  }

  const { data, error } = await query;
  const products = ((data || []) as unknown as ProductRow[]).map((p) => ({
    id: Number(p.id),
    store_id: String(p.store_id),
    name: String(p.name),
    sku: String(p.sku || ""),
    price: Number(p.price || 0),
    currency: String(p.currency || "NGN"),
    stock_quantity: Number(p.stock_quantity || 0),
    is_active: Boolean(p.is_active),
    created_at: String(p.created_at),
    pharmacy_stores: p.pharmacy_stores || null,
  }));

  async function toggleActiveAction(formData: FormData) {
    "use server";
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get("medics_admin")?.value === "1";
    if (!isAdmin) return;
    const idRaw = String(formData.get("id") || "");
    const next = String(formData.get("next") || "");
    const id = Number(idRaw);
    if (!Number.isFinite(id) || id <= 0) return;
    const supabase = getServiceSupabase();
    await supabase.from("pharmacy_products").update({ is_active: next === "1" }).eq("id", id);
    revalidatePath("/admin/pharmacy-products");
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pharmacy products</h1>
          <p className="text-sm text-muted-foreground">Manage all pharmacy products</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin">Admin home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/pharmacies">Stores</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2" action="/admin/pharmacy-products" method="get">
            <Input name="q" defaultValue={q} placeholder="Search by product name or SKU" />
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Database error</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{error.message}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {products.length === 0 ? <div className="text-sm text-muted-foreground">No products</div> : null}
          {products.map((p) => (
            <div key={p.id} className="rounded-md border p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold">{p.name}</div>
                  {p.is_active ? <Badge variant="secondary">active</Badge> : <Badge variant="destructive">inactive</Badge>}
                  <Badge variant="outline">SKU {p.sku || "-"}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Store: {p.pharmacy_stores?.name || p.store_id} {p.pharmacy_stores?.slug ? `(/${p.pharmacy_stores.slug})` : ""}
                </div>
                <div className="text-sm text-muted-foreground">
                  {p.currency} {p.price.toLocaleString("en-NG")} · Stock {p.stock_quantity}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={toggleActiveAction}>
                  <input type="hidden" name="id" value={String(p.id)} />
                  <input type="hidden" name="next" value={p.is_active ? "0" : "1"} />
                  <Button variant={p.is_active ? "destructive" : "outline"} type="submit">
                    {p.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

