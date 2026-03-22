import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '/Users/admin/Documents/Medics-main/.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { error: e1 } = await supabase.from('appointments').insert({
    patient_id: '123e4567-e89b-12d3-a456-426614174000', // valid uuid? Supabase might reject FK constraint. We don't care, we just want to see if the ENUM fails first. Wait, let's omit them so it fails on NOT NULL instead, or use a valid type.
    // Actually just update an existing row's type, or check schema
  }).select('*');
  
  // A better way is to query information schema using REST or rpc if available. No, just insert and look at error message.
  const payload = {
    patient_id: '123e4567-e89b-12d3-a456-426614174000',
    doctor_id: '123e4567-e89b-12d3-a456-426614174000',
    date: '2026-03-22',
    slot_start_iso: '2026-03-22T10:00:00.000Z',
    slot_end_iso: '2026-03-22T10:30:00.000Z',
    symptoms: 'Test',
    status: 'Scheduled',
    fees: 1000,
    stream_call_id: '123'
  };

  const { error: e11 } = await supabase.from('appointments').insert({...payload, consultation_type: 'Video Consultation'});
  console.log("VC:", e11?.message);
  
  const { error: e2 } = await supabase.from('appointments').insert({...payload, consultation_type: 'Video Call'});
  console.log("VCall:", e2?.message);

  const { error: e3 } = await supabase.from('appointments').insert({...payload, consultation_type: 'Messaging'});
  console.log("Msg:", e3?.message);
  
}
run();
