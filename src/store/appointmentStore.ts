import { supabase } from "@/lib/supabase/client";
import { create } from "zustand";

export interface Appointment {
  _id: string;
  doctorId: any;
  patientId: any;
  date: string;
  slotStartIso: string;
  slotEndIso: string;
  consultationType: "Video Consultation" | "Voice Call";
  status: "Scheduled" | "Completed" | "Cancelled" | "In Progress";
  symptoms: string;
  zegoRoomId: string;
  fees: number;
  prescription?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  paymentStatus?: 'success' | 'pending' | 'failed' | 'refunded' | 'initiated';
  paidAmount?: number;
}

interface AppointmentFilters {
  status?: string | string[];
  from?: string;
  to?: string;
  date?: string;
  sortBy?: "date" | "createdAt" | "status";
  sortOrder?: "asc" | "desc";
}

interface BookingData {
  doctorId: string;
  slotStartIso: string;
  slotEndIso: string;
  consultationType?: string;
  symptoms: string;
  date: string;
  consultationFees: number;
  platformFees: number;
  totalAmount: number;
}

interface AppointmentState {
  appointments: Appointment[];
  bookedSlots: string[];
  currentAppointment: Appointment | null;
  loading: boolean;
  error: string | null;

  //Actions
  clearError: () => void;
  setCurrentAppointment: (appointment: Appointment) => void;

