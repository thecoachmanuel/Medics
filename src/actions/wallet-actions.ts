'use server';

import { getServiceSupabase } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { sendTransactionalTemplate } from "@/lib/email/mailer";
import { formatDateTimeNG } from "@/lib/datetime";

export async function getWalletBalance(userId: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('wallets')
    .select('balance, currency')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    return { success: false, error: error.message };
  }
  
  return { success: true, balance: data?.balance || 0, currency: data?.currency || 'NGN' };
}

export async function getWalletTransactions(userId: string) {
  const supabase = getServiceSupabase();
  // First get wallet id
  const { data: wallet } = await supabase
    .from('wallets')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!wallet) return { success: true, transactions: [] };

  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('wallet_id', wallet.id)
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: error.message };
  
  return { success: true, transactions: data };
}

export async function fundWallet(userId: string, amount: number, reference: string) {
  const supabase = getServiceSupabase();
  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

  if (!PAYSTACK_SECRET) {
    return { success: false, error: "Payment configuration error" };
  }
  
  try {
    // Verify transaction with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      cache: 'no-store'
    });

    if (!verifyRes.ok) {
      return { success: false, error: "Payment verification failed" };
    }

    const verifyData = await verifyRes.json();
    
    if (verifyData.data.status !== 'success') {
      return { success: false, error: `Payment status: ${verifyData.data.status}` };
    }

    // Verify amount (Paystack returns amount in kobo)
    const verifiedAmount = verifyData.data.amount / 100;
    if (verifiedAmount < amount) {
       return { success: false, error: "Payment amount mismatch" };
    }

    // Check if transaction already processed (idempotency)
    const { data: existingTx } = await supabase
      .from('wallet_transactions')
      .select('id')
      .eq('reference', reference)
      .single();

    if (existingTx) {
       return { success: true, message: "Transaction already processed" };
    }

    const { error } = await supabase.rpc('fund_wallet', {
      p_user_id: userId,
      p_amount: verifiedAmount, // Use verified amount
      p_reference: reference
    });

    if (error) throw error;
    
    // Send notifications for wallet funding
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', userId)
        .single();
        
      const patientName = profile?.name || 'User';
      const formattedAmount = `₦${amount.toLocaleString('en-NG')}`;

      // Notification for patient
      await supabase.from('notifications').insert({
        user_id: userId,
        role: 'patient',
        title: 'Wallet Funded',
        message: `Your wallet has been funded with ${formattedAmount}.`,
        type: 'wallet_funding',
      });

      // Notification for admin
      await supabase.from('notifications').insert({
        user_id: null,
        role: 'admin',
        title: 'Wallet Funded',
        message: `${patientName} funded their wallet with ${formattedAmount}.`,
        type: 'wallet_funding',
      });
    } catch (err) {
      console.error('Error sending funding notifications:', err);
    }

    revalidatePath('/patient/payments');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function payWithWallet(appointmentId: string, userId: string, amount: number) {
  const supabase = getServiceSupabase();
  
  try {
    const { data, error } = await supabase.rpc('pay_appointment_via_wallet', {
      p_appointment_id: appointmentId,
      p_user_id: userId,
      p_amount: amount
    });

    if (error) throw error;
    if (!data) return { success: false, error: "Insufficient balance or invalid appointment" };

    // Send notifications and emails
    try {
      const { data: appointment } = await supabase
        .from('appointments')
        .select(`
          *,
          doctor:profiles!appointments_doctor_id_fkey(name, email),
          patient:profiles!appointments_patient_id_fkey(name, email)
        `)
        .eq('id', appointmentId)
        .single();
        
      if (appointment) {
        // @ts-ignore
        const doctorName = appointment.doctor?.name || 'Doctor';
        // @ts-ignore
        const doctorEmail = appointment.doctor?.email;
        // @ts-ignore
        const patientName = appointment.patient?.name || 'Patient';
        // @ts-ignore
        const patientEmail = appointment.patient?.email;
        const adminEmail = process.env.NEXT_ADMIN_EMAIL;

        const slotStart = appointment.slot_start_iso;
        const whenText = slotStart ? formatDateTimeNG(slotStart, { hour12: true }) : (appointment.date || 'your scheduled time');
        const formattedAmount = `₦${amount.toLocaleString('en-NG')}`;

        const notifications = [
          {
            user_id: appointment.patient_id,
            role: 'patient',
            title: 'Payment Confirmed',
            message: `Your payment of ${formattedAmount} for appointment with ${doctorName} on ${whenText} was successful.`,
            type: 'appointment_payment'
          },
          {
            user_id: appointment.doctor_id,
            role: 'doctor',
            title: 'New Appointment Booked',
            message: `${patientName} has booked an appointment with you for ${whenText}.`,
            type: 'appointment_payment'
          },
          {
            user_id: null,
            role: 'admin',
            title: 'New Wallet Payment',
            message: `${patientName} paid ${formattedAmount} via Wallet for ${doctorName} on ${whenText}.`,
            type: 'appointment_payment'
          }
        ];

        await supabase.from('notifications').insert(notifications);

        if (patientEmail) {
          await sendTransactionalTemplate('payment_patient', patientEmail, {
            doctorName,
            when: whenText,
            amount: String(amount),
            currency: 'NGN',
            patientName,
          });
        }

        if (doctorEmail) {
          await sendTransactionalTemplate('payment_doctor', doctorEmail, {
            doctorName,
            when: whenText,
            amount: String(amount),
            currency: 'NGN',
            patientName,
          });
        }

        if (adminEmail) {
          await sendTransactionalTemplate('payment_admin', adminEmail, {
            doctorName,
            when: whenText,
            amount: String(amount),
            currency: 'NGN',
            patientName,
          });
        }
      }
    } catch (err) {
      console.error('Error sending wallet payment notifications:', err);
    }

    revalidatePath('/patient/payments');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
