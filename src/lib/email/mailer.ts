import nodemailer from 'nodemailer'
import { getServiceSupabase } from '@/lib/supabase/service'

type EmailBranding = {
  fromName?: string | null
  fromEmail?: string | null
  replyToEmail?: string | null
  headerLogoUrl?: string | null
  footerText?: string | null
}

type SendMailInput = {
  to: string | string[]
  subject: string
  html: string
}

function getEnv(name: string): string | undefined {
  const v = process.env[name]
  return typeof v === 'string' && v.length > 0 ? v : undefined
}

async function loadBranding(): Promise<EmailBranding> {
  const supabase = getServiceSupabase()
  const { data } = await supabase
    .from('email_branding')
    .select('config')
    .limit(1)
    .maybeSingle<{ config: EmailBranding | null }>()
  return (data?.config as EmailBranding) || {}
}

function buildTransport() {
  const host = getEnv('SMTP_HOST') || 'smtp.gmail.com'
  const port = Number(getEnv('SMTP_PORT') || 465)
  const secure = (getEnv('SMTP_SECURE') || 'true').toLowerCase() !== 'false'
  const user = getEnv('SMTP_USER')
  const pass = getEnv('SMTP_PASS')
  if (!user || !pass) {
    throw new Error('Missing SMTP_USER/SMTP_PASS environment variables')
  }
  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } })
}

function wrapHtml(html: string, branding: EmailBranding): string {
  const headerLogo = branding.headerLogoUrl
    ? `<div style="padding:16px 0;text-align:center"><img src="${branding.headerLogoUrl}" alt="Logo" style="max-width:160px;height:auto"/></div>`
    : ''
  const footer = branding.footerText
    ? `<div style="margin-top:24px;color:#6b7280;font-size:12px;text-align:center">${branding.footerText}</div>`
    : ''
  return `
  <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f8fafc;padding:24px">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:24px">
      ${headerLogo}
      <div style="font-size:14px;color:#111827;line-height:1.6">${html}</div>
      ${footer}
    </div>
  </div>`
}

export async function sendMail(input: SendMailInput): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const branding = await loadBranding()
    const fromName = branding.fromName || getEnv('FROM_NAME') || 'MedicsOnline'
    const fromEmail = branding.fromEmail || getEnv('FROM_EMAIL') || getEnv('SMTP_USER') || 'no-reply@localhost'
    const replyTo = branding.replyToEmail || fromEmail

    const transporter = buildTransport()
    const html = wrapHtml(input.html, branding)

    await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: Array.isArray(input.to) ? input.to.join(',') : input.to,
      replyTo,
      subject: input.subject,
      html,
    })
    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'sendMail failed'
    console.error('sendMail error:', msg)
    return { success: false, error: msg }
  }
}

export async function sendTransactionalTemplate(slug: string, to: string | string[], vars: Record<string, string>): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const supabase = getServiceSupabase()
    const { data: tpl } = await supabase
      .from('email_templates')
      .select('subject,html')
      .eq('slug', slug)
      .maybeSingle<{ subject: string; html: string }>()

    const defaults: Record<string, { subject: string; html: string }> = {
      'payment_patient': {
        subject: 'Payment confirmed for your appointment',
        html: '<p>Your payment for the appointment with {{doctorName}} on {{when}} is confirmed. Amount: {{amount}} {{currency}}.</p>'
      },
      'payment_doctor': {
        subject: 'New appointment booked',
        html: '<p>{{patientName}} has paid and booked an appointment with you on {{when}}. Amount: {{amount}} {{currency}}.</p>'
      }
    }

    const subject = tpl?.subject ?? defaults[slug]?.subject ?? slug
    const htmlRaw = tpl?.html ?? defaults[slug]?.html ?? '<p>{{content}}</p>'
    const html = Object.keys(vars).reduce((acc, key) => acc.replaceAll(`{{${key}}}`, vars[key] ?? ''), htmlRaw)
    return await sendMail({ to, subject, html })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'sendTransactionalTemplate failed'
    console.error('sendTransactionalTemplate error:', msg)
    return { success: false, error: msg }
  }
}

