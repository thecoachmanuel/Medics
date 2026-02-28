import { getServiceSupabase } from "@/lib/supabase/service";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminAutoRefresh } from "@/components/admin/AdminAutoRefresh";
import AdminRefreshToggle from "@/components/admin/AdminRefreshToggle";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateDoctorAdminStatus, DoctorAdminAction } from "@/actions/admin-actions";
import { formatDateTimeNG } from "@/lib/datetime";

interface DoctorProfileRow {
  id: string;
  name: string | null;
  email: string | null;
  specialization: string | null;
  hospital_info: { name?: string | null; address?: string | null; city?: string | null } | null;
  is_verified: boolean | null;
  is_suspended: boolean | null;
  is_declined: boolean | null;
  fees: number | null;
  experience: number | null;
  category: string[] | null;
  about: string | null;
  admin_review_note: string | null;
  created_at: string;
  updated_at: string;
}

interface RatingRow {
  rating: number | null;
  comment: string | null;
  created_at: string;
  patient_id: string | null;
}

interface PaymentRow {
  amount: number | null;
  created_at: string;
}

interface NotificationRow {
  id: string;
  title: string;
  message: string | null;
  created_at: string;
}

export default async function AdminDoctorDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = getServiceSupabase();

  const { data: doctor } = await supabase
    .from("profiles")
    .select(
      "id,name,email,specialization,hospital_info,is_verified,is_suspended,is_declined,fees,experience,category,about,admin_review_note,created_at,updated_at",
    )
    .eq("id", id)
    .eq("type", "doctor")
    .maybeSingle();

  if (!doctor) {
    notFound();
  }

  const profile = doctor as unknown as DoctorProfileRow;

  const { data: ratingRows } = await supabase
    .from("doctor_ratings")
    .select("rating,comment,created_at,patient_id")
    .eq("doctor_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const ratings = (ratingRows || []) as RatingRow[];
  const patientIds = Array.from(
    new Set(
      ratings
        .map((r) => r.patient_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  );

  const { data: patientProfiles } = patientIds.length
    ? await supabase.from("profiles").select("id,name").in("id", patientIds)
    : { data: [] as { id: string; name: string | null }[] };

  const patientNameMap = new Map(
    ((patientProfiles || []) as { id: string; name: string | null }[]).map((p) => [p.id, p.name || "Patient"]),
  );

  const numericRatings = ratings
    .map((r) => r.rating)
    .filter((v): v is number => typeof v === "number");

  const averageRating =
    numericRatings.length > 0
      ? numericRatings.reduce((sum, v) => sum + v, 0) / numericRatings.length
      : null;

  const { data: paymentsData } = await supabase
    .from("payments")
    .select("amount,created_at")
    .eq("doctor_id", profile.id)
    .eq("status", "success");

  const payments: PaymentRow[] = ((paymentsData || []) as PaymentRow[]).map((p) => ({
    amount: typeof p.amount === "number" ? p.amount : null,
    created_at: p.created_at,
  }));

  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();

  let totalRevenue = 0;
  let thisMonthRevenue = 0;
  let lastPaymentTime = 0;
  let lastPaymentText = "No payments yet";

  const monthlyRevenueMap = new Map<string, number>();

  payments.forEach((p: PaymentRow) => {
    const amount = p.amount || 0;
    totalRevenue += amount;
    const created = new Date(p.created_at);
    const time = created.getTime();
    if (!Number.isFinite(time)) {
      return;
    }
    if (created.getFullYear() === thisYear && created.getMonth() === thisMonth) {
      thisMonthRevenue += amount;
    }
    if (time > lastPaymentTime) {
      lastPaymentTime = time;
      lastPaymentText = created.toLocaleString("en-NG", {
        timeZone: "Africa/Lagos",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
    monthlyRevenueMap.set(key, (monthlyRevenueMap.get(key) || 0) + amount);
  });

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const monthlyRevenue = (() => {
    const items: { label: string; key: string; value: number }[] = [];
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
      const value = monthlyRevenueMap.get(key) || 0;
      const label = `${monthNames[monthIndex]} ${String(year).slice(-2)}`;
      items.push({ label, key, value });
    }
    return items;
  })();

  const maxMonthlyRevenue = monthlyRevenue.reduce(
    (max, item) => (item.value > max ? item.value : max),
    0,
  );

  const { data: appointmentRows } = await supabase
    .from("appointments")
    .select("id,status")
    .eq("doctor_id", profile.id);

  const appointments = (appointmentRows || []) as { id: string; status: string }[];
  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter((a) => a.status === "Completed").length;
  const cancelledAppointments = appointments.filter((a) => a.status === "Cancelled").length;

  const { data: eventsData } = await supabase
    .from("notifications")
    .select("id,title,message,created_at")
    .eq("user_id", profile.id)
    .eq("role", "doctor")
    .in("title", [
      "Your profile has been approved",
      "Your account has been suspended",
      "Your account has been reactivated",
      "Your profile has been declined",
    ])
    .order("created_at", { ascending: false })
    .limit(20);

  const events = (eventsData || []) as NotificationRow[];

  const { data: credentialsData } = await supabase
    .from("doctor_credentials")
    .select("id,url,label,created_at")
    .eq("doctor_id", profile.id)
    .order("created_at", { ascending: false });

  const credentials = (credentialsData || []) as {
    id: string;
    url: string;
    label: string | null;
    created_at: string;
  }[];

  const isVerified = !!profile.is_verified;
  const isSuspended = !!profile.is_suspended;
   const isDeclined = !!profile.is_declined;

  let statusLabel = "Pending";
  let statusClass = "bg-yellow-100 text-yellow-800";
  if (isDeclined) {
    statusLabel = "Declined";
    statusClass = "bg-red-100 text-red-800";
  } else if (isSuspended) {
    statusLabel = "Suspended";
    statusClass = "bg-red-100 text-red-800";
  } else if (isVerified) {
    statusLabel = "Approved";
    statusClass = "bg-green-100 text-green-800";
  }

  async function handleModeration(formData: FormData) {
    "use server";
    const actionRaw = String(formData.get("action") || "");
    const action = actionRaw as DoctorAdminAction;
    const noteValue = formData.get("note");
    const note = typeof noteValue === "string" ? noteValue.trim() : undefined;
    if (!action) return;
    await updateDoctorAdminStatus(profile.id, action, note);
  }

  return (
    <div className="space-y-4">
      <AdminAutoRefresh intervalMs={300} storageKey={`admin_auto_refresh:/admin/doctors/${profile.id}`} defaultEnabled={true} />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Doctor details</h2>
          <p className="text-sm text-gray-600">Review performance, revenue, and status history for this doctor.</p>
        </div>
        <div className="flex items-center gap-3">
          <AdminRefreshToggle storageKey={`admin_auto_refresh:/admin/doctors/${profile.id}`} />
          <Link href="/admin/doctors" className="text-sm text-blue-600 hover:underline">
            Back to doctors
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-700">
            <span>Profile</span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}
            >
              {statusLabel}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-700">
          <div className="flex flex-wrap gap-4">
            <div>
              <span className="font-semibold mr-1">Name:</span>
              {profile.name || "Unnamed"}
            </div>
            <div>
              <span className="font-semibold mr-1">Email:</span>
              {profile.email}
            </div>
            <div>
              <span className="font-semibold mr-1">Specialization:</span>
              {profile.specialization || "-"}
            </div>
            <div>
              <span className="font-semibold mr-1">Healthcare categories:</span>
              {Array.isArray(profile.category) && profile.category.length > 0
                ? profile.category.join(", ")
                : "-"}
            </div>
            <div>
              <span className="font-semibold mr-1">Experience:</span>
              {typeof profile.experience === "number" ? `${profile.experience} yrs` : "-"}
            </div>
            <div>
              <span className="font-semibold mr-1">Consultation fee:</span>
              {typeof profile.fees === "number" ? `₦${profile.fees.toLocaleString()}` : "-"}
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div>
              <span className="font-semibold mr-1">Hospital:</span>
              {profile.hospital_info?.name || "-"}
            </div>
            <div>
              <span className="font-semibold mr-1">City:</span>
              {profile.hospital_info?.city || "-"}
            </div>
          </div>
          <div className="mt-2">
            <span className="font-semibold mr-1">About:</span>
            {profile.about || "-"}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <div>
              <span className="font-semibold mr-1">Joined:</span>
              {formatDateTimeNG(profile.created_at)}
            </div>
            <div>
              <span className="font-semibold mr-1">Last updated:</span>
              {formatDateTimeNG(profile.updated_at)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">
            Credentials & Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {credentials.length === 0 ? (
            <p className="text-sm text-gray-500">No credentials uploaded.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {credentials.map((cred) => (
                <div
                  key={cred.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex flex-col overflow-hidden mr-3">
                    <span className="font-medium text-gray-900 truncate" title={cred.label || "Document"}>
                      {cred.label || "Document"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDateTimeNG(cred.created_at)}
                    </span>
                  </div>
                  <a
                    href={cred.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">
            Admin moderation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleModeration} className="space-y-4 text-sm text-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Status action
                </label>
                <select
                  name="action"
                  defaultValue={isVerified ? (isSuspended ? "unsuspend" : "suspend") : isDeclined ? "approve" : "approve"}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="approve">Approve</option>
                  <option value="decline">Decline</option>
                  <option value="suspend">Suspend</option>
                  <option value="unsuspend">Unsuspend</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                  Admin note (visible to doctor)
                </label>
                <Textarea
                  id="note"
                  name="note"
                  defaultValue={profile.admin_review_note || ""}
                  rows={4}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm">
                Save moderation
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700">
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-gray-700">
            <div>
              <span className="font-semibold mr-1">Total:</span>
              ₦{totalRevenue.toLocaleString()}
            </div>
            <div>
              <span className="font-semibold mr-1">This month:</span>
              ₦{thisMonthRevenue.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              Last payment:
              <span className="ml-1">{lastPaymentText}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700">
              Appointments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-gray-700">
            <div>
              <span className="font-semibold mr-1">Total:</span>
              {totalAppointments}
            </div>
            <div>
              <span className="font-semibold mr-1">Completed:</span>
              {completedAppointments}
            </div>
            <div>
              <span className="font-semibold mr-1">Cancelled:</span>
              {cancelledAppointments}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700">
              Ratings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-gray-700">
            <div>
              <span className="font-semibold mr-1">Average rating:</span>
              {typeof averageRating === "number" ? `${averageRating.toFixed(1)} / 5` : "No ratings yet"}
            </div>
            <div>
              <span className="font-semibold mr-1">Total reviews:</span>
              {ratings.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700">
              Revenue (last 12 months)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            {monthlyRevenue.every((m) => m.value === 0) ? (
              <p className="text-sm text-gray-500">No revenue recorded in the last 12 months.</p>
            ) : (
              <div className="space-y-1">
                {monthlyRevenue.map((m) => {
                  const ratio = maxMonthlyRevenue > 0 ? m.value / maxMonthlyRevenue : 0;
                  const widthPercent = Math.max(4, Math.round(ratio * 100));
                  return (
                    <div key={m.key} className="flex items-center gap-2">
                      <div className="w-16 text-xs text-gray-500">{m.label}</div>
                      <div className="flex-1 h-2 bg-gray-100 rounded">
                        {m.value > 0 && (
                          <div
                            className="h-2 bg-blue-500 rounded"
                            style={{ width: `${widthPercent}%` }}
                          />
                        )}
                      </div>
                      <div className="w-20 text-xs text-right text-gray-600">
                        {m.value > 0 ? `₦${m.value.toLocaleString()}` : "-"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700">
              Recent reviews
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            {ratings.length === 0 ? (
              <p className="text-sm text-gray-500">No reviews yet.</p>
            ) : (
              ratings.map((r, idx) => (
                <div key={`${r.created_at}-${idx}`} className="border-b last:border-b-0 pb-2 last:pb-0">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{patientNameMap.get(r.patient_id || "") || "Patient"}</span>
                    <span>{formatDateTimeNG(r.created_at)}</span>
                  </div>
                  <div className="font-semibold text-gray-800 mb-1">
                    {typeof r.rating === "number" ? `${r.rating.toFixed(1)} / 5` : "No rating"}
                  </div>
                  {r.comment && <p className="text-sm text-gray-700">{r.comment}</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700">
              Admin status history
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            {events.length === 0 ? (
              <p className="text-sm text-gray-500">
                No recorded status changes yet. Future approvals and suspensions will appear here.
              </p>
            ) : (
              events.map((e) => (
                <div key={e.id} className="border-b last:border-b-0 pb-2 last:pb-0">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{e.title}</span>
                    <span>{formatDateTimeNG(e.created_at)}</span>
                  </div>
                  {e.message && <p className="text-sm text-gray-700">{e.message}</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
