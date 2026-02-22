import { ProfileUpdateInput, User } from "@/lib/types";
import { supabase } from "@/lib/supabase/client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const mapProfileUpdateToDbPayload = (data: ProfileUpdateInput): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};

  if (data.name !== undefined) payload.name = data.name;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.dob !== undefined) {
    payload.dob = data.dob === "" ? null : data.dob;
  }
  if (data.gender !== undefined) payload.gender = data.gender;
  if (data.bloodGroup !== undefined) payload.blood_group = data.bloodGroup;
  if (data.age !== undefined) payload.age = data.age;
  if (data.medicalHistory !== undefined) payload.medical_history = data.medicalHistory;
  if (data.emergencyContact !== undefined) payload.emergency_contact = data.emergencyContact;

  if (data.specialization !== undefined) payload.specialization = data.specialization;
  if (data.about !== undefined) payload.about = data.about;
  if (data.category !== undefined) payload.category = data.category;
  if (data.qualification !== undefined) payload.qualification = data.qualification;

  if (data.experience !== undefined) {
    const value = typeof data.experience === "string" ? parseInt(data.experience, 10) : data.experience;
    if (!Number.isNaN(value)) payload.experience = value;
  }

  if (data.fees !== undefined) {
    const value = typeof data.fees === "string" ? parseInt(data.fees, 10) : data.fees;
    if (!Number.isNaN(value)) payload.fees = value;
  }

  if (data.hospitalInfo !== undefined) payload.hospital_info = data.hospitalInfo;
  if (data.availabilityRange !== undefined) payload.availability_range = data.availabilityRange;
  if (data.dailyTimeRanges !== undefined) payload.daily_time_ranges = data.dailyTimeRanges;
  if (data.slotDurationMinutes !== undefined) payload.slot_duration_minutes = data.slotDurationMinutes;

  if (data.profileImage !== undefined) payload.profile_image = data.profileImage;
  if (data.isVerified !== undefined) payload.is_verified = data.isVerified;

  return payload;
};

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  //Actions
  setUser: (user: User) => void;
  clearError: () => void;
  logout: () => void;

  //Api Actions
  loginDoctor: (email: string, password: string) => Promise<void>;
  loginPatient: (email: string, password: string) => Promise<void>;
  registerDoctor: (data: { name: string; email: string; password: string }) => Promise<void>;
  registerPatient: (data: { name: string; email: string; password: string }) => Promise<void>;
  fetchProfile: () => Promise<User | null>;
  updateProfile: (data: ProfileUpdateInput) => Promise<void>;
}

