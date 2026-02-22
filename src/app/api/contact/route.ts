import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null as any);
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!fullName || !email || !message) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { error } = await supabase.from("contact_messages").insert({
    full_name: fullName,
    email,
    subject: subject || null,
    message,
  });

  if (error) {
    return NextResponse.json({ error: "Unable to submit message." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

