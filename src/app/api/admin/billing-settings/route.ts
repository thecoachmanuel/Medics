import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";

type BillingSettings = {
  platformFeePercent: number; // charged on top of consultation fee to patient
  adminCommissionPercent: number; // deducted from doctor earnings
  maxWithdrawalPercent: number; // max percentage of available balance that can be withdrawn
};

type BillingRow = {
  id: string;
  config: BillingSettings | null;
};

const DEFAULTS: BillingSettings = {
  platformFeePercent: 0,
  adminCommissionPercent: 20,
  maxWithdrawalPercent: 85,
};

export async function GET() {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("billing_settings")
    .select("id,config")
    .limit(1)
    .maybeSingle<BillingRow>();

  if (error || !data?.config) {
    return NextResponse.json({ config: DEFAULTS });
  }
  const cfg = data.config;
  const platform = Number(cfg.platformFeePercent);
  const commission = Number(cfg.adminCommissionPercent);
  const withdrawal = Number(cfg.maxWithdrawalPercent);
  const sanitized: BillingSettings = {
    platformFeePercent: Number.isFinite(platform) && platform >= 0 && platform <= 100 ? platform : DEFAULTS.platformFeePercent,
    adminCommissionPercent: Number.isFinite(commission) && commission >= 0 && commission <= 100 ? commission : DEFAULTS.adminCommissionPercent,
    maxWithdrawalPercent: Number.isFinite(withdrawal) && withdrawal >= 0 && withdrawal <= 100 ? withdrawal : DEFAULTS.maxWithdrawalPercent,
  };
  return NextResponse.json({ config: sanitized });
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
  const b = body as Partial<BillingSettings>;
  const platform = Math.max(0, Math.min(100, Number(b.platformFeePercent ?? DEFAULTS.platformFeePercent)));
  const commission = Math.max(0, Math.min(100, Number(b.adminCommissionPercent ?? DEFAULTS.adminCommissionPercent)));
  const withdrawal = Math.max(0, Math.min(100, Number(b.maxWithdrawalPercent ?? DEFAULTS.maxWithdrawalPercent)));

  const config: BillingSettings = { 
    platformFeePercent: platform, 
    adminCommissionPercent: commission,
    maxWithdrawalPercent: withdrawal 
  };

  const { data: existing, error: loadError } = await supabase
    .from("billing_settings")
    .select("id")
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (loadError) {
    console.error("Error loading billing settings:", loadError);
    return NextResponse.json({ error: "Unable to load billing settings" }, { status: 500 });
  }

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("billing_settings")
      .update({ config })
      .eq("id", existing.id);
    if (updateError) {
      console.error("Error updating billing settings:", updateError);
      return NextResponse.json({ error: "Unable to update billing settings" }, { status: 500 });
    }
  } else {
    const { error: insertError } = await supabase
      .from("billing_settings")
      .insert({ config });
    if (insertError) {
      console.error("Error inserting billing settings:", insertError);
      return NextResponse.json({ error: "Unable to save billing settings" }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, config });
}

