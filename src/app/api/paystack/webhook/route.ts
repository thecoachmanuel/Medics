import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { getServiceSupabase } from '@/lib/supabase/service'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY as string | undefined

export async function POST(request: Request) {
  if (!PAYSTACK_SECRET) {
    return NextResponse.json({ error: 'Missing Paystack secret' }, { status: 500 })
  }
  const rawBuf = Buffer.from(await request.arrayBuffer())
  const signature = (await headers()).get('x-paystack-signature') || ''
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(rawBuf).digest('hex')
  if (hash !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  const event = JSON.parse(rawBuf.toString('utf8'))
  const supabase = getServiceSupabase()
  const ref = event?.data?.reference
  const status = event?.event === 'charge.success' ? 'success' : event?.data?.status || 'failed'
  if (!ref) return NextResponse.json({ ok: true })

  // Re-verify to be safe
  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${ref}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }, cache: 'no-store'
  })
  if (verifyRes.ok) {
    const body: any = await verifyRes.json()
    const amountKobo = body?.data?.amount ?? 0
    const nairaAmount = Math.round(amountKobo / 100)
    const currency = body?.data?.currency || 'NGN'
    const { data: existing } = await supabase.from('payments').select('*').eq('reference', ref).maybeSingle()
    if (existing) {
      await supabase.from('payments').update({ status, raw: body }).eq('id', existing.id)
    }
  }
  return NextResponse.json({ ok: true })
}

