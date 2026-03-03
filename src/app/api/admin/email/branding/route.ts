import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase/service'

type BrandingConfig = {
  fromName?: string | null
  fromEmail?: string | null
  replyToEmail?: string | null
  headerLogoUrl?: string | null
  footerText?: string | null
}

type BrandingRow = { id: string; config: BrandingConfig | null }

export async function GET() {
  const supabase = getServiceSupabase()
  const { data, error } = await supabase
    .from('email_branding')
    .select('id,config')
    .limit(1)
    .maybeSingle<BrandingRow>()
  if (error) {
    return NextResponse.json({ error: 'Unable to load email branding' }, { status: 500 })
  }
  return NextResponse.json({ config: data?.config ?? null })
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
  const cfg = body as BrandingConfig

  const { data: existing, error: loadError } = await supabase
    .from('email_branding')
    .select('id')
    .limit(1)
    .maybeSingle<{ id: string }>()
  if (loadError) {
    return NextResponse.json({ error: 'Unable to load email branding' }, { status: 500 })
  }
  if (existing?.id) {
    const { error: updateError } = await supabase
      .from('email_branding')
      .update({ config: cfg })
      .eq('id', existing.id)
    if (updateError) {
      return NextResponse.json({ error: 'Unable to update email branding' }, { status: 500 })
    }
  } else {
    const { error: insertError } = await supabase
      .from('email_branding')
      .insert({ config: cfg })
    if (insertError) {
      return NextResponse.json({ error: 'Unable to save email branding' }, { status: 500 })
    }
  }
  return NextResponse.json({ success: true })
}

