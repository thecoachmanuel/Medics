import { Payment, PaymentFilters, PaymentStatus } from "@/lib/types";
import { supabase } from "@/lib/supabase/client";
import { create } from "zustand";

interface PaymentState {
  payments: Payment[];
  loading: boolean;
  error: string | null;
  total: number;

  clearError: () => void;
  fetchPayments: (
    role: "doctor" | "patient",
    filters?: PaymentFilters
  ) => Promise<void>;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  payments: [],
  loading: false,
  error: null,
  total: 0,

  clearError: () => set({ error: null }),

  fetchPayments: async (role, filters = {}) => {
    set({ loading: true, error: null });
    try {
      const { data: session } = await supabase.auth.getUser();
      const uid = session.user?.id;
      if (!uid) throw new Error("Not authenticated");
      let query = supabase.from("payments").select("*");
      if (role === "doctor") query = query.eq("doctor_id", uid);
      else query = query.eq("patient_id", uid);
      if (filters.from) query = query.gte("created_at", filters.from);
      if (filters.to) query = query.lte("created_at", filters.to);
      if (filters.status)
        query = Array.isArray(filters.status)
          ? query.in("status", filters.status as PaymentStatus[])
          : query.eq("status", filters.status as PaymentStatus);
      if (filters.search)
        query = query.ilike("reference", `%${filters.search}%`);
      if (filters.sortBy)
        query = query.order(filters.sortBy, {
          ascending: filters.sortOrder !== "desc",
        });
      const { data, error } = await query;
      if (error) throw error;
      const payments: Payment[] = (data || []).map((p: any) => ({
        id: p.id,
        appointmentId: p.appointment_id,
        doctorId: p.doctor_id,
        patientId: p.patient_id,
        amount: p.amount,
        currency: p.currency || "NGN",
        status: p.status,
        provider: "paystack",
        reference: p.reference || undefined,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        consultationFee: p.consultation_fee,
        commissionAmount: p.commission_amount,
      }));
      set({ payments, total: payments.length });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
}));

