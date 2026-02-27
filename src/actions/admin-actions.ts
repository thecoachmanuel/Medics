"use server";
import { cookies } from "next/headers";
import { getServiceSupabase } from "@/lib/supabase/service";

interface AdminLoginResult {
  success: boolean;
  error?: string;
}

export async function loginAdmin(email: string, password: string): Promise<AdminLoginResult> {
  const adminEmail = process.env.NEXT_ADMIN_EMAIL;
  const adminPassword = process.env.NEXT_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return { success: false, error: "Admin credentials are not configured." };
  }

  if (email !== adminEmail || password !== adminPassword) {
    return { success: false, error: "Invalid admin credentials." };
  }

  const cookieStore = await cookies();
  cookieStore.set("medics_admin", "1", {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 4,
  });

  return { success: true };
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("medics_admin", "", {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

type AnnouncementAudience = "all" | "doctors" | "patients" | "user";

interface CreateAnnouncementInput {
  title: string;
  message: string;
  audience: AnnouncementAudience;
  targetUserId?: string;
}

export async function createAnnouncement(input: CreateAnnouncementInput): Promise<{ success: boolean; error?: string }> {
  const title = input.title.trim();
  const message = input.message.trim();
  if (!title || !message) {
    return { success: false, error: "Title and message are required." };
  }
  const supabase = getServiceSupabase();
  const { error } = await supabase.from("announcements").insert({
    title,
    message,
    audience: input.audience,
    target_user_id: input.audience === "user" ? input.targetUserId || null : null,
  });
  if (error) {
    return { success: false, error: "Unable to create announcement." };
  }

  let profileQuery = supabase.from("profiles").select("id,type");
  if (input.audience === "doctors") {
    profileQuery = profileQuery.eq("type", "doctor");
  } else if (input.audience === "patients") {
    profileQuery = profileQuery.eq("type", "patient");
  } else if (input.audience === "user" && input.targetUserId) {
    profileQuery = profileQuery.eq("id", input.targetUserId);
  }

  const { data: profiles } = await profileQuery;
  const rows = (profiles || []) as { id: string; type: string }[];
  if (rows.length > 0) {
    const notifications = rows.map((p) => ({
      user_id: p.id,
      role: p.type,
      title,
      message,
    }));
    await supabase.from("notifications").insert(notifications);
  }
  return { success: true };
}

export type DoctorAdminAction = "approve" | "suspend" | "unsuspend" | "decline";

export async function updateDoctorAdminStatus(
  doctorId: string,
  action: DoctorAdminAction,
  note?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getServiceSupabase();
  let patch: Record<string, unknown> = {};

  if (action === "approve") {
    patch = { is_verified: true, is_suspended: false, is_declined: false };
  } else if (action === "suspend") {
    patch = { is_suspended: true, is_declined: false };
  } else if (action === "unsuspend") {
    patch = { is_suspended: false };
  } else if (action === "decline") {
    patch = { is_verified: false, is_suspended: false, is_declined: true };
  }

  if (note !== undefined) {
    patch.admin_review_note = note || null;
  }

  const { error } = await supabase.from("profiles").update(patch).eq("id", doctorId);
  if (error) {
    return { success: false, error: "Unable to update doctor status." };
  }
  let title: string | null = null;
  let message: string | null = null;

  if (action === "approve") {
    title = "Your profile has been approved";
    message = "Your MedicsOnline doctor profile has been approved by the admin team.";
  } else if (action === "suspend") {
    title = "Your account has been suspended";
    message = "Your doctor account has been suspended. Please contact support if you believe this is a mistake.";
  } else if (action === "unsuspend") {
    title = "Your account has been reactivated";
    message = "Your doctor account has been reactivated. You can now receive new bookings again.";
  } else if (action === "decline") {
    title = "Your profile has been declined";
    message = "Your MedicsOnline doctor profile has been declined. Please review the admin note and update your details.";
  }

  if (title && message) {
    const finalMessage = note
      ? `${message} Admin note: ${note}`
      : message;
    await supabase.from("notifications").insert({
      user_id: doctorId,
      role: "doctor",
      title,
      message: finalMessage,
    });
  }

  return { success: true };
}

type PayoutStatusValue = "pending" | "approved" | "rejected" | "paid";

export async function updatePayoutStatus(id: string, status: PayoutStatusValue): Promise<{ success: boolean; error?: string }> {
  const supabase = getServiceSupabase();
  const { data: current, error: fetchError } = await supabase
    .from("doctor_payout_requests")
    .select("id,doctor_id,amount,status")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !current) {
    return { success: false, error: "Payout request not found." };
  }

  const previousStatus = String(current.status || "pending") as PayoutStatusValue;

  if (previousStatus === status) {
    return { success: true };
  }

  const { error: updateError } = await supabase
    .from("doctor_payout_requests")
    .update({ status })
    .eq("id", id);

  if (updateError) {
    return { success: false, error: "Unable to update payout request." };
  }

  const doctorId = current.doctor_id as string | null;
  const rawAmount = current.amount as number | null;
  const amount = Number(rawAmount || 0);

  if (doctorId && amount > 0) {
    let title: string | null = null;
    let message: string | null = null;

    if (status === "approved") {
      title = "Payout request approved";
      message = `Your payout request of ₦${amount.toLocaleString("en-NG")} has been approved. Payment will be sent to your bank soon.`;
    } else if (status === "rejected") {
      title = "Payout request rejected";
      message = `Your payout request of ₦${amount.toLocaleString("en-NG")} was rejected by the admin team.`;
    } else if (status === "paid") {
      title = "Payout sent";
      message = `Your payout of ₦${amount.toLocaleString("en-NG")} has been sent. Please check your bank account.`;
    }

    if (title && message) {
      await supabase.from("notifications").insert({
        user_id: doctorId,
        role: "doctor",
        title,
        message,
      });
    }
  }

  return { success: true };
}

type BlockAction = "block" | "unblock";

export async function updateUserBlockStatus(
  userId: string,
  role: "doctor" | "patient",
  action: BlockAction,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getServiceSupabase();
  const isBlocked = action === "block";

  const { error } = await supabase
    .from("profiles")
    .update({ is_blocked: isBlocked })
    .eq("id", userId);

  if (error) {
    return { success: false, error: "Unable to update account block status." };
  }

  let title: string;
  let message: string;

  if (isBlocked) {
    title = "Your account has been blocked";
    message =
      "Your MedicsOnline account has been blocked by the admin team. You can submit an appeal from the appeal page.";
  } else {
    title = "Your account has been unblocked";
    message =
      "Your MedicsOnline account has been unblocked. You can now access your dashboard again.";
  }

  await supabase.from("notifications").insert({
    user_id: userId,
    role,
    title,
    message,
  });

  return { success: true };
}

export type AppealDecision = "approve" | "decline";

export async function reviewAccountAppeal(
  appealId: string,
  decision: AppealDecision,
  response?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("account_appeals")
    .select("id,user_id,role,status")
    .eq("id", appealId)
    .maybeSingle();

  if (error || !data) {
    return { success: false, error: "Appeal not found." };
  }

  const newStatus = decision === "approve" ? "approved" : "declined";

  const { error: updateError } = await supabase
    .from("account_appeals")
    .update({
      status: newStatus,
      admin_response: response || null,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", appealId);

  if (updateError) {
    return { success: false, error: "Unable to update appeal." };
  }

  if (decision === "approve") {
    await supabase
      .from("profiles")
      .update({ is_blocked: false })
      .eq("id", data.user_id as string);
  }

  const title =
    decision === "approve"
      ? "Your appeal has been approved"
      : "Your appeal has been declined";

  const baseMessage =
    decision === "approve"
      ? "Your account has been restored and you can now access your dashboard again."
      : "After review, your account remains restricted.";

  const message = response
    ? `${baseMessage} Admin response: ${response}`
    : baseMessage;

  await supabase.from("notifications").insert({
    user_id: data.user_id as string,
    role: data.role as "doctor" | "patient",
    title,
    message,
  });

  return { success: true };
}

export async function deleteDoctorCredential(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getServiceSupabase();
  const { error } = await supabase.from("doctor_credentials").delete().eq("id", id);
  if (error) return { success: false, error: "Failed to delete credential" };
  return { success: true };
}

type UserRole = "doctor" | "patient";

interface AdminCreateUserInput {
  email: string;
  password: string;
  name?: string;
  type: UserRole;
  phone?: string;
  gender?: string;
  blood_group?: string;
}

export async function adminCreateUser(input: AdminCreateUserInput): Promise<{ success: boolean; error?: string }>{
  const supabase = getServiceSupabase();
  const email = input.email.trim();
  const password = input.password;
  if (!email || !password || (input.type !== "doctor" && input.type !== "patient")) {
    return { success: false, error: "Email, password and role are required." };
  }

  const createRes = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { type: input.type },
  } as any);

  const userId = (createRes as any)?.data?.user?.id as string | undefined;
  if (!userId) {
    return { success: false, error: "Unable to create auth user." };
  }

  const patch: Record<string, unknown> = {
    type: input.type,
  };
  if (input.name) patch.name = input.name;
  if (input.phone) patch.phone = input.phone;
  if (input.gender) patch.gender = input.gender;
  if (input.blood_group) patch.blood_group = input.blood_group;

  if (Object.keys(patch).length) {
    await supabase.from("profiles").update(patch).eq("id", userId);
  }

  await supabase.from("notifications").insert([
    {
      user_id: userId,
      role: input.type,
      title: "Welcome to MedicsOnline",
      message: "Your account has been created by an admin. Please log in and complete your profile.",
    },
  ]);

  return { success: true };
}

interface AdminUpdateUserInput {
  id: string;
  name?: string;
  phone?: string;
  gender?: string;
  blood_group?: string;
  type?: UserRole;
}

export async function adminUpdateUser(input: AdminUpdateUserInput): Promise<{ success: boolean; error?: string }>{
  const supabase = getServiceSupabase();
  const id = input.id;
  if (!id) return { success: false, error: "Missing user id" };
  const patch: Record<string, unknown> = {};
  if (typeof input.name === "string") patch.name = input.name;
  if (typeof input.phone === "string") patch.phone = input.phone;
  if (typeof input.gender === "string") patch.gender = input.gender;
  if (typeof input.blood_group === "string") patch.blood_group = input.blood_group;
  if (input.type === "doctor" || input.type === "patient") patch.type = input.type;
  if (!Object.keys(patch).length) return { success: false, error: "No fields to update." };
  const { error } = await supabase.from("profiles").update(patch).eq("id", id);
  if (error) return { success: false, error: "Unable to update user." };
  return { success: true };
}

export async function adminDeleteUser(id: string): Promise<{ success: boolean; error?: string }>{
  const supabase = getServiceSupabase();
  if (!id) return { success: false, error: "Missing user id" };
  try {
    await supabase.from("profiles").delete().eq("id", id);
  } catch {}
  try {
    await (supabase.auth as any).admin.deleteUser(id);
  } catch {}
  return { success: true };
}

interface AdminCreateAppointmentInput {
  patientId: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  startIso: string; // ISO string
  endIso: string; // ISO string
  type: string; // Video Consultation | Phone Consultation
}

export async function adminCreateAppointment(input: AdminCreateAppointmentInput): Promise<{ success: boolean; error?: string }>{
  const supabase = getServiceSupabase();
  const { patientId, doctorId, date, startIso, endIso, type } = input;
  if (!patientId || !doctorId || !date || !startIso || !endIso || !type) {
    return { success: false, error: "All fields are required." };
  }
  const { error, data } = await supabase
    .from("appointments")
    .insert({
      patient_id: patientId,
      doctor_id: doctorId,
      date,
      slot_start_iso: startIso,
      slot_end_iso: endIso,
      consultation_type: type,
      status: "Scheduled",
    })
    .select("id")
    .single();
  if (error) return { success: false, error: "Unable to create appointment." };

  const apptId = (data as any)?.id as string | undefined;
  await supabase.from("notifications").insert([
    {
      user_id: doctorId,
      role: "doctor",
      title: "New appointment scheduled",
      message: "An admin scheduled a new appointment for you. Please review your schedule.",
    },
    {
      user_id: patientId,
      role: "patient",
      title: "Your appointment is scheduled",
      message: "An admin has scheduled your appointment. Please be available at the selected time.",
    },
  ]);

  if (apptId) {
    await supabase.from("admin_activity").insert({ type: "appointment_created", payload: { apptId } } as any);
  }
  return { success: true };
}

export async function adminUpdateAppointmentStatus(id: string, status: string): Promise<{ success: boolean; error?: string }>{
  const supabase = getServiceSupabase();
  if (!id) return { success: false, error: "Missing appointment id" };
  const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
  if (error) return { success: false, error: "Unable to update appointment." };
  return { success: true };
}

export async function adminRescheduleAppointment(
  id: string,
  doctorId: string,
  patientId: string,
  newStartIso: string,
  newEndIso: string,
): Promise<{ success: boolean; error?: string }>{
  const supabase = getServiceSupabase();
  if (!id || !doctorId || !patientId || !newStartIso || !newEndIso) return { success: false, error: "Missing fields" };

  const start = new Date(newStartIso);
  const end = new Date(newEndIso);
  if (!(start instanceof Date) || Number.isNaN(start.getTime()) || !(end instanceof Date) || Number.isNaN(end.getTime()) || end <= start) {
    return { success: false, error: "Invalid start/end time" };
  }

  const dayStart = new Date(start);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const { data: conflicts } = await supabase
    .from("appointments")
    .select("id,slot_start_iso,slot_end_iso,status")
    .eq("doctor_id", doctorId)
    .neq("id", id)
    .in("status", ["Scheduled", "In Progress"] as any)
    .gte("slot_start_iso", dayStart.toISOString())
    .lt("slot_start_iso", dayEnd.toISOString());

  const hasOverlap = ((conflicts as any[]) || []).some((r) => {
    const s = new Date(r.slot_start_iso).getTime();
    const e = new Date(r.slot_end_iso).getTime();
    return Math.max(s, start.getTime()) < Math.min(e, end.getTime());
  });
  if (hasOverlap) {
    return { success: false, error: "New time overlaps with another appointment for this doctor." };
  }

  const date = start.toISOString().slice(0, 10);
  const { error } = await supabase
    .from("appointments")
    .update({ date, slot_start_iso: newStartIso, slot_end_iso: newEndIso, status: "Scheduled" })
    .eq("id", id);
  if (error) return { success: false, error: "Unable to reschedule appointment." };

  await supabase.from("notifications").insert([
    {
      user_id: doctorId,
      role: "doctor",
      title: "Appointment rescheduled",
      message: "An appointment was rescheduled by admin. Please check your schedule.",
    },
    {
      user_id: patientId,
      role: "patient",
      title: "Appointment rescheduled",
      message: "Your appointment time was updated by admin. Please check your schedule.",
    },
  ]);

  return { success: true };
}
