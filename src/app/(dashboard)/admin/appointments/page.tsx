import { getServiceSupabase } from "@/lib/supabase/service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AdminAutoRefresh } from "@/components/admin/AdminAutoRefresh";

interface AppointmentRow {
  id: string;
  doctor_id: string;
  patient_id: string;
  date: string | null;
  slot_start_iso: string | null;
  slot_end_iso: string | null;
  consultation_type: string | null;
  status: string | null;
  created_at: string;
}

interface PersonRow {
  id: string;
  name: string | null;
}

type AdminAppointmentsPageProps = {
  searchParams?: {
    q?: string;
    status?: string;
  };
};

export default async function AdminAppointmentsPage({
  searchParams,
}: AdminAppointmentsPageProps) {
  const supabase = getServiceSupabase();

  const { data: appointmentsData } = await supabase
    .from("appointments")
    .select("id,doctor_id,patient_id,date,slot_start_iso,slot_end_iso,consultation_type,status,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (appointmentsData || []) as AppointmentRow[];

  const doctorIds = Array.from(new Set(rows.map((r) => r.doctor_id)));
  const patientIds = Array.from(new Set(rows.map((r) => r.patient_id)));

  const [doctorProfilesResult, patientProfilesResult] = await Promise.all([
    doctorIds.length
      ? supabase.from("profiles").select("id,name").in("id", doctorIds)
      : Promise.resolve({ data: [] as PersonRow[] } as any),
    patientIds.length
      ? supabase.from("profiles").select("id,name").in("id", patientIds)
      : Promise.resolve({ data: [] as PersonRow[] } as any),
  ]);

  const doctorMap = new Map<string, string>();
  ((doctorProfilesResult.data || []) as PersonRow[]).forEach((d) => {
    doctorMap.set(d.id, d.name || "Doctor");
  });

  const patientMap = new Map<string, string>();
  ((patientProfilesResult.data || []) as PersonRow[]).forEach((p) => {
    patientMap.set(p.id, p.name || "Patient");
  });

  const query =
    typeof searchParams?.q === "string" ? searchParams.q.trim().toLowerCase() : "";
  const statusFilter =
    typeof searchParams?.status === "string" && searchParams.status !== "all"
      ? searchParams.status
      : undefined;

  const filteredRows = rows.filter((r) => {
    const doctorName = (doctorMap.get(r.doctor_id) || "").toLowerCase();
    const patientName = (patientMap.get(r.patient_id) || "").toLowerCase();
    const matchesQuery =
      !query || doctorName.includes(query) || patientName.includes(query) || r.id.toLowerCase().includes(query);
    const matchesStatus = !statusFilter || r.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const total = filteredRows.length;
  const completed = filteredRows.filter((r) => r.status === "Completed").length;
  const scheduled = filteredRows.filter((r) => r.status === "Scheduled").length;
  const cancelled = filteredRows.filter((r) => r.status === "Cancelled").length;
  const missed = filteredRows.filter((r) => r.status === "Missed").length;
  const expired = filteredRows.filter((r) => r.status === "Expired").length;

  return (
    <div className="space-y-4">
      <AdminAutoRefresh />
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Appointments</h2>
        <p className="text-sm text-gray-600">
          Monitor all appointments between patients and doctors.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">Overview</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-6 text-sm text-gray-700">
          <div>
            <span className="font-semibold mr-1">Total appointments:</span>
            {total}
          </div>
          <div>
            <span className="font-semibold mr-1">Scheduled:</span>
            {scheduled}
          </div>
          <div>
            <span className="font-semibold mr-1">Completed:</span>
            {completed}
          </div>
          <div>
            <span className="font-semibold mr-1">Cancelled:</span>
            {cancelled}
          </div>
          <div>
            <span className="font-semibold mr-1">Missed:</span>
            {missed}
          </div>
          <div>
            <span className="font-semibold mr-1">Expired:</span>
            {expired}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">Appointment list</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-gray-500">No appointments created yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <form
                method="GET"
                className="mb-4 flex flex-wrap items-center gap-3 text-sm"
              >
                <input
                  type="text"
                  name="q"
                  placeholder="Search by patient, doctor, or ID"
                  defaultValue={typeof searchParams?.q === "string" ? searchParams.q : ""}
                  className="w-full md:w-64 rounded-md border border-gray-300 px-2 py-1"
                />
                <select
                  name="status"
                  defaultValue={
                    typeof searchParams?.status === "string"
                      ? searchParams.status
                      : "all"
                  }
                  className="w-full md:w-48 rounded-md border border-gray-300 px-2 py-1"
                >
                  <option value="all">All statuses</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Missed">Missed</option>
                  <option value="Expired">Expired</option>
                </select>
                <button
                  type="submit"
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Apply filters
                </button>
              </form>

              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Patient</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Doctor</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Date</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Time</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Type</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r) => {
                    const dateLabel = r.slot_start_iso
                      ? new Date(r.slot_start_iso).toLocaleDateString("en-NG", {
                          timeZone: "Africa/Lagos",
                        })
                      : r.date || "-";
                    const timeLabel = r.slot_start_iso
                      ? new Date(r.slot_start_iso).toLocaleTimeString("en-NG", {
                          timeZone: "Africa/Lagos",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-";
                    const statusValue = r.status || "Unknown";
                    const statusColor =
                      statusValue === "Completed"
                        ? "bg-green-100 text-green-800"
                        : statusValue === "Cancelled"
                        ? "bg-red-100 text-red-800"
                        : statusValue === "Missed"
                        ? "bg-orange-100 text-orange-800"
                        : statusValue === "Expired"
                        ? "bg-gray-200 text-gray-800"
                        : "bg-blue-100 text-blue-800";

                    return (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="px-3 py-2 text-gray-900">
                          {patientMap.get(r.patient_id) || "Patient"}
                        </td>
                        <td className="px-3 py-2 text-gray-900">
                          {doctorMap.get(r.doctor_id) || "Doctor"}
                        </td>
                        <td className="px-3 py-2 text-gray-700">{dateLabel}</td>
                        <td className="px-3 py-2 text-gray-700">{timeLabel}</td>
                        <td className="px-3 py-2 text-gray-700">{r.consultation_type || "-"}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
                            {statusValue}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
