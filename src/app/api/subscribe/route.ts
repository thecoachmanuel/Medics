import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";

function isValidEmail(email: string): boolean {
  return /^(?:[a-zA-Z0-9_\-.+])+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(email);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const email = (body as any).email as string | undefined;
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Please provide a valid email" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email: email.toLowerCase().trim() })
    .single();

  if (error) {
    // Unique violation or existing email should be treated as success to avoid probing
    if (String(error.message).toLowerCase().includes("duplicate") || error.code === "23505") {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Unable to subscribe email" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

