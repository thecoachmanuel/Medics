import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.ADMIN_CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();

  const cutoffIso = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("appointments")
    .select("id")
    .eq("status", "In Progress")
    .lte("updated_at", cutoffIso)
    .limit(500);

  if (error) {
    return NextResponse.json(
      { error: "Unable to load in-progress appointments" },
      { status: 500 },
    );
  }

  const ids = (data || []).map((row) => row.id as string);

  if (!ids.length) {
    return NextResponse.json({ updated: 0 });
  }

  const { error: updateError } = await supabase
    .from("appointments")
    .update({ status: "Completed" })
    .in("id", ids);

  if (updateError) {
    return NextResponse.json(
      { error: "Unable to update appointment statuses" },
      { status: 500 },
    );
  }

  return NextResponse.json({ updated: ids.length });
}

