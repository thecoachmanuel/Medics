import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/service';

export async function GET() {
  const supabase = getServiceSupabase();
  
  // Try to insert a mock appointment for Video Call
  const { error: e1 } = await supabase.from('appointments').insert({
    patient_id: '123e4567-e89b-12d3-a456-426614174000',
    doctor_id: '123e4567-e89b-12d3-a456-426614174000',
    date: '2026-03-22',
    slot_start_iso: '2026-03-22T10:00:00.000Z',
    slot_end_iso: '2026-03-22T10:30:00.000Z',
    consultation_type: 'Video Consultation',
    symptoms: 'Test',
    status: 'Scheduled',
    fees: 1000
  });

  const { error: e2 } = await supabase.from('appointments').insert({
    patient_id: '123e4567-e89b-12d3-a456-426614174000',
    doctor_id: '123e4567-e89b-12d3-a456-426614174000',
    date: '2026-03-22',
    slot_start_iso: '2026-03-22T10:00:00.000Z',
    slot_end_iso: '2026-03-22T10:30:00.000Z',
    consultation_type: 'Messaging',
    symptoms: 'Test',
    status: 'Scheduled',
    fees: 1000
  });

  const { error: e3 } = await supabase.from('appointments').insert({
    patient_id: '123e4567-e89b-12d3-a456-426614174000',
    doctor_id: '123e4567-e89b-12d3-a456-426614174000',
    date: '2026-03-22',
    slot_start_iso: '2026-03-22T10:00:00.000Z',
    slot_end_iso: '2026-03-22T10:30:00.000Z',
    consultation_type: 'Video Call',
    symptoms: 'Test',
    status: 'Scheduled',
    fees: 1000
  });

  return NextResponse.json({
     video_consultation: e1 || 'Success',
     messaging: e2 || 'Success',
     video_call: e3 || 'Success'
  });
}
