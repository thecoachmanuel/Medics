import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import { healthcareCategoriesList, specializations as defaultSpecializations } from "@/lib/constant";

type DoctorTaxonomiesConfig = {
  specializations: string[];
  categories: string[];
};

type DoctorTaxonomiesRow = {
  id: string;
  config: DoctorTaxonomiesConfig | null;
};

const defaultConfig: DoctorTaxonomiesConfig = {
  specializations: defaultSpecializations,
  categories: healthcareCategoriesList,
};

export async function GET() {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("doctor_taxonomies")
    .select("id,config")
    .limit(1)
    .maybeSingle<DoctorTaxonomiesRow>();

  if (error || !data?.config) {
    return NextResponse.json({ config: defaultConfig });
  }

  return NextResponse.json({ config: data.config });
}

export async function POST(req: NextRequest) {
  const supabase = getServiceSupabase();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const payload = body as Partial<DoctorTaxonomiesConfig>;

  const specializations = Array.isArray(payload.specializations)
    ? payload.specializations.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : [];

  const categories = Array.isArray(payload.categories)
    ? payload.categories.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : [];

  if (!specializations.length && !categories.length) {
    return NextResponse.json({ error: "At least one specialization or category is required" }, { status: 400 });
  }

  const config: DoctorTaxonomiesConfig = {
    specializations: specializations.length ? specializations : defaultConfig.specializations,
    categories: categories.length ? categories : defaultConfig.categories,
  };

  const { data: existing, error: loadError } = await supabase
    .from("doctor_taxonomies")
    .select("id")
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (loadError) {
    return NextResponse.json({ error: "Unable to load doctor taxonomies" }, { status: 500 });
  }

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("doctor_taxonomies")
      .update({ config })
      .eq("id", existing.id);

    if (updateError) {
      return NextResponse.json({ error: "Unable to update doctor taxonomies" }, { status: 500 });
    }
  } else {
    const { error: insertError } = await supabase
      .from("doctor_taxonomies")
      .insert({ config });

    if (insertError) {
      return NextResponse.json({ error: "Unable to save doctor taxonomies" }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}

