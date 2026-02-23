import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";

const specs = [
  "Cardiology",
  "Dermatology",
  "Pediatrics",
  "Neurology",
  "Orthopedics",
  "Psychiatry",
  "ENT",
  "Ophthalmology",
  "Gynecology",
  "General Practice",
  "Endocrinology",
  "Gastroenterology",
  "Nephrology",
  "Oncology",
  "Rheumatology",
];

async function ensureUser(supabase: any, email: string, password: string, type: "doctor" | "patient", name: string) {
  const { data: existing } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
  if (existing?.id) return existing.id as string;
  const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { type, name } });
  const id = created?.data?.user?.id as string | undefined;
  if (!id) {
    const { data: check } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
    if (check?.id) return check.id as string;
    throw new Error("Failed to create user: " + email);
  }
  return id;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const run = url.searchParams.get("run");
    if (!run) return NextResponse.json({ error: "Missing run flag" }, { status: 400 });
    const supabase = getServiceSupabase();

    const doctorIds: string[] = [];
    const patientIds: string[] = [];
    const doctorFees = new Map<string, number>();

    for (let i = 1; i <= 20; i++) {
      const email = `doctor${i}@medicsonline.com`;
      const name = `Doctor ${i}`;
      const id = await ensureUser(supabase, email, "111111", "doctor", name);
      doctorIds.push(id);
      const spec = specs[(i - 1) % specs.length];
      const fees = 3000 + Math.floor(Math.random() * 12) * 1000;
      doctorFees.set(id, fees);
      await supabase.from("profiles").update({
        type: "doctor",
        name,
        email,
        specialization: spec,
        is_verified: true,
        is_active: true,
        fees,
      }).eq("id", id);
    }

    for (let i = 1; i <= 30; i++) {
      const email = `patient${i}@medicsonline.com`;
      const name = `Patient ${i}`;
      const id = await ensureUser(supabase, email, "111111", "patient", name);
      patientIds.push(id);
      await supabase.from("profiles").update({ type: "patient", name, email, is_verified: true, is_active: true }).eq("id", id);
    }

    const appts: any[] = [];
    const payments: any[] = [];
    const now = Date.now();
    for (const pid of patientIds) {
      const count = 2 + Math.floor(Math.random() * 3);
      for (let k = 0; k < count; k++) {
        const did = doctorIds[Math.floor(Math.random() * doctorIds.length)];
        const daysOffset = Math.floor(Math.random() * 30) - 15;
        const start = new Date(now + daysOffset * 86400000 + Math.floor(Math.random() * 6) * 3600000);
        const end = new Date(start.getTime() + 30 * 60000);
        const inPast = start.getTime() < now - 3600000;
        const status = inPast ? (Math.random() < 0.7 ? "Completed" : "Cancelled") : "Scheduled";
        const fees = doctorFees.get(did) || 5000;
        appts.push({
          doctor_id: did,
          patient_id: pid,
          date: start.toISOString().slice(0, 10),
          slot_start_iso: start.toISOString(),
          slot_end_iso: end.toISOString(),
          consultation_type: "Video Consultation",
          status,
          symptoms: "",
          fees,
        });
      }
    }

    if (appts.length) {
      const { data: inserted } = await supabase.from("appointments").insert(appts).select("id,doctor_id,patient_id,fees,status");
      const rows = (inserted || []) as { id: string; doctor_id: string; patient_id: string; fees: number; status: string }[];
      for (const r of rows) {
        if (r.status === "Completed") {
          payments.push({ appointment_id: r.id, doctor_id: r.doctor_id, patient_id: r.patient_id, amount: r.fees, currency: "NGN", status: "success", provider: "paystack", reference: null, raw: null });
        }
      }
    }

    if (payments.length) {
      await supabase.from("payments").insert(payments);
    }

    return NextResponse.json({ ok: true, doctors: doctorIds.length, patients: patientIds.length, appointments: appts.length, payments: payments.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "seed failed" }, { status: 500 });
  }
}

