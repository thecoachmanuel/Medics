import Link from "next/link";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getServiceSupabase } from "@/lib/supabase/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

type StoreRow = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
};

export default async function AdminPharmaciesPage({
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
    .from("pharmacy_stores")
    .select("id,owner_id,name,slug,is_active,is_approved,created_at")
    .order("created_at", { ascending: false });
  if (q) {
    const like = `%${q}%`;
    query = query.or(`name.ilike.${like},slug.ilike.${like}`);
  }
  const { data, error } = await query;
  const stores = ((data || []) as unknown as StoreRow[]).map((s) => ({
    id: String(s.id),
    owner_id: String(s.owner_id),
    name: String(s.name),
    slug: String(s.slug),
    is_active: Boolean(s.is_active),
    is_approved: Boolean(s.is_approved),
    created_at: String(s.created_at),
  }));

  async function toggleApprovalAction(formData: FormData) {
    "use server";
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get("medics_admin")?.value === "1";
    if (!isAdmin) return;
    const id = String(formData.get("id") || "");
    const next = String(formData.get("next") || "");
    if (!id) return;
    const supabase = getServiceSupabase();
    await supabase.from("pharmacy_stores").update({ is_approved: next === "1" }).eq("id", id);
    revalidatePath("/admin/pharmacies");
  }

  async function toggleActiveAction(formData: FormData) {
    "use server";
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get("medics_admin")?.value === "1";
    if (!isAdmin) return;
    const id = String(formData.get("id") || "");
    const next = String(formData.get("next") || "");
    if (!id) return;
    const supabase = getServiceSupabase();
    await supabase.from("pharmacy_stores").update({ is_active: next === "1" }).eq("id", id);
    revalidatePath("/admin/pharmacies");
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pharmacy stores</h1>
          <p className="text-sm text-muted-foreground">Approve and manage all pharmacy stores</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin">Admin home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/pharmacy-products">Products</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2" action="/admin/pharmacies" method="get">
            <Input name="q" defaultValue={q} placeholder="Search by name or slug" />
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
          <CardTitle>Stores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stores.length === 0 ? <div className="text-sm text-muted-foreground">No stores</div> : null}
          {stores.map((s) => (
            <div key={s.id} className="rounded-md border p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold">{s.name}</div>
                  {s.is_approved ? <Badge variant="secondary">approved</Badge> : <Badge variant="outline">pending</Badge>}
                  {!s.is_active ? <Badge variant="destructive">inactive</Badge> : null}
                </div>
                <div className="text-sm text-muted-foreground">/{s.slug}</div>
                <div className="text-xs text-muted-foreground">Owner: {s.owner_id}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={toggleApprovalAction}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="next" value={s.is_approved ? "0" : "1"} />
                  <Button variant="outline" type="submit">
                    {s.is_approved ? "Unapprove" : "Approve"}
                  </Button>
                </form>
                <form action={toggleActiveAction}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="next" value={s.is_active ? "0" : "1"} />
                  <Button variant={s.is_active ? "destructive" : "outline"} type="submit">
                    {s.is_active ? "Deactivate" : "Activate"}
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

