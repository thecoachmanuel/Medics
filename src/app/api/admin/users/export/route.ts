import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";

export async function GET(req: NextRequest) {
  const supabase = getServiceSupabase();
  const { searchParams } = new URL(req.url);
  const role = (searchParams.get("role") || "all").toLowerCase();
  const q = (searchParams.get("q") || "").trim();

  let query = supabase
    .from("profiles")
    .select("id,name,email,phone,gender,age,dob,blood_group,type,is_blocked,created_at");

  if (role === "doctor" || role === "patient") {
    query = query.eq("type", role);
  }
  if (q) {
    const like = `%${q}%`;
    query = query.or(`name.ilike.${like},email.ilike.${like},phone.ilike.${like}`);
  }

  const { data, error } = await query;
  if (error) {
    return new NextResponse("Failed to export users", { status: 500 });
  }

  const rows = (data || []) as any[];
  const header = [
    "id","name","email","phone","gender","age","dob","blood_group","type","is_blocked","created_at",
  ];
  const csvLines = [header.join(",")];
  for (const r of rows) {
    const line = [
      r.id,
      quote(r.name),
      quote(r.email),
      quote(r.phone),
      quote(r.gender),
      r.age ?? "",
      r.dob ?? "",
      quote(r.blood_group),
      r.type ?? "",
      String(!!r.is_blocked),
      r.created_at,
    ].join(",");
    csvLines.push(line);
  }

  const csv = csvLines.join("\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="users_export_${Date.now()}.csv"`,
    },
  });
}

function quote(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

