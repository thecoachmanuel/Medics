import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import { sendMail } from "@/lib/email/mailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, type } = body;
    // Default redirect to origin/auth/callback or just origin
    // Force use of NEXT_PUBLIC_SITE_URL if available
    let redirectTo = body.redirectTo;
    
    // If the body redirect contains localhost but we have a production URL, override it
    if (process.env.NEXT_PUBLIC_SITE_URL && (!redirectTo || redirectTo.includes('localhost'))) {
        redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
    } else if (!redirectTo) {
        redirectTo = "http://localhost:3000/auth/callback";
    }

    if (!email || !password || !name || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // 1. Create user (or check if exists)
    // We use createUser to ensure we can set metadata for the trigger
    const { data: userResult, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Ensure they need to confirm
      user_metadata: { name, type },
    });

    if (createError) {
      // If user already exists, we might want to just resend the link
      // But only if they are not confirmed?
      // For security, we usually don't reveal if user exists, but here we are mimicking signup.
      // If "User already registered", we proceed to generate link.
      if (!createError.message.includes("already registered")) {
        return NextResponse.json({ error: createError.message }, { status: 400 });
      }
    }

    // 2. Generate Confirmation Link
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: {
        redirectTo,
        data: { name, type }, // Ensure metadata is updated if user existed
      },
    });

    if (linkError) {
      return NextResponse.json({ error: linkError.message }, { status: 500 });
    }

    const actionLink = linkData.properties?.action_link;
    if (!actionLink) {
      return NextResponse.json({ error: "Failed to generate confirmation link" }, { status: 500 });
    }

    // 3. Send Email
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to MedicsOnline!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for signing up. Please confirm your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${actionLink}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Confirm Email</a>
        </div>
        <p>If you didn't sign up, you can safely ignore this email.</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">Or copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 12px; word-break: break-all;">${actionLink}</p>
      </div>
    `;

    const emailResult = await sendMail({
      to: email,
      subject: "Confirm your MedicsOnline account",
      html,
    });

    if (!emailResult.success) {
      console.error("Failed to send signup email:", emailResult.error);
      // We still return success to the client so they don't retry immediately, but maybe warn?
      // Or fail? Let's fail so they know.
      return NextResponse.json({ error: "Failed to send confirmation email" }, { status: 500 });
    }

    // 4. Log Activity (optional, mirroring existing logic)
    // The client was calling /api/admin/activity, but we can do it here to be safe.
    // However, we need the userId.
    const userId = userResult.user?.id || linkData.user?.id;
    if (userId) {
      try {
         // Insert notification directly since we have service role
         const title = type === 'doctor' ? "New doctor signup" : "New patient signup";
         const message = `${title}: ${name} (${email}) signed up via custom flow.`;
         
         await supabase.from("notifications").insert({
           role: "admin",
           title,
           message,
         });
         
         // Also send admin email if configured (reusing logic from admin/activity if needed, but keeping it simple here)
         // We can just call the activity endpoint internally or duplicate logic.
         // Let's leave it to the client or duplicate essential notification logic here.
         // The client calls /api/admin/activity separately in the original store. 
         // We can keep that or move it here. Moving it here is cleaner.
         
         const adminEmail = process.env.NEXT_ADMIN_EMAIL;
         if (adminEmail) {
           await sendMail({
             to: adminEmail,
             subject: title,
             html: `<p>${message}</p>`
           });
         }
      } catch (e) {
        console.error("Failed to log activity:", e);
      }
    }

    return NextResponse.json({ success: true, userId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal Error" }, { status: 500 });
  }
}
