import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import { formatDateTimeNG } from "@/lib/datetime";

type ReminderWindow = "24h" | "1h" | "15m";

const windowConfigMap: Record<ReminderWindow, { windowMinutes: number; flagField: string }> = {
  "24h": { windowMinutes: 24 * 60, flagField: "reminder_24h_sent" },
  "1h": { windowMinutes: 60, flagField: "reminder_1h_sent" },
  "15m": { windowMinutes: 15, flagField: "reminder_15m_sent" },
};

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : authHeader.trim();

  const expected = process.env.CRON_SECRET;
  if (!expected || token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();

  const url = new URL(request.url);
  const windowParam = (url.searchParams.get("window") as ReminderWindow | null) || "15m";
  const config = windowConfigMap[windowParam] ?? windowConfigMap["15m"];

  const now = new Date();
  const upper = new Date(now.getTime() + config.windowMinutes * 60 * 1000);

  const { data: rows, error } = await supabase
    .from("appointments")
    .select(
      "id,doctor_id,patient_id,slot_start_iso,status,email_reminder_sent,sms_reminder_sent," +
        config.flagField,
    )
    .in("status", ["Scheduled", "In Progress"])
    .eq(config.flagField, false)
    .gte("slot_start_iso", now.toISOString())
    .lte("slot_start_iso", upper.toISOString());

  if (error) {
    return NextResponse.json({ error: "Failed to load appointments" }, { status: 500 });
  }

  const appointments = ((rows || []) as any[]);
  if (appointments.length === 0) {
    const statusUpdateResult = await updateExpiredAndMissedAppointments(supabase);
    return NextResponse.json({ success: true, processed: 0, ...statusUpdateResult });
  }

  const participantIds = Array.from(
    new Set([
      ...appointments.map((a) => a.doctor_id as string),
      ...appointments.map((a) => a.patient_id as string),
    ]),
  ).filter((id) => typeof id === "string" && id.length > 0);

  const { data: profilesData } = participantIds.length
    ? await supabase
        .from("profiles")
        .select("id,type,name,email,phone")
        .in("id", participantIds)
    : { data: [] as any[] };

  const profileMap = new Map(
    (profilesData || []).map((p: any) => [p.id as string, p]),
  );

  let emailSentCount = 0;
  let smsSentCount = 0;

  for (const appt of appointments) {
    const doctorProfile = profileMap.get(appt.doctor_id as string);
    const patientProfile = profileMap.get(appt.patient_id as string);

    const slotIso = appt.slot_start_iso as string;
    const whenText = slotIso ? formatDateTimeNG(slotIso) : "soon";

    const title = "Upcoming appointment";
    const message = `You have an appointment scheduled at ${whenText}.`;

    // in-app notifications
    const notifications: any[] = [];
    if (doctorProfile) {
      notifications.push({
        user_id: doctorProfile.id,
        role: "doctor",
        title,
        message,
      });
    }
    if (patientProfile) {
      notifications.push({
        user_id: patientProfile.id,
        role: "patient",
        title,
        message,
      });
    }
    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }

    // email via external provider (configure in deployment env)
    if (!appt.email_reminder_sent) {
      const recipients: { email: string; name: string | null; role: "doctor" | "patient" }[] = [];
      if (doctorProfile?.email) {
        recipients.push({ email: doctorProfile.email, name: doctorProfile.name, role: "doctor" });
      }
      if (patientProfile?.email) {
        recipients.push({ email: patientProfile.email, name: patientProfile.name, role: "patient" });
      }

      if (recipients.length > 0) {
        const promises = recipients.map(async (r) => {
          const adminEmail = process.env.NEXT_ADMIN_EMAIL;
          if (!adminEmail) return;
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.RESEND_API_KEY ?? ""}`,
            },
            body: JSON.stringify({
              from: adminEmail,
              to: [r.email],
              subject: "Upcoming MedicsOnline appointment",
              html: `<p>Hi ${r.name || r.role},</p><p>You have an appointment scheduled at <strong>${whenText}</strong>.</p>`,
            }),
          }).catch(() => undefined);
        });
        await Promise.all(promises);
        emailSentCount += recipients.length;
      }
    }

    // SMS via Twilio-compatible HTTP API
    if (!appt.sms_reminder_sent) {
      const smsRecipients: { phone: string; role: "doctor" | "patient" }[] = [];
      if (doctorProfile?.phone) {
        smsRecipients.push({ phone: doctorProfile.phone, role: "doctor" });
      }
      if (patientProfile?.phone) {
        smsRecipients.push({ phone: patientProfile.phone, role: "patient" });
      }

      if (smsRecipients.length > 0) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
        const authToken = process.env.TWILIO_AUTH_TOKEN || "";
        const fromNumber = process.env.TWILIO_FROM_NUMBER || "";
        if (accountSid && authToken && fromNumber) {
          const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
          const promises = smsRecipients.map(async (r) => {
            const params = new URLSearchParams({
              From: fromNumber,
              To: r.phone,
              Body: `You have a MedicsOnline appointment at ${whenText}.`,
            });
            await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
              method: "POST",
              headers: {
                Authorization: `Basic ${auth}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: params.toString(),
            }).catch(() => undefined);
          });
          await Promise.all(promises);
          smsSentCount += smsRecipients.length;
        }
      }
    }

    await supabase
      .from("appointments")
      .update({
        [config.flagField]: true,
        email_reminder_sent: true,
        sms_reminder_sent: true,
      })
      .eq("id", appt.id);
  }
  const statusUpdateResult = await updateExpiredAndMissedAppointments(supabase);

  return NextResponse.json({
    success: true,
    processed: appointments.length,
    emailSent: emailSentCount,
    smsSent: smsSentCount,
    ...statusUpdateResult,
  });
}

