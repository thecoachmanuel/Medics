import { Doctor, DoctorFilters } from "@/lib/types";
import { supabase } from "@/lib/supabase/client";
import { create } from "zustand";
import { toLocalYMD } from "@/lib/dateUtils";

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
  fetchDashboard: () => Promise<void>
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
      let query = supabase.from('profiles').select('*', { count: 'exact' }).eq('type', 'doctor');
      if (!filters.includeUnverified) {
        query = query.eq('is_verified', true).eq('is_suspended', false);
      }
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
        isSuspended: !!d.is_suspended,
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      const d = data as any;

      const { data: ratingRows } = await supabase
        .from('doctor_ratings')
        .select('rating,comment,created_at,patient_id')
        .eq('doctor_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      const ratings =
        (ratingRows as { rating: number | null; comment: string | null; created_at: string; patient_id: string }[] | null) ||
        [];

      const numericRatings = ratings
        .map((r) => r.rating)
        .filter((v): v is number => typeof v === 'number');

      const averageRating =
        numericRatings.length > 0
          ? numericRatings.reduce((sum, v) => sum + v, 0) / numericRatings.length
          : undefined;

      const patientIds = Array.from(
        new Set(ratings.map((r) => r.patient_id).filter((pid) => typeof pid === 'string' && pid.length > 0))
      );

      const { data: patientProfiles } = patientIds.length
        ? await supabase.from('profiles').select('id,name').in('id', patientIds)
        : { data: [] as any[] } as any;

      const patientNameMap = new Map(
        ((patientProfiles as { id: string; name: string | null }[]) || []).map((p) => [p.id, p.name || 'Patient'])
      );

      const reviews = ratings.map((r) => ({
        rating: (typeof r.rating === 'number' ? r.rating : 0) as number,
        comment: r.comment,
        createdAt: r.created_at,
        patientName: patientNameMap.get(r.patient_id) || 'Patient',
      }));

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
        isSuspended: !!d.is_suspended,
        createdAt: new Date(d.created_at),
        updatedAt: new Date(d.updated_at),
        averageRating,
        totalReviews: ratings.length,
        reviews,
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
      const now = new Date();
      const todayYmd = toLocalYMD(now);

      const { data: allAppointments, error: allErr } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', uid);
      if (allErr) throw allErr;

      const { data: paidRows, error: payErr } = await supabase
        .from('payments')
        .select('amount,created_at')
        .eq('doctor_id', uid)
        .eq('status', 'success');
      if (payErr) throw payErr;

      const { data: allPays } = await supabase
        .from('payments')
        .select('appointment_id,status,amount')
        .eq('doctor_id', uid)
        .eq('status', 'success');

      type PayRow = { appointment_id: string; status: string; amount: number };
      const payMap: Map<string, PayRow> = new Map(
        ((allPays as PayRow[]) || []).map((p) => [p.appointment_id, p])
      );

      const allRows = (allAppointments || []) as any[];
      const paidAppointments = allRows.filter((r) => payMap.has(r.id));

      const todayRows = paidAppointments.filter((r) => r.date === todayYmd);

      const thisYear = now.getFullYear();
      const lastYear = thisYear - 1;

      const upcomingRows = paidAppointments
        .filter((r) => {
          const startIso = r.slot_start_iso as string;
          if (!startIso) return false;
          const startDate = new Date(startIso);
          if (Number.isNaN(startDate.getTime())) return false;
          return (
            startDate.getTime() >= now.getTime() &&
            (r.status === 'Scheduled' || r.status === 'In Progress')
          );
        })
        .sort((a, b) => {
          const aTime = new Date(a.slot_start_iso).getTime();
          const bTime = new Date(b.slot_start_iso).getTime();
          return aTime - bTime;
        })
        .slice(0, 5);

      const patientIds = Array.from(
        new Set(
          paidAppointments.map((r) => r.patient_id as string)
        )
      );

      const { data: pats } = patientIds.length
        ? await supabase.from('profiles').select('*').in('id', patientIds)
        : { data: [] as any[] } as any;

      const toPerson = (p: any) =>
        p
          ? {
              _id: p.id,
              name: p.name,
              email: p.email,
              profileImage: p.profile_image,
              hospitalInfo: p.hospital_info,
              specialization: p.specialization,
              age: p.age,
            }
          : undefined;

      const patMap = new Map(
        ((pats as any[]) || []).map((p: any) => [p.id, toPerson(p)])
      );

      const { data: ratingRows } = await supabase
        .from('doctor_ratings')
        .select('rating')
        .eq('doctor_id', uid);

      const mapAppointment = (r: any) => {
        const pay = payMap.get(r.id);
        return {
          _id: r.id,
          doctorId: {
            _id: doc.id,
            name: doc.name,
            email: doc.email,
            profileImage: doc.profile_image,
            hospitalInfo: doc.hospital_info,
            specialization: doc.specialization,
          },
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
          paymentStatus: pay ? pay.status : undefined,
          paidAmount: pay ? pay.amount : undefined,
        };
      };

      const todayAppointments = todayRows
        .slice()
        .sort((a, b) => {
          const aTime = new Date(a.slot_start_iso).getTime();
          const bTime = new Date(b.slot_start_iso).getTime();
          return aTime - bTime;
        })
        .map(mapAppointment);

      const upcomingAppointments = upcomingRows.map(mapAppointment);

      let thisYearRevenue = 0;
      let lastYearRevenue = 0;
      ((paidRows || []) as any[]).forEach((r: any) => {
        const createdAt = r.created_at as string | null;
        if (!createdAt) return;
        const year = new Date(createdAt).getFullYear();
        const amount = r.amount || 0;
        if (year === thisYear) thisYearRevenue += amount;
        if (year === lastYear) lastYearRevenue += amount;
      });

      const thisYearPatientIds = new Set<string>();
      const lastYearPatientIds = new Set<string>();
      let thisYearCompletedCount = 0;
      let lastYearCompletedCount = 0;

      paidAppointments.forEach((r: any) => {
        const dateStr = r.date as string | null;
        if (!dateStr) return;
        const year = new Date(dateStr).getFullYear();
        const pid = r.patient_id as string;
        if (year === thisYear) {
          thisYearPatientIds.add(pid);
          if (r.status === 'Completed') thisYearCompletedCount += 1;
        }
        if (year === lastYear) {
          lastYearPatientIds.add(pid);
          if (r.status === 'Completed') lastYearCompletedCount += 1;
        }
      });

      const totalPatients = thisYearPatientIds.size;

      const todayLastYear = (() => {
        const d = new Date(now);
        d.setFullYear(lastYear);
        return toLocalYMD(d);
      })();

      const lastYearTodayCount = paidAppointments.filter(
        (r) => r.date === todayLastYear
      ).length;

      const computePercentChange = (prev: number, current: number): string => {
        if (!prev && !current) return '0%';
        if (!prev) return '+100%';
        const diff = ((current - prev) / prev) * 100;
        const rounded = Math.round(diff);
        const sign = rounded > 0 ? '+' : '';
        return `${sign}${rounded}%`;
      };

      const isPositive = (prev: number, current: number): boolean => {
        if (!prev && !current) return false;
        if (!prev && current) return true;
        return current >= prev;
      };

      const ratings = (ratingRows as { rating: number }[] | null) || [];
      const avgRating = ratings.length
        ? ratings.reduce((s, r) => s + (r.rating || 0), 0) / ratings.length
        : 0;

      const completedForResp = paidAppointments.filter(
        (r) => r.status === 'Completed'
      );

      let responseTime = '~--';
      if (completedForResp.length) {
        const avgMinutes =
          completedForResp.reduce((s, r) => {
            const created = new Date(r.created_at as string).getTime();
            const start = new Date(r.slot_start_iso as string).getTime();
            if (!Number.isFinite(created) || !Number.isFinite(start)) return s;
            const diff = Math.abs(start - created) / (1000 * 60);
            return s + diff;
          }, 0) / completedForResp.length;

        if (avgMinutes <= 5) responseTime = '~5 min';
        else if (avgMinutes <= 30) responseTime = '~30 min';
        else if (avgMinutes <= 60) responseTime = '~1 hr';
        else responseTime = '>1 hr';
      }

      const completionRate = (() => {
        const totalPaid = paidAppointments.length;
        if (!totalPaid) return '0%';
        const pct = Math.round((thisYearCompletedCount / totalPaid) * 100);
        return `${pct}%`;
      })();

      const dashboard = {
        user: {
          name: doc?.name,
          profileImage: doc?.profile_image,
          specialization: doc?.specialization,
          hospitalInfo: doc?.hospital_info,
        },
        stats: {
          totalPatients,
          todayAppointments: todayAppointments.length,
          totalRevenue: thisYearRevenue,
          completedAppointments: thisYearCompletedCount,
          averageRating: Number(avgRating.toFixed(1)),
        },
        statsChange: {
          totalPatients: {
            value: computePercentChange(
              lastYearPatientIds.size,
              totalPatients
            ),
            positive: isPositive(lastYearPatientIds.size, totalPatients),
          },
          todayAppointments: {
            value: computePercentChange(
              lastYearTodayCount,
              todayAppointments.length
            ),
            positive: isPositive(lastYearTodayCount, todayAppointments.length),
          },
          totalRevenue: {
            value: computePercentChange(lastYearRevenue, thisYearRevenue),
            positive: isPositive(lastYearRevenue, thisYearRevenue),
          },
          completedAppointments: {
            value: computePercentChange(
              lastYearCompletedCount,
              thisYearCompletedCount
            ),
            positive: isPositive(
              lastYearCompletedCount,
              thisYearCompletedCount
            ),
          },
        },
        todayAppointments,
        upcomingAppointments,
        performance: {
          patientSatisfaction: Number(avgRating.toFixed(1)),
          completionRate,
          responseTime,
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