  //Api Actions
  fetchAppointments: (
    role: "doctor" | "patient",
    tab?: string,
    filters?: AppointmentFilters
  ) => Promise<void>;
  fetchBookedSlots: (doctorId: string, date: string) => Promise<void>;
  fetchAppointmentById: (appointmentId: string) => Promise<Appointment | null>;
  bookAppointment: (data: BookingData) => Promise<any>;
  joinConsultation: (appointmentId: string) => Promise<any>;
  endConsultation: (
    appointmentId: string,
    prescription?: string,
    notes?: string
  ) => Promise<void>;
  updateAppointmentStatus: (
    appointmentId: string,
    status: string
  ) => Promise<void>;
}

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: [],
  bookedSlots: [],
  currentAppointment: null,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  setCurrentAppointment: (appointment) =>
    set({ currentAppointment: appointment }),

  fetchAppointments: async (role, tab = "", filters = {}) => {
    set({ loading: true, error: null });
    try {
      const { data: session } = await supabase.auth.getUser();
      const uid = session.user?.id;
      if (!uid) throw new Error('Not authenticated');
      let query = supabase.from('appointments').select('*');
      if (role === 'doctor') {
        query = query.eq('doctor_id', uid);
      } else {
        query = query.eq('patient_id', uid);
      }
      if (tab === 'upcoming') {
        query = query.in('status', ['Scheduled','In Progress']);
      } else if (tab === 'past') {
        query = query.in('status', ['Completed','Cancelled']);
      }
      if (filters.from) query = query.gte('slot_start_iso', filters.from);
      if (filters.to) query = query.lte('slot_start_iso', filters.to);
      if (filters.status) query = Array.isArray(filters.status) ? query.in('status', filters.status as string[]) : query.eq('status', filters.status as string);
      if (filters.sortBy) query = query.order(filters.sortBy, { ascending: filters.sortOrder !== 'desc' });
      const { data, error } = await query;
      if (error) throw error;
      const rows = data || [];
      const aptIds: string[] = rows.map((r: any) => r.id);
      type PayRow = { appointment_id: string; status: 'success'|'pending'|'failed'|'refunded'|'initiated'; amount: number };
      const { data: pays } = aptIds.length
        ? await supabase.from('payments').select('appointment_id,status,amount').in('appointment_id', aptIds)
        : { data: [], error: null } as any;
      const payMap: Map<string, PayRow> = new Map((pays as PayRow[] || []).map((p) => [p.appointment_id, p]));
      const docIds = Array.from(new Set(rows.map((r: any) => r.doctor_id)));
      const patIds = Array.from(new Set(rows.map((r: any) => r.patient_id)));
      const { data: docs } = await supabase.from('profiles').select('*').in('id', docIds);
      const { data: pats } = await supabase.from('profiles').select('*').in('id', patIds);
      const toPerson = (p: any) => p ? {
        _id: p.id,
        name: p.name,
        email: p.email,
        profileImage: p.profile_image,
        hospitalInfo: p.hospital_info,
        specialization: p.specialization,
      } : undefined;
      const docMap = new Map((docs || []).map((d: any) => [d.id, toPerson(d)]));
      const patMap = new Map((pats || []).map((p: any) => [p.id, toPerson(p)]));
      const appointments = rows.map((r: any) => {
        const p = payMap.get(r.id);
        return {
        _id: r.id,
        doctorId: docMap.get(r.doctor_id) || { _id: r.doctor_id },
        patientId: patMap.get(r.patient_id) || { _id: r.patient_id },
        date: r.date,
        slotStartIso: r.slot_start_iso,
        slotEndIso: r.slot_end_iso,
        consultationType: r.consultation_type,
        status: r.status,
        symptoms: r.symptoms,
        zegoRoomId: r.zego_room_id,
        fees: r.fees,
        prescription: r.prescription || undefined,
        notes: r.notes || undefined,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        paymentStatus: p ? p.status : undefined,
        paidAmount: p ? p.amount : undefined,
      } as Appointment});
      set({ appointments });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchAppointmentById: async (appointmentId) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.from('appointments').select('*').eq('id', appointmentId).single();
      if (error) throw error;
      const r: any = data;
      const { data: doc } = await supabase.from('profiles').select('*').eq('id', r.doctor_id).single();
      const { data: pat } = await supabase.from('profiles').select('*').eq('id', r.patient_id).single();
      const toPerson = (p: any) => p ? {
        _id: p.id,
        name: p.name,
        email: p.email,
        profileImage: p.profile_image,
        hospitalInfo: p.hospital_info,
        specialization: p.specialization,
      } : undefined;
      const { data: pay } = await supabase.from('payments').select('status,amount').eq('appointment_id', r.id).maybeSingle();
      const apt = {
        _id: r.id,
        doctorId: toPerson(doc) || { _id: r.doctor_id },
        patientId: toPerson(pat) || { _id: r.patient_id },
        date: r.date,
        slotStartIso: r.slot_start_iso,
        slotEndIso: r.slot_end_iso,
        consultationType: r.consultation_type,
        status: r.status,
        symptoms: r.symptoms,
        zegoRoomId: r.zego_room_id,
        fees: r.fees,
        prescription: r.prescription || undefined,
        notes: r.notes || undefined,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        paymentStatus: (pay?.status as Appointment['paymentStatus']) || undefined,
        paidAmount: (pay?.amount as number | undefined),
      } as any;
      set({ currentAppointment: apt });
      return apt;
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchBookedSlots: async (doctorId, date) => {
    set({ loading: true, error: null });
    try {
      const rpc = await supabase.rpc("get_doctor_booked_slots", {
        p_doctor_id: doctorId,
        p_date: date,
      });

      if (!rpc.error) {
        const slots = (rpc.data || []).map((r: any) => r.slot_start_iso ?? r);
        set({ bookedSlots: slots });
        return;
      }

      const rpcMessage = String((rpc.error as any)?.message || "");
      const isMissingRpc = rpcMessage.toLowerCase().includes("could not find the function") || rpcMessage.toLowerCase().includes("function") && rpcMessage.toLowerCase().includes("does not exist");
      if (!isMissingRpc) throw rpc.error;

      const { data, error } = await supabase
        .from('appointments')
        .select('slot_start_iso')
        .eq('doctor_id', doctorId)
        .eq('date', date)
        .in('status', ['Scheduled','In Progress']);
      if (error) throw error;
      const slots = (data || []).map((d: any) => d.slot_start_iso);
      set({ bookedSlots: slots });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  bookAppointment: async (data) => {
    set({ loading: true, error: null });
    try {
      const { data: session } = await supabase.auth.getUser();
      const uid = session.user?.id;
      if (!uid) throw new Error('Not authenticated');
      const payload = {
        doctor_id: data.doctorId,
        patient_id: uid,
        date: data.date,
        slot_start_iso: data.slotStartIso,
        slot_end_iso: data.slotEndIso,
        consultation_type: data.consultationType || 'Video Consultation',
        symptoms: data.symptoms,
        status: 'Scheduled',
        zego_room_id: crypto.randomUUID(),
        fees: data.totalAmount,
      };
      const { data: inserted, error } = await supabase.from('appointments').insert(payload).select('*').single();
      if (error) throw error;
      const apt = {
        _id: inserted.id,
        doctorId: inserted.doctor_id,
        patientId: inserted.patient_id,
        date: inserted.date,
        slotStartIso: inserted.slot_start_iso,
        slotEndIso: inserted.slot_end_iso,
        consultationType: inserted.consultation_type,
        status: inserted.status,
        symptoms: inserted.symptoms,
        zegoRoomId: inserted.zego_room_id,
        fees: inserted.fees,
        createdAt: inserted.created_at,
        updatedAt: inserted.updated_at,
      } as any;
      set((state) => ({ appointments: [apt, ...state.appointments] }));
      return apt;
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  joinConsultation: async (appointmentId) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status: 'In Progress' })
        .eq('id', appointmentId)
        .select('*')
        .single();
      if (error) throw error;
      set((state) => ({
        appointments: state.appointments.map((apt) =>
          apt._id === appointmentId
            ? { ...apt, status: "In Progress" as const }
            : apt
        ),
        currentAppointment:
          state.currentAppointment?._id === appointmentId
            ? { ...state.currentAppointment, status: "In Progress" as const }
            : state.currentAppointment,
      }));
      return data;
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  endConsultation: async (appointmentId, prescription, notes) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status: 'Completed', prescription, notes })
        .eq('id', appointmentId)
        .select('*')
        .single();
      if (error) throw error;
      set((state) => ({
        appointments: state.appointments.map((apt) =>
          apt._id === appointmentId
            ? { ...apt, status: "Completed" as const }
            : apt
        ),
        currentAppointment:
          state.currentAppointment?._id === appointmentId
            ? { ...state.currentAppointment, status: "Completed" as const }
            : state.currentAppointment,
      }));
      return data;
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  updateAppointmentStatus: async (appointmentId, status) => {
     set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId)
        .select('*')
        .single();
      if (error) throw error;
      set((state) => ({
        appointments: state.appointments.map((apt) =>
          apt._id === appointmentId
            ? { ...apt, status: status as any }
            : apt
        ),
        currentAppointment:
          state.currentAppointment?._id === appointmentId
            ? { ...state.currentAppointment, status: status as any}
            : state.currentAppointment,
      }));
      return data;
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
}));
