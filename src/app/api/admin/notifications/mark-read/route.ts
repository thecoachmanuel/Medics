import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { ids?: string[]; all?: boolean };
    const supabase = getServiceSupabase();
    let q = supabase.from("notifications").update({ is_read: true }).eq("role", "admin");
    if (body?.ids && Array.isArray(body.ids) && body.ids.length > 0) {
      q = q.in("id", body.ids);
    } else if (body?.all) {
      q = q.eq("is_read", false);
    } else {
      return NextResponse.json({ error: "Provide ids or all:true" }, { status: 400 });
    }
    const { error } = await q;
    if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

