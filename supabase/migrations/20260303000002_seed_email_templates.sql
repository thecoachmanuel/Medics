
-- Seed default email templates
INSERT INTO public.email_templates (slug, subject, html)
VALUES 
(
  'payment_patient',
  'Payment Confirmation: {{when}}',
  '<p>Dear {{patientName}},</p><p>We have successfully received your payment of <strong>{{currency}} {{amount}}</strong> for your appointment with <strong>{{doctorName}}</strong>.</p><p><strong>Appointment Details:</strong></p><ul><li>Date & Time: {{when}}</li><li>Doctor: {{doctorName}}</li></ul><p>Please log in to your dashboard to join the consultation at the scheduled time.</p><p>Thank you for choosing MedicsOnline.</p>'
),
(
  'payment_doctor',
  'New Appointment Booked: {{when}}',
  '<p>Dear {{doctorName}},</p><p>You have a new appointment booked with <strong>{{patientName}}</strong>.</p><p><strong>Appointment Details:</strong></p><ul><li>Date & Time: {{when}}</li><li>Patient: {{patientName}}</li><li>Fee: {{currency}} {{amount}}</li></ul><p>Please log in to your dashboard to view details and join the consultation.</p>'
),
(
  'welcome_patient',
  'Welcome to MedicsOnline',
  '<p>Hi {{name}},</p><p>Welcome to MedicsOnline! We are delighted to have you on board.</p><p>You can now search for doctors, book appointments, and consult with specialists from the comfort of your home.</p><p><a href="{{loginUrl}}">Log in to your account</a></p>'
),
(
  'welcome_doctor',
  'Welcome to MedicsOnline',
  '<p>Dear Dr. {{name}},</p><p>Welcome to MedicsOnline! We are excited to partner with you.</p><p>Please complete your profile and set your availability to start receiving appointment bookings.</p><p><a href="{{loginUrl}}">Log in to your dashboard</a></p>'
),
(
  'appointment_reminder',
  'Reminder: Appointment in 15 minutes',
  '<p>Hi {{name}},</p><p>This is a reminder that your appointment with {{otherName}} is starting in 15 minutes ({{time}}).</p><p>Please log in and be ready.</p>'
)
ON CONFLICT (slug) DO UPDATE SET
  subject = EXCLUDED.subject,
  html = EXCLUDED.html;
