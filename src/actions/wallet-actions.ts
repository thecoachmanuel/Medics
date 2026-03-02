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
  
  try {
    const { error } = await supabase.rpc('fund_wallet', {
      p_user_id: userId,
      p_amount: amount,
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
    revalidatePath(`/patient/booking/${appointmentId}`); // This might need adjustment based on actual route
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
