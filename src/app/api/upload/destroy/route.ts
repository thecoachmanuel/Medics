import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'medicsonline'

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const publicId = (body as any).publicId as string | undefined
  if (!publicId) {
    return NextResponse.json({ error: 'publicId is required' }, { status: 400 })
  }

  // Use the service role (admin) client so RLS does not block server-side deletion
  const adminSupabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    const { error } = await adminSupabase.storage.from(BUCKET).remove([publicId])
    if (error) {
      return NextResponse.json({ error: 'Unable to delete asset' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Unable to delete asset' }, { status: 500 })
  }
}
