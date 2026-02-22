import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
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
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("doctor_taxonomies")
    .select("id,config")
    .limit(1)
    .maybeSingle<DoctorTaxonomiesRow>();

  if (error || !data?.config) {
    return NextResponse.json({ config: defaultConfig });
  }

  const config = data.config;

  return NextResponse.json({
    config: {
      specializations: Array.isArray(config.specializations) && config.specializations.length
        ? config.specializations
        : defaultConfig.specializations,
      categories: Array.isArray(config.categories) && config.categories.length
        ? config.categories
        : defaultConfig.categories,
    },
  });
}

