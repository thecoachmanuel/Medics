
import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import { sendMail } from "@/lib/email/mailer";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    
    // Determine the base URL dynamically from the request origin
    // This ensures local development works correctly (localhost:3000) instead of redirecting to production
    const origin = req.nextUrl.origin;
    
    // Add next param to ensure redirect to reset-password page
    const redirectTo = `${origin}/auth/callback?next=/reset-password&type=recovery`;

    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo,
      },
    });

    if (error) {
      console.error("Error generating recovery link:", error);
      // If user not found, we still return success to prevent email enumeration
      // But logging it is useful for debugging
      if (error.message.includes("User not found")) {
         return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { properties } = data;
    const actionLink = properties.action_link;

    // Send email
    const html = `
      <div style="font-family: sans-serif;">
        <h2 style="color: #1a202c;">Reset Your Password</h2>
        <p style="color: #4a5568;">Hello,</p>
        <p style="color: #4a5568;">We received a request to reset your password for your MedicsOnline account.</p>
        <div style="margin: 24px 0;">
          <a href="${actionLink}" style="display: inline-block; background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Reset Password
          </a>
        </div>
        <p style="color: #4a5568; font-size: 14px;">This link will expire in 1 hour.</p>
        <p style="color: #718096; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;

    const emailResult = await sendMail({
      to: email,
      subject: "Reset your MedicsOnline password",
      html,
    });

    if (!emailResult.success) {
      console.error("Failed to send recovery email:", emailResult.error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
