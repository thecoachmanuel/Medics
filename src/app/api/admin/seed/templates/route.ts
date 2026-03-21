
import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";

export async function GET() {
  const supabase = getServiceSupabase();
  
  const templates: Array<{ slug: string; subject: string; html: string }> = [
    {
      slug: 'payment_patient',
      subject: 'Payment Confirmation: {{when}}',
      html: `
        <p>Dear {{patientName}},</p>
        <p>We have successfully received your payment of <strong>{{currency}} {{amount}}</strong> for your appointment with <strong>{{doctorName}}</strong>.</p>
        <p><strong>Appointment Details:</strong></p>
        <ul>
          <li>Date & Time: {{when}}</li>
          <li>Doctor: {{doctorName}}</li>
        </ul>
        <p>Please log in to your dashboard to join the consultation at the scheduled time.</p>
        <p>Thank you for choosing MedicsOnline.</p>
      `
    },
    {
      slug: 'payment_doctor',
      subject: 'New Appointment Booked: {{when}}',
      html: `
        <p>Dear {{doctorName}},</p>
        <p>You have a new appointment booked with <strong>{{patientName}}</strong>.</p>
        <p><strong>Appointment Details:</strong></p>
        <ul>
          <li>Date & Time: {{when}}</li>
          <li>Patient: {{patientName}}</li>
          <li>Fee: {{currency}} {{amount}}</li>
        </ul>
        <p>Please log in to your dashboard to view details and join the consultation.</p>
      `
    },
    {
      slug: 'welcome_patient',
      subject: 'Welcome to MedicsOnline',
      html: `
        <p>Hi {{name}},</p>
        <p>Welcome to MedicsOnline! We are delighted to have you on board.</p>
        <p>You can now search for doctors, book appointments, and consult with specialists from the comfort of your home.</p>
        <p><a href="{{loginUrl}}">Log in to your account</a></p>
      `
    },
    {
      slug: 'welcome_doctor',
      subject: 'Welcome to MedicsOnline',
      html: `
        <p>Dear Dr. {{name}},</p>
        <p>Welcome to MedicsOnline! We are excited to partner with you.</p>
        <p>Please complete your profile and set your availability to start receiving appointment bookings.</p>
        <p><a href="{{loginUrl}}">Log in to your dashboard</a></p>
      `
    },
    {
      slug: 'appointment_reminder',
      subject: 'Reminder: Appointment in 15 minutes',
      html: `
        <p>Hi {{name}},</p>
        <p>This is a reminder that your appointment with {{otherName}} is starting in 15 minutes ({{time}}).</p>
        <p>Please log in and be ready.</p>
      `
    }
  ];

  const results = [];

  for (const t of templates) {
    const { data } = await supabase.from('email_templates').select('id').eq('slug', t.slug).maybeSingle();
    
    if (!data) {
      // Create new
      const { data: created, error } = await supabase.from('email_templates').insert(t).select().single();
      if (error) {
        results.push({ slug: t.slug, status: 'error', error: error.message });
      } else {
        results.push({ slug: t.slug, status: 'created', id: created.id });
      }
    } else {
      const { error } = await supabase.from('email_templates').update({
        subject: t.subject,
        html: t.html
      }).eq('id', data.id);
      
      if (error) {
        results.push({ slug: t.slug, status: 'update_error', error: error.message });
      } else {
        results.push({ slug: t.slug, status: 'updated', id: data.id });
      }
    }
  }

  return NextResponse.json({ success: true, results });
}
