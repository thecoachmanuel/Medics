import { getServiceSupabase } from "@/lib/supabase/service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminAutoRefresh } from "@/components/admin/AdminAutoRefresh";
import AdminRefreshToggle from "@/components/admin/AdminRefreshToggle";
import { updateDoctorAdminStatus, DoctorAdminAction } from "@/actions/admin-actions";
import Link from "next/link";
import { formatDateNG } from "@/lib/datetime";

interface DoctorRow {
  id: string;
  name: string | null;
  email: string | null;
  specialization: string | null;
  is_verified: boolean | null;
  is_suspended: boolean | null;
  is_declined: boolean | null;
  created_at: string;
}

export default async function AdminDoctorsPage(props: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const searchParams = (await props.searchParams) || {};
  const search = (searchParams.q || "").trim().toLowerCase();
  const statusParam = (searchParams.status || "all").toLowerCase();
  const statusFilter: "all" | "pending" | "approved" | "suspended" | "declined" =
    statusParam === "pending" ||
    statusParam === "approved" ||
    statusParam === "suspended" ||
    statusParam === "declined"
      ? (statusParam as "pending" | "approved" | "suspended" | "declined")
      : "all";

  const supabase = getServiceSupabase();
  const { data } = await supabase
    .from("profiles")
    .select("id,name,email,specialization,is_verified,is_suspended,is_declined,created_at")
    .eq("type", "doctor")
    .order("created_at", { ascending: false })
    .limit(200);

  const doctors = (data || []) as DoctorRow[];

  const classified = doctors.map((d) => {
    const isVerified = !!d.is_verified;
    const isSuspended = !!d.is_suspended;
    const isDeclined = !!d.is_declined;

    let status: "pending" | "approved" | "suspended" | "declined" = "pending";
    if (isDeclined) status = "declined";
    else if (isSuspended) status = "suspended";
    else if (isVerified) status = "approved";

    return { ...d, isVerified, isSuspended, isDeclined, status };
  });

  const filteredDoctors = classified.filter((d) => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (!search) return true;
    const name = (d.name || "").toLowerCase();
    const email = (d.email || "").toLowerCase();
    return name.includes(search) || email.includes(search);
  });

  const pendingCount = classified.filter((d) => d.status === "pending").length;

  async function handleStatus(formData: FormData) {
    "use server";
    const id = String(formData.get("id") || "");
    const actionValue = String(formData.get("action") || "approve") as DoctorAdminAction;
    if (!id) return;
    await updateDoctorAdminStatus(id, actionValue);
  }

  return (
    <div className="space-y-4">
      <AdminAutoRefresh intervalMs={300} storageKey="admin_auto_refresh:/admin/doctors" defaultEnabled={true} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Doctors</h2>
          <p className="text-sm text-gray-600">Approve new doctors and review their status on MedicsOnline.</p>
        </div>
        <AdminRefreshToggle storageKey="admin_auto_refresh:/admin/doctors" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-6 text-sm text-gray-700">
          <div>
            <span className="font-semibold mr-1">Total doctors:</span>
            {doctors.length}
          </div>
          <div>
            <span className="font-semibold mr-1">Pending approval:</span>
            {pendingCount}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">
            Doctor list
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col md:flex-row md:items-center gap-3">
            <form
              className="flex flex-1 flex-col md:flex-row gap-3"
              action="/admin/doctors"
              method="get"
            >
              <Input
                name="q"
                placeholder="Search by name or email"
                defaultValue={searchParams.q || ""}
                className="md:max-w-xs"
              />
              <select
                name="status"
                defaultValue={statusFilter}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="suspended">Suspended</option>
                <option value="declined">Declined</option>
              </select>
              <div className="flex gap-2">
                <Button type="submit" size="sm">
                  Apply
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  asChild
                >
                  <a href="/admin/doctors">Reset</a>
                </Button>
              </div>
            </form>
          </div>
          {filteredDoctors.length === 0 ? (
            <p className="text-sm text-gray-500">No doctors found for this filter.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Name</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Email</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Specialization</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Joined</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Status</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {filteredDoctors.map((d) => {
                    let statusLabel = "Pending";
                    let statusClass = "bg-yellow-100 text-yellow-800";
                    if (d.status === "declined") {
                      statusLabel = "Declined";
                      statusClass = "bg-red-100 text-red-800";
                    } else if (d.status === "suspended") {
                      statusLabel = "Suspended";
                      statusClass = "bg-red-100 text-red-800";
                    } else if (d.status === "approved") {
                      statusLabel = "Approved";
                      statusClass = "bg-green-100 text-green-800";
                    }

                    let action: DoctorAdminAction = "approve";
                    let actionLabel = "Approve";
                    let actionVariant: "default" | "outline" = "default";

                    if (d.status === "pending" || d.status === "declined") {
                      action = "approve";
                      actionLabel = "Approve";
                      actionVariant = "default";
                    } else if (d.status === "suspended") {
                      action = "unsuspend";
                      actionLabel = "Unsuspend";
                      actionVariant = "outline";
                    } else {
                      action = "suspend";
                      actionLabel = "Suspend";
                      actionVariant = "outline";
                    }
                    return (
                      <tr key={d.id} className="border-b last:border-0">
                        <td className="px-3 py-2 text-gray-900">
                          <Link
                            href={`/admin/doctors/${d.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {d.name || "Unnamed"}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-gray-700">{d.email}</td>
                        <td className="px-3 py-2 text-gray-700">{d.specialization || "-"}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">{formatDateNG(d.created_at)}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <form action={handleStatus} className="inline">
                            <input type="hidden" name="id" value={d.id} />
                            <input type="hidden" name="action" value={action} />
                            <Button
                              type="submit"
                              size="sm"
                              variant={actionVariant}
                            >
                              {actionLabel}
                            </Button>
                          </form>
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
