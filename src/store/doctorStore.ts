import { Doctor, DoctorFilters, User } from "@/lib/types";
import { supabase } from "@/lib/supabase/client";
import { create } from "zustand";

interface DoctorState {
  doctors: Doctor[];
  currentDoctor: Doctor | null;
  dashboard: any;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };

  //Action
  clearError: () => void;
  setCurrentDoctor: (doctor: Doctor) => void;

  //Api Action
  fetchDoctors: (filters: DoctorFilters) => Promise<void>;
  fetchDoctorById: (id: string) => Promise<void>;
  fetchDashboard: (period?:string) => Promise<void>
}

export const useDoctorStore = create<DoctorState>((set, get) => ({
  doctors: [],
  currentDoctor: null,
  dashboard: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
  },
  clearError: () => set({ error: null }),

  setCurrentDoctor: (doctor) => set({ currentDoctor: doctor }),
  fetchDoctors: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      let query = supabase.from('profiles').select('*', { count: 'exact' }).eq('type','doctor');
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }
      if (filters.specialization) {
        query = query.eq('specialization', filters.specialization);
      }
      if (filters.category) {
        query = query.contains('category', [filters.category]);
      }
      if (filters.city) {
        query = query.eq('hospital_info->>city', filters.city);
      }
      if (filters.minFees) {
        query = query.gte('fees', filters.minFees);
      }
      if (filters.maxFees) {
        query = query.lte('fees', filters.maxFees);
      }
      if (filters.sortBy) {
        query = query.order(filters.sortBy, { ascending: filters.sortOrder !== 'desc' });
      }
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      const { data, error, count } = await query.range(from, to);
      if (error) throw error;
      const doctors: Doctor[] = (data || []).map((d: any) => ({
        _id: d.id,
        name: d.name,
        email: d.email,
        specialization: d.specialization,
        category: d.category || [],
        qualification: d.qualification,
        experience: d.experience,
        about: d.about,
        fees: d.fees,
        hospitalInfo: d.hospital_info || { name: '', address: '', city: '' },
        availabilityRange: d.availability_range || undefined,
        dailyTimeRanges: d.daily_time_ranges || [],
        slotDurationMinutes: d.slot_duration_minutes || 30,
        profileImage: d.profile_image || '',
        isVerified: !!d.is_verified,
        createdAt: new Date(d.created_at),
        updatedAt: new Date(d.updated_at),
      }));
      set({
        doctors,
        pagination: {
          page,
          limit,
          total: count || doctors.length,
        },
      });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchDoctorById: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (error) throw error;
      const d = data as any;
      const doctor: Doctor = {
        _id: d.id,
        name: d.name,
        email: d.email,
        specialization: d.specialization,
        category: d.category || [],
        qualification: d.qualification,
        experience: d.experience,
        about: d.about,
        fees: d.fees,
        hospitalInfo: d.hospital_info || { name: '', address: '', city: '' },
        availabilityRange: d.availability_range || undefined,
        dailyTimeRanges: d.daily_time_ranges || [],
        slotDurationMinutes: d.slot_duration_minutes || 30,
        profileImage: d.profile_image || '',
        isVerified: !!d.is_verified,
        createdAt: new Date(d.created_at),
        updatedAt: new Date(d.updated_at),
      };
      set({ currentDoctor: doctor });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },


    fetchDashboard: async () => {
    set({ loading: true, error: null });
    try {
      const { data: session } = await supabase.auth.getUser();
      const uid = session.user?.id;
      if (!uid) throw new Error('Not authenticated');
      const { data: doc, error: docErr } = await supabase.from('profiles').select('*').eq('id', uid).single();
      if (docErr) throw docErr;
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const end = new Date(start); end.setDate(end.getDate() + 1);
      const { data: todays, error: todayErr } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', uid)
        .gte('slot_start_iso', start.toISOString())
        .lt('slot_start_iso', end.toISOString());
      if (todayErr) throw todayErr;
      const { data: paidRows, error: payErr } = await supabase
        .from('payments')
        .select('amount')
        .eq('doctor_id', uid)
        .eq('status', 'success');
      if (payErr) throw payErr;
      const { data: patients, error: patErr } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('doctor_id', uid);
      if (patErr) throw patErr;
      const { data: completedRows, error: compErr } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', uid)
        .eq('status', 'Completed');
      if (compErr) throw compErr;
      const totalRevenue = (paidRows || []).reduce((s, r: any) => s + (r.amount || 0), 0);
      const uniquePatients = new Set((patients || []).map((p: any) => p.patient_id)).size;
      const dashboard = {
        user: {
          name: doc?.name,
          profileImage: doc?.profile_image,
          specialization: doc?.specialization,
          hospitalInfo: doc?.hospital_info,
        },
        stats: {
          totalPatients: uniquePatients,
          todayAppointments: (todays || []).length,
          totalRevenue,
          completedAppointments: (completedRows || []).length,
          averageRating: 5,
        },
      };
      set({ dashboard });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  
}));
