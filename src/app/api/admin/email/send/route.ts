import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase/service'
import { sendMail } from '@/lib/email/mailer'

type Segment = 'patients' | 'doctors' | 'subscribers' | 'custom'

export async function POST(req: NextRequest) {
  const supabase = getServiceSupabase()
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  const { segment, subject, html, emails, query } = body as {
    segment?: Segment
    subject?: string
    html?: string
    emails?: string[]
    query?: string
  }
  if (!segment || !subject || !html) {
    return NextResponse.json({ error: 'segment, subject and html are required' }, { status: 400 })
  }

  let recipients: string[] = []

  if (segment === 'custom') {
    recipients = Array.isArray(emails) ? emails.filter((e) => typeof e === 'string' && e.includes('@')) : []
  } else if (segment === 'subscribers') {
    const { data } = await supabase
      .from('newsletter_subscribers')
      .select('email')
    recipients = (data || []).map((r: any) => r.email as string)
  } else {
    const role = segment === 'doctors' ? 'doctor' : 'patient'
    const base = supabase
      .from('profiles')
      .select('email')
      .eq('type', role)
    const filter = typeof query === 'string' && query.trim().length > 0 ? query.trim() : null
    let rows: any[] = []
    if (filter) {
      const { data } = await base.ilike('email', `%${filter}%`)
      rows = data || []
    } else {
      const { data } = await base
      rows = data || []
    }
    recipients = rows.map((r) => r.email as string).filter((e) => typeof e === 'string' && e.includes('@'))
  }

  // de-duplicate and chunk
  const unique = Array.from(new Set(recipients))
  const chunks: string[][] = []
  const size = 40
  for (let i = 0; i < unique.length; i += size) chunks.push(unique.slice(i, i + size))

  for (const batch of chunks) {
    // best-effort parallel, but avoid large fan-out
    await sendMail({ to: batch, subject, html })
  }

  const count = unique.length
  await supabase.from('email_marketing_sends').insert({ segment, subject, body: html, recipients_count: count })
  return NextResponse.json({ success: true, recipients: count })
}

