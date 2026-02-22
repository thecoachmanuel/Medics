import AdminDashboardContent from "@/components/admin/AdminDashboardContent";
import { AdminAutoRefresh } from "@/components/admin/AdminAutoRefresh";
import { getServiceSupabase } from "@/lib/supabase/service";

const formatMonth = (date: Date): string => {
  return date.toLocaleDateString("en-US", { month: "short" });
};

export default async function AdminDashboardPage() {
  const supabase = getServiceSupabase();

  const [patientsResult, doctorsResult, appointmentsResult, revenueResult] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("type", "patient"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("type", "doctor"),
    supabase.from("appointments").select("id", { count: "exact", head: true }),
    supabase.from("payments").select("amount,created_at,status").eq("status", "success"),
  ]);

  const totalPatients = patientsResult.count || 0;
  const totalDoctors = doctorsResult.count || 0;
  const totalAppointments = appointmentsResult.count || 0;
  const paymentRows = (revenueResult.data || []) as { amount: number; created_at: string; status: string }[];

  const totalRevenue = paymentRows.reduce((sum, row) => sum + (row.amount || 0), 0);

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const monthlyMap = new Map<string, number>();
  for (let i = 0; i < 6; i += 1) {
    const d = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + i, 1);
    monthlyMap.set(formatMonth(d), 0);
  }

  paymentRows.forEach((row) => {
    const created = new Date(row.created_at);
    if (created >= sixMonthsAgo && created <= now) {
      const key = formatMonth(created);
      const current = monthlyMap.get(key) || 0;
      monthlyMap.set(key, current + (row.amount || 0));
    }
  });

  const monthlyRevenue = Array.from(monthlyMap.entries()).map(([month, revenue]) => ({ month, revenue }));

  const { data: appointmentRows } = await supabase
    .from("appointments")
    .select("status")
    .not("status", "is", null);

  const statusCounts = new Map<string, number>();
  (appointmentRows || []).forEach((row: any) => {
    const status = row.status || "Scheduled";
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
  });

  const appointmentStatus = Array.from(statusCounts.entries()).map(([status, value]) => ({ status, value }));

  const { data: userRows } = await supabase
    .from("profiles")
    .select("type,created_at")
    .gte("created_at", sixMonthsAgo.toISOString());

  const userGrowthMap = new Map<string, { patients: number; doctors: number }>();
  monthlyMap.forEach((_, key) => {
    userGrowthMap.set(key, { patients: 0, doctors: 0 });
  });

  (userRows || []).forEach((row: any) => {
    const created = new Date(row.created_at);
    const key = formatMonth(created);
    const entry = userGrowthMap.get(key);
    if (!entry) return;
    if (row.type === "doctor") entry.doctors += 1;
    else if (row.type === "patient") entry.patients += 1;
  });

  const userGrowth = Array.from(userGrowthMap.entries()).map(([month, value]) => ({ month, ...value }));

  return (
    <>
      <AdminAutoRefresh />
      <AdminDashboardContent
        stats={{ totalPatients, totalDoctors, totalAppointments, totalRevenue }}
        monthlyRevenue={monthlyRevenue}
        appointmentStatus={appointmentStatus}
        userGrowth={userGrowth}
      />
    </>
  );
}
