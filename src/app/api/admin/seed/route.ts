import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import { cities, healthcareCategoriesList } from "@/lib/constant";

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

const firstNames = [
  "Aisha","Amina","Halima","Hauwa","Zainab","Maryam","Fatima","Hadiza",
  "Abubakar","Ibrahim","Sani","Suleiman","Yusuf","Usman","Bello","Aminu",
  "Chinedu","Emeka","Ifeoma","Ngozi","Nneka","Kelechi","Uche","Ijeoma","Nnamdi",
  "Femi","Tunde","Segun","Kemi","Funke","Yemi","Taiwo","Kehinde","Damilola","Bukola",
  "Ada","Blessing","Joy","John","Paul","Peter","Michael","Samuel","David"
];

const lastNames = [
  "Okafor","Okoye","Obi","Eze","Nwosu","Nwachukwu","Nwankwo","Chukwuma","Ezeh",
  "Balogun","Abiola","Adeyemi","Adebayo","Ogunleye","Ogunbiyi","Olatunji","Ojo",
  "Mohammed","Bello","Musa","Yusuf","Abdullahi","Aliyu","Danjuma","Lawal","Ibrahim",
  "Udo","Essien","Ekanem","Etim","Akpan","Danladi","Tanko","Yakubu","Sanusi","Adamu",
];

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomNigerianName = (): string => `${pick(firstNames)} ${pick(lastNames)}`;
const randomGender = (): "male" | "female" => (Math.random() < 0.5 ? "male" : "female");
const randomAvatar = (gender: "male" | "female"): string => {
  const idx = 5 + Math.floor(Math.random() * 90);
  return `https://randomuser.me/api/portraits/${gender === "female" ? "women" : "men"}/${idx}.jpg`;
};
const randomQualification = (): string => pick(["MBBS", "MBBS, FWACS", "MBBS, FMCPath", "MBBS, MPH", "MBBS, FMCP", "MBBS, FRCP"]);
const randomCategories = (): string[] => {
  const n = 1 + Math.floor(Math.random() * 2);
  const bag = [...healthcareCategoriesList];
  const selected: string[] = [];
  for (let i = 0; i < n && bag.length; i++) {
    const idx = Math.floor(Math.random() * bag.length);
    selected.push(bag.splice(idx, 1)[0]);
  }
  return selected;
};
const randomAbout = (spec: string, exp: number): string =>
  `Experienced ${spec.toLowerCase()} with ${exp}+ years providing high-quality care to patients across Nigeria. Passionate about preventive medicine, evidence-based treatment and patient education.`;
const randomBloodGroup = (): string => pick(["A+","A-","B+","B-","AB+","O+","O-"]);
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const dobFromAge = (age: number): string => {
  const now = new Date();
  const year = now.getFullYear() - age;
  const month = randomInt(1, 12);
  const day = randomInt(1, 28);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toISOString().slice(0, 10);
};

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
      const name = randomNigerianName();
      const gender = randomGender();
      const avatar = randomAvatar(gender);
      const id = await ensureUser(supabase, email, "111111", "doctor", name);
      doctorIds.push(id);
      const spec = specs[(i - 1) % specs.length];
      const fees = 3000 + Math.floor(Math.random() * 12) * 1000;
      const experience = 2 + Math.floor(Math.random() * 23);
      const qualification = randomQualification();
      const city = pick(cities);
      const hospital = {
        name: `${city} Medical Center`,
        address: `Plot ${randomInt(1, 99)}, ${city} Ring Road`,
        city,
      };
      const category = randomCategories();
      doctorFees.set(id, fees);
      await supabase.from("profiles").update({
        type: "doctor",
        name,
        email,
        specialization: spec,
        qualification,
        experience,
        about: randomAbout(spec, experience),
        hospital_info: hospital as any,
        category,
        gender,
        profile_image: avatar,
        is_verified: true,
        is_active: true,
        fees,
      }).eq("id", id);
    }

    for (let i = 1; i <= 30; i++) {
      const email = `patient${i}@medicsonline.com`;
      const name = randomNigerianName();
      const gender = randomGender();
      const avatar = randomAvatar(gender);
      const age = 18 + Math.floor(Math.random() * 53);
      const dob = dobFromAge(age);
      const blood = randomBloodGroup();
      const id = await ensureUser(supabase, email, "111111", "patient", name);
      patientIds.push(id);
      await supabase.from("profiles").update({
        type: "patient",
        name,
        email,
        gender,
        profile_image: avatar,
        age,
        dob,
        blood_group: blood,
        is_verified: true,
        is_active: true,
      }).eq("id", id);
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
