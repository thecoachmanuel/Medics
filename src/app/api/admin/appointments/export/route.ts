import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";

export async function GET(req: NextRequest) {
  const supabase = getServiceSupabase();
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const status = (searchParams.get("status") || "all").trim();

  const { data: rows, error } = await supabase
    .from("appointments")
    .select("id,doctor_id,patient_id,date,slot_start_iso,slot_end_iso,consultation_type,status,created_at")
    .order("created_at", { ascending: false });
  if (error) return new NextResponse("Failed to export appointments", { status: 500 });

  const appts = (rows || []) as any[];
  const doctorIds = Array.from(new Set(appts.map((r) => r.doctor_id)));
  const patientIds = Array.from(new Set(appts.map((r) => r.patient_id)));

  const [docRes, patRes] = await Promise.all([
    doctorIds.length ? supabase.from("profiles").select("id,name").in("id", doctorIds) : Promise.resolve({ data: [] } as any),
    patientIds.length ? supabase.from("profiles").select("id,name").in("id", patientIds) : Promise.resolve({ data: [] } as any),
  ]);

  const docMap = new Map<string, string>();
  ((docRes.data || []) as any[]).forEach((d) => docMap.set(d.id, d.name || "Doctor"));
  const patMap = new Map<string, string>();
  ((patRes.data || []) as any[]).forEach((p) => patMap.set(p.id, p.name || "Patient"));

  const filtered = appts.filter((r) => {
    const doctorName = (docMap.get(r.doctor_id) || "").toLowerCase();
    const patientName = (patMap.get(r.patient_id) || "").toLowerCase();
    const matchesQuery = !q || doctorName.includes(q) || patientName.includes(q) || String(r.id).toLowerCase().includes(q);
    const matchesStatus = status === "all" || r.status === status;
    return matchesQuery && matchesStatus;
  });

  const header = ["id","patient","doctor","date","start_iso","end_iso","type","status","created_at"];
  const csvLines = [header.join(",")];
  for (const r of filtered) {
    const line = [
      r.id,
      quote(patMap.get(r.patient_id) || ""),
      quote(docMap.get(r.doctor_id) || ""),
      r.date || "",
      r.slot_start_iso || "",
      r.slot_end_iso || "",
      quote(r.consultation_type || ""),
      quote(r.status || ""),
      r.created_at,
    ].join(",");
    csvLines.push(line);
  }

  const csv = csvLines.join("\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="appointments_export_${Date.now()}.csv"`,
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