async function updateExpiredAndMissedAppointments(supabase: ReturnType<typeof getServiceSupabase>) {
  const now = new Date();

  const { data: scheduledRows, error: scheduledError } = await supabase
    .from("appointments")
    .select("id,slot_start_iso,slot_end_iso,status,doctor_id,patient_id")
    .eq("status", "Scheduled")
    .lt("slot_start_iso", now.toISOString());

  if (scheduledError || !scheduledRows || !scheduledRows.length) {
    return { statusUpdated: 0, expiredCount: 0, missedCount: 0 };
  }

  const ids = scheduledRows.map((r: any) => r.id as string);

  const { data: payRows } = await supabase
    .from("payments")
    .select("appointment_id,status")
    .in("appointment_id", ids)
    .eq("status", "success");

  const paidSet = new Set<string>((payRows || []).map((p: any) => p.appointment_id as string));

  const expiredIds: string[] = [];
  const missedIds: string[] = [];

  for (const row of scheduledRows as any[]) {
    const id = row.id as string;
    if (paidSet.has(id)) {
      const startIso = row.slot_start_iso as string | null;
      const endIso = row.slot_end_iso as string | null;
      let effectiveEnd: Date | null = null;

      if (endIso) {
        const end = new Date(endIso);
        if (!Number.isNaN(end.getTime())) {
          effectiveEnd = end;
        }
      }

      if (!effectiveEnd && startIso) {
        const start = new Date(startIso);
        if (!Number.isNaN(start.getTime())) {
          effectiveEnd = start;
        }
      }

      if (effectiveEnd) {
        const cutoff = new Date(effectiveEnd.getTime() + 60 * 60 * 1000);
        if (now >= cutoff) {
          missedIds.push(id);
        }
      }
    } else {
      expiredIds.push(id);
    }
  }

  let expiredCount = 0;
  let missedCount = 0;

  if (expiredIds.length) {
    const { error: expiredError } = await supabase
      .from("appointments")
      .update({ status: "Expired" })
      .in("id", expiredIds);
    if (!expiredError) {
      expiredCount = expiredIds.length;
    }
  }

  if (missedIds.length) {
    const { data: missedRows, error: missedError } = await supabase
      .from("appointments")
      .select("id,doctor_id,patient_id,slot_start_iso")
      .in("id", missedIds);

    if (!missedError && missedRows && missedRows.length) {
      const notifications: any[] = [];

      for (const row of missedRows as any[]) {
        const doctorId = row.doctor_id as string | null;
        const patientId = row.patient_id as string | null;
        const slotIso = row.slot_start_iso as string | null;

      const whenText = slotIso ? formatDateTimeNG(slotIso) : "the scheduled time";

        if (doctorId) {
          notifications.push({
            user_id: doctorId,
            role: "doctor",
            title: "Appointment missed",
            message: `A paid appointment scheduled for ${whenText} was not attended by the patient and has been marked as missed.`,
          });
        }
      }

      if (notifications.length) {
        await supabase.from("notifications").insert(notifications);
      }

      const { error: updateMissedError } = await supabase
        .from("appointments")
        .update({ status: "Missed" })
        .in("id", missedIds);

      if (!updateMissedError) {
        missedCount = missedIds.length;
      }
    }
  }

  return { statusUpdated: expiredCount + missedCount, expiredCount, missedCount };
}
