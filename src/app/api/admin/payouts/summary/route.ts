import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";

export async function GET() {
  try {
    const supabase = getServiceSupabase();
    const { count, error } = await supabase
      .from("doctor_payout_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    if (error) {
      return NextResponse.json({ error: "Unable to load summary" }, { status: 500 });
    }
    return NextResponse.json({ pendingCount: count ?? 0, updatedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

