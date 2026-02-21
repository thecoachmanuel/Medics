import { NextResponse } from 'next/server'
import crypto from 'crypto'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase/service'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY as string | undefined

export async function POST(request: Request) {
  if (!PAYSTACK_SECRET) {
    return NextResponse.json({ error: 'Missing Paystack secret' }, { status: 500 })
  }
  const { reference, appointmentId } = await request.json().catch(() => ({})) as {
    reference?: string; appointmentId?: string
  }
  if (!reference || !appointmentId) {
    return NextResponse.json({ error: 'reference and appointmentId required' }, { status: 400 })
  }

  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    cache: 'no-store',
  })
  if (!verifyRes.ok) {
    const txt = await verifyRes.text()
    return NextResponse.json({ error: 'Verification failed', detail: txt }, { status: 502 })
  }
  const verifyJson: any = await verifyRes.json()
  const status = verifyJson?.data?.status
  const amount = verifyJson?.data?.amount // kobo
  const currency = verifyJson?.data?.currency || 'NGN'
  const raw = verifyJson
  if (status !== 'success') {
    return NextResponse.json({ error: 'Transaction not successful', detail: verifyJson }, { status: 400 })
  }

  const supabase = getServiceSupabase()

  const { data: appointment, error: aptErr } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .single()
  if (aptErr || !appointment) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
  }

  const nairaAmount = Math.round((amount ?? 0) / 100)
  const expectedAmount = Number(appointment.fees ?? 0)
  if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
    return NextResponse.json({ error: 'Invalid appointment amount' }, { status: 400 })
  }
  if (nairaAmount !== expectedAmount || currency !== 'NGN') {
    return NextResponse.json({ error: 'Amount or currency mismatch' }, { status: 400 })
  }

  const paymentRow = {
    appointment_id: appointment.id,
    doctor_id: appointment.doctor_id,
    patient_id: appointment.patient_id,
    amount: nairaAmount,
    currency,
    status: 'success',
    provider: 'paystack',
    reference,
    raw,
  }

  const { data: existing } = await supabase
    .from('payments')
    .select('id')
    .eq('reference', reference)
    .maybeSingle()
  if (!existing) {
    await supabase.from('payments').insert(paymentRow)
  }

  return NextResponse.json({ success: true, data: { appointmentId, reference, amount: nairaAmount, currency } })
}
