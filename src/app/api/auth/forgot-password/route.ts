
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
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7fa; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .card { background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); padding: 40px; margin-top: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { color: #2563EB; font-size: 24px; font-weight: bold; text-decoration: none; }
          .btn { display: inline-block; background-color: #2563EB; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin-top: 20px; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <a href="${origin}" class="logo">MedicsOnline</a>
          </div>
          <div class="card">
            <h2 style="color: #1a202c; margin-top: 0;">Reset Your Password</h2>
            <p>Hello,</p>
            <p>We received a request to reset the password for your MedicsOnline account. If you didn't make this request, you can safely ignore this email.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${actionLink}" class="btn">Reset Password</a>
            </div>
            <p style="font-size: 14px; color: #666;">This link will expire in 1 hour for your security.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="font-size: 13px; color: #888;">If the button above doesn't work, copy and paste this link into your browser:<br />
            <a href="${actionLink}" style="color: #2563EB; word-break: break-all;">${actionLink}</a></p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} MedicsOnline. All rights reserved.
          </div>
        </div>
      </body>
      </html>
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
