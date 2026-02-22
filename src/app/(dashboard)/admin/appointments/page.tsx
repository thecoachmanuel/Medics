import { getServiceSupabase } from "@/lib/supabase/service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AdminAutoRefresh } from "@/components/admin/AdminAutoRefresh";
import { adminCreateAppointment, adminUpdateAppointmentStatus, adminRescheduleAppointment } from "@/actions/admin-actions";

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
  email?: string | null;
}

type AdminAppointmentsPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
};

export default async function AdminAppointmentsPage(
  props: AdminAppointmentsPageProps,
) {
  const searchParams = (await props.searchParams) || {};
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
      ? supabase.from("profiles").select("id,name,email").in("id", doctorIds)
      : Promise.resolve({ data: [] as PersonRow[] } as any),
    patientIds.length
      ? supabase.from("profiles").select("id,name,email").in("id", patientIds)
      : Promise.resolve({ data: [] as PersonRow[] } as any),
  ]);

  const doctorMap = new Map<string, { name: string; email: string }>();
  ((doctorProfilesResult.data || []) as PersonRow[]).forEach((d) => {
    doctorMap.set(d.id, { name: d.name || "Doctor", email: d.email || "" });
  });

  const patientMap = new Map<string, { name: string; email: string }>();
  ((patientProfilesResult.data || []) as PersonRow[]).forEach((p) => {
    patientMap.set(p.id, { name: p.name || "Patient", email: p.email || "" });
  });

  const query = typeof searchParams.q === "string" ? searchParams.q.trim().toLowerCase() : "";
  const statusFilter =
    typeof searchParams.status === "string" && searchParams.status !== "all"
      ? searchParams.status
      : undefined;

  const filteredRows = rows.filter((r) => {
    const d = doctorMap.get(r.doctor_id);
    const p = patientMap.get(r.patient_id);
    const doctorName = (d?.name || "").toLowerCase();
    const doctorEmail = (d?.email || "").toLowerCase();
    const patientName = (p?.name || "").toLowerCase();
    const patientEmail = (p?.email || "").toLowerCase();
    const matchesQuery =
      !query ||
      doctorName.includes(query) ||
      doctorEmail.includes(query) ||
      patientName.includes(query) ||
      patientEmail.includes(query) ||
      r.id.toLowerCase().includes(query);
    const matchesStatus = !statusFilter || r.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const total = filteredRows.length;
  const completed = filteredRows.filter((r) => r.status === "Completed").length;
  const scheduled = filteredRows.filter((r) => r.status === "Scheduled").length;
  const cancelled = filteredRows.filter((r) => r.status === "Cancelled").length;
  const missed = filteredRows.filter((r) => r.status === "Missed").length;
  const expired = filteredRows.filter((r) => r.status === "Expired").length;

  const { data: allDoctors } = await supabase
    .from("profiles")
    .select("id,name")
    .eq("type", "doctor")
    .order("name", { ascending: true });
  const { data: allPatients } = await supabase
    .from("profiles")
    .select("id,name")
    .eq("type", "patient")
    .order("name", { ascending: true });

  async function handleCreate(formData: FormData) {
    "use server";
    const doctorId = String(formData.get("doctorId") || "");
    const patientId = String(formData.get("patientId") || "");
    const date = String(formData.get("date") || "");
    const start = String(formData.get("startIso") || "");
    const end = String(formData.get("endIso") || "");
    const type = String(formData.get("type") || "");
    if (!doctorId || !patientId || !date || !start || !end || !type) return;
    await adminCreateAppointment({ doctorId, patientId, date, startIso: start, endIso: end, type });
  }

  async function handleMarkStatus(formData: FormData) {
    "use server";
    const id = String(formData.get("id") || "");
    const status = String(formData.get("status") || "");
    if (!id || !status) return;
    await adminUpdateAppointmentStatus(id, status);
  }

  async function handleReschedule(formData: FormData) {
    "use server";
    const id = String(formData.get("id") || "");
    const doctorId = String(formData.get("doctorId") || "");
    const patientId = String(formData.get("patientId") || "");
    const startIso = String(formData.get("startIso") || "");
    const endIso = String(formData.get("endIso") || "");
    if (!id || !doctorId || !patientId || !startIso || !endIso) return;
    await adminRescheduleAppointment(id, doctorId, patientId, startIso, endIso);
  }

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
          <div className="mb-3 flex justify-end">
            <a
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
              href={`/api/admin/appointments/export?status=${encodeURIComponent(typeof searchParams.status === "string" ? searchParams.status : 'all')}&q=${encodeURIComponent(typeof searchParams.q === "string" ? searchParams.q : '')}`}
            >
              Export CSV
            </a>
          </div>
          <div className="mb-6">
            <form action={handleCreate} className="grid grid-cols-1 md:grid-cols-7 gap-2">
              <select name="patientId" required className="border rounded px-3 py-2 text-sm">
                <option value="">Select patient</option>
                {(allPatients as PersonRow[] | null || []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name || p.id}</option>
                ))}
              </select>
              <select name="doctorId" required className="border rounded px-3 py-2 text-sm">
                <option value="">Select doctor</option>
                {(allDoctors as PersonRow[] | null || []).map((d) => (
                  <option key={d.id} value={d.id}>{d.name || d.id}</option>
                ))}
              </select>
              <input type="date" name="date" required className="border rounded px-3 py-2 text-sm" />
              <input type="datetime-local" name="startIso" required step={60} title="Choose start time" className="border rounded px-3 py-2 text-sm" />
              <input type="datetime-local" name="endIso" required step={60} title="End must be after start" className="border rounded px-3 py-2 text-sm" />
              <select name="type" required className="border rounded px-3 py-2 text-sm">
                <option value="Video Consultation">Video Consultation</option>
                <option value="Phone Consultation">Phone Consultation</option>
              </select>
              <button type="submit" className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">Create appointment</button>
            </form>
          </div>
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
                  defaultValue={typeof searchParams.q === "string" ? searchParams.q : ""}
                  className="w-full md:w-64 rounded-md border border-gray-300 px-2 py-1"
                />
                <select
                  name="status"
                  defaultValue={
                    typeof searchParams.status === "string"
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
                          <div>{patientMap.get(r.patient_id)?.name || "Patient"}</div>
                          {patientMap.get(r.patient_id)?.email ? (
                            <div className="text-xs text-gray-500">{patientMap.get(r.patient_id)?.email}</div>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 text-gray-900">
                          <div>{doctorMap.get(r.doctor_id)?.name || "Doctor"}</div>
                          {doctorMap.get(r.doctor_id)?.email ? (
                            <div className="text-xs text-gray-500">{doctorMap.get(r.doctor_id)?.email}</div>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 text-gray-700">{dateLabel}</td>
                        <td className="px-3 py-2 text-gray-700">{timeLabel}</td>
                        <td className="px-3 py-2 text-gray-700">{r.consultation_type || "-"}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
                            {statusValue}
                          </span>
                          <div className="mt-2 flex gap-2">
                            <form action={handleMarkStatus}>
                              <input type="hidden" name="id" value={r.id} />
                              <input type="hidden" name="status" value="Missed" />
                              <button className="rounded border px-2 py-0.5 text-xs">Mark missed</button>
                            </form>
                            <form action={handleMarkStatus}>
                              <input type="hidden" name="id" value={r.id} />
                              <input type="hidden" name="status" value="Cancelled" />
                              <button className="rounded border px-2 py-0.5 text-xs">Cancel</button>
                            </form>
                            <form action={handleReschedule} className="flex items-center gap-1">
                              <input type="hidden" name="id" value={r.id} />
                              <input type="hidden" name="doctorId" value={r.doctor_id} />
                              <input type="hidden" name="patientId" value={r.patient_id} />
                              <input type="datetime-local" name="startIso" required step={60} title="New start time" className="border rounded px-2 py-0.5 text-xs" />
                              <input type="datetime-local" name="endIso" required step={60} title="End must be after start" className="border rounded px-2 py-0.5 text-xs" />
                              <button className="rounded border px-2 py-0.5 text-xs">Reschedule</button>
                            </form>
                          </div>
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
