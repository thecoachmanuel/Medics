import AdminDashboardContent from "@/components/admin/AdminDashboardContent";
import { AdminAutoRefresh } from "@/components/admin/AdminAutoRefresh";
import AdminRefreshToggle from "@/components/admin/AdminRefreshToggle";
import { getServiceSupabase } from "@/lib/supabase/service";

export const dynamic = 'force-dynamic';

const formatMonth = (date: Date): string => {
  return date.toLocaleDateString("en-NG", {
    timeZone: "Africa/Lagos",
    month: "short",
  });
};

export default async function AdminDashboardPage() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
          <h2 className="text-red-800 text-lg font-semibold mb-2">Configuration Error</h2>
          <p className="text-red-600 mb-4">
            The Admin Dashboard requires the <code>SUPABASE_SERVICE_ROLE_KEY</code> environment variable to function.
          </p>
          <p className="text-sm text-red-500">
            Please add this key to your <code>.env.local</code> file. You can find it in your Supabase Project Settings &gt; API.
          </p>
        </div>
      </div>
    );
  }

  const supabase = getServiceSupabase();

  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [patientsResult, doctorsResult, appointmentsResult, revenueResult] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("type", "patient"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("type", "doctor"),
      supabase.from("appointments").select("id", { count: "exact", head: true }),
      supabase
        .from("payments")
        .select("amount,created_at,status")
        .eq("status", "success")
        .gte("created_at", sixMonthsAgo.toISOString()),
    ]);

  const totalPatients = patientsResult.count || 0;
  const totalDoctors = doctorsResult.count || 0;
  const totalAppointments = appointmentsResult.count || 0;
  const paymentRows = (revenueResult.data || []) as { amount: number; created_at: string; status: string }[];

  const totalRevenue = paymentRows.reduce((sum, row) => sum + (row.amount || 0), 0);

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
    .not("status", "is", null)
    .gte("created_at", sixMonthsAgo.toISOString());

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
      <AdminAutoRefresh intervalMs={300} storageKey="admin_auto_refresh:/admin" defaultEnabled={true} />
      <div className="flex justify-end px-4 sm:px-6 pb-2">
        <AdminRefreshToggle storageKey="admin_auto_refresh:/admin" />
      </div>
      <AdminDashboardContent
        stats={{ totalPatients, totalDoctors, totalAppointments, totalRevenue }}
        monthlyRevenue={monthlyRevenue}
        appointmentStatus={appointmentStatus}
        userGrowth={userGrowth}
      />
    </>
  );
  } catch (error: any) {
    console.error("Admin Dashboard Error:", error);
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto text-center">
          <h2 className="text-red-800 text-lg font-semibold mb-2">Dashboard Error</h2>
          <p className="text-red-600 mb-4">{error.message || "An unexpected error occurred while loading the dashboard."}</p>
          <a 
            href="/admin"
            className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors inline-block"
          >
            Retry
          </a>
        </div>
      </div>
    );
  }
}
