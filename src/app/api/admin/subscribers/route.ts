import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";

export async function GET() {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("id,email,created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ subscribers: [] });
  }

  return NextResponse.json({ subscribers: data ?? [] });
}