export const userAuthStore = create<AuthState>()(
  persist((set, get) => ({
    user: null,
    token: null,
    loading: false,
    error: null,
    isAuthenticated: false,

    setUser: (user) => {
      set({
        user,
        token: null,
        isAuthenticated: true,
        error: null,
      });
    },
    clearError: () => set({ error: null }),

    logout: async () => {
      await supabase.auth.signOut();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      });
    },

    loginDoctor: async (email, password) => {
      set({ loading: true, error: null });
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const authUser = data.user;
        if (!authUser) throw new Error('Authentication failed');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
        if (profileError) throw profileError;
        const profileType = (profile?.type as 'doctor' | 'patient') || 'patient';
        const user: User = {
          id: authUser.id,
          name: profile?.name || '',
          email: authUser.email || '',
          type: profileType,
          phone: profile?.phone || undefined,
          profileImage: profile?.profile_image || undefined,
          isVerified: !!profile?.is_verified,
          isSuspended: !!profile?.is_suspended,
          isDeclined: !!profile?.is_declined,
          isBlocked: !!profile?.is_blocked,
          adminReviewNote: profile?.admin_review_note || undefined,
          dob: profile?.dob || undefined,
          gender: profile?.gender || undefined,
          bloodGroup: profile?.blood_group || undefined,
          age: profile?.age || undefined,
          medicalHistory: profile?.medical_history || undefined,
          emergencyContact: profile?.emergency_contact || undefined,
          specialization: profile?.specialization || undefined,
          about: profile?.about || undefined,
          category: profile?.category || undefined,
          qualification: profile?.qualification || undefined,
          experience: profile?.experience || undefined,
          fees: profile?.fees || undefined,
          hospitalInfo: profile?.hospital_info || undefined,
          availabilityRange: profile?.availability_range || undefined,
          dailyTimeRanges: profile?.daily_time_ranges || undefined,
          slotDurationMinutes: profile?.slot_duration_minutes || undefined,
        };
        get().setUser(user);
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      } finally {
        set({ loading: false });
      }
    },

    loginPatient: async (email, password) => {
      set({ loading: true, error: null });
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const authUser = data.user;
        if (!authUser) throw new Error('Authentication failed');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
        if (profileError) throw profileError;
        const profileType = (profile?.type as 'doctor' | 'patient') || 'patient';
        const user: User = {
          id: authUser.id,
          name: profile?.name || '',
          email: authUser.email || '',
          type: profileType,
          phone: profile?.phone || undefined,
          profileImage: profile?.profile_image || undefined,
          isVerified: !!profile?.is_verified,
          isSuspended: !!profile?.is_suspended,
          isDeclined: !!profile?.is_declined,
          isBlocked: !!profile?.is_blocked,
          adminReviewNote: profile?.admin_review_note || undefined,
          dob: profile?.dob || undefined,
          gender: profile?.gender || undefined,
          bloodGroup: profile?.blood_group || undefined,
          age: profile?.age || undefined,
          medicalHistory: profile?.medical_history || undefined,
          emergencyContact: profile?.emergency_contact || undefined,
          specialization: profile?.specialization || undefined,
          about: profile?.about || undefined,
          category: profile?.category || undefined,
          qualification: profile?.qualification || undefined,
          experience: profile?.experience || undefined,
          fees: profile?.fees || undefined,
          hospitalInfo: profile?.hospital_info || undefined,
          availabilityRange: profile?.availability_range || undefined,
          dailyTimeRanges: profile?.daily_time_ranges || undefined,
          slotDurationMinutes: profile?.slot_duration_minutes || undefined,
        };
        get().setUser(user);
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      } finally {
        set({ loading: false });
      }
    },

    registerDoctor: async (data) => {
      set({ loading: true, error: null });
      try {
        const { data: signUp, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: { data: { type: 'doctor', name: data.name } },
        });
        if (error) throw error;
        const userId = signUp.user?.id;
        if (!userId) throw new Error('Signup failed');
        const { error: upsertError } = await supabase.from('profiles').upsert({
          id: userId,
          email: data.email,
          name: data.name,
          type: 'doctor',
        });
        if (upsertError) throw upsertError;
        await get().fetchProfile();
        try {
          await fetch('/api/admin/activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'signup', payload: { userId } }),
          });
        } catch {
        }
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      } finally {
        set({ loading: false });
      }
    },

    registerPatient: async (data) => {
      set({ loading: true, error: null });
      try {
        const { data: signUp, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: { data: { type: 'patient', name: data.name } },
        });
        if (error) throw error;
        const userId = signUp.user?.id;
        if (!userId) throw new Error('Signup failed');
        const { error: upsertError } = await supabase.from('profiles').upsert({
          id: userId,
          email: data.email,
          name: data.name,
          type: 'patient',
        });
        if (upsertError) throw upsertError;
        await get().fetchProfile();
        try {
          await fetch('/api/admin/activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'signup', payload: { userId } }),
          });
        } catch {
        }
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      } finally {
        set({ loading: false });
      }
    },


    fetchProfile : async() : Promise<User | null> => {
        set({ loading: true, error: null });
        try {
            const { data: session } = await supabase.auth.getUser();
            const authUser = session.user;
            if(!authUser) return null;
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', authUser.id)
              .single();
            if (profileError) throw profileError;
            const user: User = {
              id: authUser.id,
              name: profile?.name || '',
              email: authUser.email || '',
              type: (profile?.type as 'doctor' | 'patient') || 'patient',
              phone: profile?.phone || undefined,
              profileImage: profile?.profile_image || undefined,
              isVerified: !!profile?.is_verified,
              isSuspended: !!profile?.is_suspended,
              isDeclined: !!profile?.is_declined,
              adminReviewNote: profile?.admin_review_note || undefined,
              dob: profile?.dob || undefined,
              gender: profile?.gender || undefined,
              bloodGroup: profile?.blood_group || undefined,
              age: profile?.age || undefined,
              medicalHistory: profile?.medical_history || undefined,
              emergencyContact: profile?.emergency_contact || undefined,
              specialization: profile?.specialization || undefined,
              about: profile?.about || undefined,
              category: profile?.category || undefined,
              qualification: profile?.qualification || undefined,
              experience: profile?.experience || undefined,
              fees: profile?.fees || undefined,
              hospitalInfo: profile?.hospital_info || undefined,
              availabilityRange: profile?.availability_range || undefined,
              dailyTimeRanges: profile?.daily_time_ranges || undefined,
              slotDurationMinutes: profile?.slot_duration_minutes || undefined,
            };
            set({user, isAuthenticated: true});
            return user;
        } catch (error:any) {
             set({ error: error.message });
             return null;
        } finally {
            set({ loading: false });
        }
    },


    updateProfile :async(data) => {
        set({loading:true,error:null});
        try {
            const { user } = get();
            if(!user) throw new Error("No user found");
            const payload = mapProfileUpdateToDbPayload(data);
            const { data: updated, error: updateError } = await supabase
              .from('profiles')
              .update(payload)
              .eq('id', user.id)
              .select('*')
              .single();
            if (updateError) throw updateError;
            const merged: User = { ...user, ...{
              name: updated?.name ?? user.name,
              phone: updated?.phone ?? user.phone,
              profileImage: updated?.profile_image ?? user.profileImage,
              isVerified: updated?.is_verified ?? user.isVerified,
              dob: updated?.dob ?? user.dob,
              gender: updated?.gender ?? user.gender,
              bloodGroup: updated?.blood_group ?? user.bloodGroup,
              age: updated?.age ?? user.age,
              medicalHistory: updated?.medical_history ?? user.medicalHistory,
              emergencyContact: updated?.emergency_contact ?? user.emergencyContact,
              specialization: updated?.specialization ?? user.specialization,
              about: updated?.about ?? user.about,
              category: updated?.category ?? user.category,
              qualification: updated?.qualification ?? user.qualification,
              experience: updated?.experience ?? user.experience,
              fees: updated?.fees ?? user.fees,
              hospitalInfo: updated?.hospital_info ?? user.hospitalInfo,
              availabilityRange: updated?.availability_range ?? user.availabilityRange,
              dailyTimeRanges: updated?.daily_time_ranges ?? user.dailyTimeRanges,
              slotDurationMinutes: updated?.slot_duration_minutes ?? user.slotDurationMinutes,
              isSuspended: updated?.is_suspended ?? user.isSuspended,
              isDeclined: updated?.is_declined ?? user.isDeclined,
              adminReviewNote: updated?.admin_review_note ?? user.adminReviewNote,
            }}
            set({user: merged})
        } catch (error:any) {
             set({ error: error.message });
              throw error;
        } finally {
            set({ loading: false });
        }
    }
   }),{
    name:"auth-storage", 
    partialize: (state) => ({
        user:state.user,
        token:state.token,
        isAuthenticated:state.isAuthenticated
    })
   })
);
