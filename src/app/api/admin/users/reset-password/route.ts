import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import crypto from "crypto";

function generatePassword(length = 14): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=";
  const bytes = crypto.randomBytes(length);
  let pwd = "";
  for (let i = 0; i < length; i += 1) {
    pwd += chars[bytes[i] % chars.length];
  }
  return pwd;
}

export async function POST(req: NextRequest) {
  const adminFlag = req.cookies.get("medics_admin")?.value;
  if (adminFlag !== "1") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null as any);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  }

  const password = generatePassword(16);
  const supabase = getServiceSupabase();
  const { error } = await (supabase as any).auth.admin.updateUserById(id, { password });
  if (error) {
    return NextResponse.json({ error: "Unable to reset password" }, { status: 500 });
  }
  return NextResponse.json({ success: true, password });
}

