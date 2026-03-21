"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPharmacyStore } from "@/actions/pharmacy-actions";
import { supabase } from "@/lib/supabase/client";

export default function CreatePharmacyStorePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("Nigeria");

  const onSubmit = () => {
    setError(null);
    startTransition(async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        if (!accessToken) {
          setError("Please sign in to create a store.");
          return;
        }

        const res = await createPharmacyStore({
          accessToken,
          name,
          slug: slug.trim() ? slug.trim() : undefined,
          description: description.trim() ? description.trim() : undefined,
          contactPhone: contactPhone.trim() ? contactPhone.trim() : undefined,
          address: {
            street: street.trim() ? street.trim() : undefined,
            city: city.trim() ? city.trim() : undefined,
            state: state.trim() ? state.trim() : undefined,
            country: country.trim() ? country.trim() : undefined,
          },
        });

        const created = res as Record<string, unknown>;
        const storeId = String(created.id || "");
        if (storeId) {
          router.replace(`/pharmacy/store/${storeId}/products`);
          return;
        }
        router.replace("/pharmacy/store");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unable to create store";
        setError(msg);
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Create pharmacy store</h1>
          <p className="text-sm text-muted-foreground">Stores require admin approval before going live</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/pharmacy/store">Back</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Store details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="name">Store name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Store slug (optional)</Label>
            <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="example-pharmacy" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">Contact phone (optional)</Label>
            <Input id="contactPhone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="street">Street (optional)</Label>
              <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City (optional)</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="state">State (optional)</Label>
              <Input id="state" value={state} onChange={(e) => setState(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <Button onClick={onSubmit} disabled={isPending}>
              Create store
            </Button>
            <Button asChild variant="outline" disabled={isPending}>
              <Link href="/pharmacy/store">Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

