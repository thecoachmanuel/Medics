import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";

type ActivityType = "signup" | "payout_request" | "review";

interface SignupPayload {
  userId: string;
}

interface PayoutRequestPayload {
  requestId: string;
}

interface ReviewPayload {
  appointmentId: string;
}

type ActivityPayload = SignupPayload | PayoutRequestPayload | ReviewPayload;

interface ActivityRequest {
  type: ActivityType;
  payload: ActivityPayload;
}

export async function POST(req: NextRequest) {
  let body: ActivityRequest;
  try {
    body = (await req.json()) as ActivityRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body.type !== "string" || !body.payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const adminEmail = process.env.NEXT_ADMIN_EMAIL || "";
  const resendKey = process.env.RESEND_API_KEY || "";

  try {
    if (body.type === "signup") {
      const payload = body.payload as SignupPayload;
      if (!payload.userId) {
        return NextResponse.json({ error: "Missing userId" }, { status: 400 });
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id,name,email,type,created_at")
        .eq("id", payload.userId)
        .maybeSingle();
      if (error) {
        return NextResponse.json({ error: "Unable to load profile" }, { status: 500 });
      }
      if (!profile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }

      const role = String(profile.type || "user");
      const title = role === "doctor" ? "New doctor signup" : role === "patient" ? "New patient signup" : "New user signup";
      const name = (profile.name as string | null) || "Unknown";
      const email = (profile.email as string | null) || "Unknown";
      const createdAt = profile.created_at as string | null;
      const createdText = createdAt
        ? new Date(createdAt).toLocaleString("en-NG", {
            timeZone: "Africa/Lagos",
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Unknown time";

      const message = `${title}: ${name} (${email}) joined on ${createdText}.`;

      await supabase.from("notifications").insert({
        user_id: null,
        role: "admin",
        title,
        message,
      });

      if (adminEmail && resendKey) {
        const html = `<p>${message}</p>`;
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: adminEmail,
            to: [adminEmail],
            subject: title,
            html,
          }),
        }).catch(() => undefined);
      }

      return NextResponse.json({ success: true });
    }

    if (body.type === "payout_request") {
      const payload = body.payload as PayoutRequestPayload;
      if (!payload.requestId) {
        return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
      }

      const { data: payout, error } = await supabase
        .from("doctor_payout_requests")
        .select("id,doctor_id,amount,status,created_at")
        .eq("id", payload.requestId)
        .maybeSingle();
      if (error) {
        return NextResponse.json({ error: "Unable to load payout request" }, { status: 500 });
      }
      if (!payout) {
        return NextResponse.json({ error: "Payout request not found" }, { status: 404 });
      }

      const doctorId = payout.doctor_id as string;
      let doctorName: string | null = null;
      let doctorEmail: string | null = null;

      if (doctorId) {
        const { data: doctorProfile } = await supabase
          .from("profiles")
          .select("name,email")
          .eq("id", doctorId)
          .maybeSingle();
        doctorName = (doctorProfile?.name as string | null) || null;
        doctorEmail = (doctorProfile?.email as string | null) || null;
      }

      const amount = Number(payout.amount || 0);
      const amountText = amount.toLocaleString("en-NG");
      const status = String(payout.status || "pending");
      const createdAt = payout.created_at as string | null;
      const createdText = createdAt
        ? new Date(createdAt).toLocaleString("en-NG", {
            timeZone: "Africa/Lagos",
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Unknown time";

      const title = "New payout request";
      const doctorLabel = doctorName || doctorEmail || doctorId || "Doctor";
      const message = `${title}: ${doctorLabel} requested ₦${amountText} (${status}) on ${createdText}.`;

      await supabase.from("notifications").insert({
        user_id: null,
        role: "admin",
        title,
        message,
      });

      if (adminEmail && resendKey) {
        const html = `<p>${message}</p>`;
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: adminEmail,
            to: [adminEmail],
            subject: title,
            html,
          }),
        }).catch(() => undefined);
      }

      return NextResponse.json({ success: true });
    }

    if (body.type === "review") {
      const payload = body.payload as ReviewPayload;
      if (!payload.appointmentId) {
        return NextResponse.json({ error: "Missing appointmentId" }, { status: 400 });
      }

      const { data: ratingRow, error } = await supabase
        .from("doctor_ratings")
        .select("doctor_id,patient_id,rating,comment,created_at")
        .eq("appointment_id", payload.appointmentId)
        .maybeSingle();
      if (error) {
        return NextResponse.json({ error: "Unable to load review" }, { status: 500 });
      }
      if (!ratingRow) {
        return NextResponse.json({ error: "Review not found" }, { status: 404 });
      }

      const doctorId = ratingRow.doctor_id as string;
      const patientId = ratingRow.patient_id as string;

      const [doctorProfileResult, patientProfileResult] = await Promise.all([
        doctorId
          ? supabase.from("profiles").select("name").eq("id", doctorId).maybeSingle()
          : Promise.resolve({ data: null } as any),
        patientId
          ? supabase.from("profiles").select("name").eq("id", patientId).maybeSingle()
          : Promise.resolve({ data: null } as any),
      ]);

      const doctorName = (doctorProfileResult.data?.name as string | null) || null;
      const patientName = (patientProfileResult.data?.name as string | null) || null;

      const rating = Number(ratingRow.rating || 0);
      const comment = (ratingRow.comment as string | null) || null;
      const createdAt = ratingRow.created_at as string | null;
      const createdText = createdAt
        ? new Date(createdAt).toLocaleString("en-NG", {
            timeZone: "Africa/Lagos",
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Unknown time";

      const title = "New doctor review";
      const doctorLabel = doctorName || doctorId || "Doctor";
      const patientLabel = patientName || patientId || "Patient";
      let message = `${title}: ${doctorLabel} received a rating of ${rating.toFixed(1)}/5 from ${patientLabel} on ${createdText}.`;
      if (comment && comment.trim().length > 0) {
        const snippet = comment.trim().length > 160 ? `${comment.trim().slice(0, 157)}...` : comment.trim();
        message = `${message} Comment: "${snippet}"`;
      }

      await supabase.from("notifications").insert({
        user_id: null,
        role: "admin",
        title,
        message,
      });

      if (adminEmail && resendKey) {
        const html = `<p>${message}</p>`;
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: adminEmail,
            to: [adminEmail],
            subject: title,
            html,
          }),
        }).catch(() => undefined);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unsupported activity type" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

