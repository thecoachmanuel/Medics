import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    
    // Get token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ credentials: [] });
    }
    const token = authHeader.replace('Bearer ', '');
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user?.id) return NextResponse.json({ credentials: [] });
    const { data, error } = await supabase
      .from("doctor_credentials")
      .select("id,url,label,created_at")
      .eq("doctor_id", user.id)
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ credentials: [] });
    return NextResponse.json({ credentials: data ?? [] });
  } catch {
    return NextResponse.json({ credentials: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    
    // Get token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    
    if (authError || !user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as { url?: string; label?: string };
    const url = String(body?.url || "").trim();
    const label = body?.label ? String(body.label).slice(0, 120) : null;
    if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

    const { error } = await supabase
      .from("doctor_credentials")
      .insert({ doctor_id: user.id, url, label });
    if (error) return NextResponse.json({ error: "Unable to save credential" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

