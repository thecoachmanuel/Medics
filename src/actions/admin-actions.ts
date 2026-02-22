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

export type DoctorAdminAction = "approve" | "suspend" | "unsuspend";

export async function updateDoctorAdminStatus(
  doctorId: string,
  action: DoctorAdminAction,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getServiceSupabase();
  let patch: Record<string, unknown> = {};

  if (action === "approve") {
    patch = { is_verified: true, is_suspended: false };
  } else if (action === "suspend") {
    patch = { is_suspended: true };
  } else if (action === "unsuspend") {
    patch = { is_suspended: false };
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
  }

  if (title && message) {
    await supabase.from("notifications").insert({
      user_id: doctorId,
      role: "doctor",
      title,
      message,
    });
  }

  return { success: true };
}

type PayoutStatusValue = "pending" | "approved" | "rejected" | "paid";

export async function updatePayoutStatus(id: string, status: PayoutStatusValue): Promise<{ success: boolean; error?: string }> {
  const supabase = getServiceSupabase();
  const { error } = await supabase.from("doctor_payout_requests").update({ status }).eq("id", id);
  if (error) {
    return { success: false, error: "Unable to update payout request." };
  }
  return { success: true };
}
