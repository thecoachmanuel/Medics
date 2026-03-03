import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase/service'

type Template = { id: string; slug: string; subject: string; html: string; updated_at: string }

export async function GET() {
  const supabase = getServiceSupabase()
  const { data, error } = await supabase
    .from('email_templates')
    .select('id,slug,subject,html,updated_at')
    .order('updated_at', { ascending: false })
  if (error) {
    return NextResponse.json({ error: 'Unable to load templates' }, { status: 500 })
  }
  return NextResponse.json({ templates: data as Template[] })
}

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
  const { slug, subject, html } = body as { slug?: string; subject?: string; html?: string }
  if (!slug || !subject || !html) {
    return NextResponse.json({ error: 'slug, subject and html are required' }, { status: 400 })
  }
  const { data: existing } = await supabase
    .from('email_templates')
    .select('id')
    .eq('slug', slug)
    .maybeSingle<{ id: string }>()

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from('email_templates')
      .update({ subject, html })
      .eq('id', existing.id)
    if (updateError) {
      return NextResponse.json({ error: 'Unable to update template' }, { status: 500 })
    }
  } else {
    const { error: insertError } = await supabase
      .from('email_templates')
      .insert({ slug, subject, html })
    if (insertError) {
      return NextResponse.json({ error: 'Unable to save template' }, { status: 500 })
    }
  }
  return NextResponse.json({ success: true })
}

