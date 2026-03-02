'use server';

import { getServiceSupabase } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

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

    revalidatePath('/patient/payments');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
