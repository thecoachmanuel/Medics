import { getServiceSupabase } from "@/lib/supabase/service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminAutoRefresh } from "@/components/admin/AdminAutoRefresh";
import AdminRefreshToggle from "@/components/admin/AdminRefreshToggle";
import { updatePayoutStatus } from "@/actions/admin-actions";
import ToastNotice from "@/components/admin/ToastNotice";
import { redirect } from "next/navigation";

interface PayoutRow {
  id: string;
  doctor_id: string;
  amount: number;
  status: string;
  note: string | null;
  created_at: string;
}

interface DoctorInfo {
  id: string;
  name: string | null;
  email: string | null;
}

interface BankInfo {
  doctor_id: string;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
}

const statusClass = (status: string): string => {
  const value = status.toLowerCase();
  if (value === "approved" || value === "paid") return "bg-green-100 text-green-800";
  if (value === "rejected") return "bg-red-100 text-red-800";
  return "bg-yellow-100 text-yellow-800";
};

type SearchParams = {
  notice?: string;
  status?: string;
  from?: string;
  to?: string;
  q?: string;
  min?: string;
  max?: string;
};

export default async function AdminPaymentsPage(props: { searchParams?: Promise<SearchParams> }) {
  const sp = (await props.searchParams) || {} as SearchParams;
  const notice = sp.notice || "";
  const supabase = getServiceSupabase();

  let doctorIdsFilter: string[] | null = null;
  const q = (sp.q || "").trim();
  if (q) {
    const { data: docsByQuery } = await supabase
      .from("profiles")
      .select("id")
      .or(`name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(200);
    if (docsByQuery && docsByQuery.length) doctorIdsFilter = (docsByQuery as any[]).map((d) => d.id as string);
    else doctorIdsFilter = [];
  }

  let payoutsQuery = supabase
    .from("doctor_payout_requests")
    .select("id,doctor_id,amount,status,note,created_at");
  if (doctorIdsFilter) payoutsQuery = payoutsQuery.in("doctor_id", doctorIdsFilter);
  if (sp.status && sp.status !== "all") payoutsQuery = payoutsQuery.eq("status", sp.status);
  if (sp.from) payoutsQuery = payoutsQuery.gte("created_at", sp.from);
  if (sp.to) payoutsQuery = payoutsQuery.lte("created_at", sp.to);
  if (sp.min) payoutsQuery = payoutsQuery.gte("amount", Number(sp.min));
  if (sp.max) payoutsQuery = payoutsQuery.lte("amount", Number(sp.max));
  payoutsQuery = payoutsQuery.order("created_at", { ascending: false }).limit(500);

  const { data: payoutRows } = await payoutsQuery;

  const payouts = (payoutRows || []) as PayoutRow[];
  const doctorIds = Array.from(new Set(payouts.map((p) => p.doctor_id)));

  let doctors: DoctorInfo[] = [];
  let banks: BankInfo[] = [];
  if (doctorIds.length) {
    const { data: doctorProfiles } = await supabase
      .from("profiles")
      .select("id,name,email")
      .in("id", doctorIds);
    doctors = (doctorProfiles || []) as DoctorInfo[];

    const { data: bankRows } = await supabase
      .from("doctor_bank_accounts")
      .select("doctor_id,bank_name,account_name,account_number")
      .in("doctor_id", doctorIds);
    banks = (bankRows || []) as BankInfo[];
  }

  const doctorMap = new Map<string, DoctorInfo>();
  doctors.forEach((d) => doctorMap.set(d.id, d));
  const bankMap = new Map<string, BankInfo>();
  banks.forEach((b) => bankMap.set(b.doctor_id, b));

  async function handleStatus(formData: FormData) {
    "use server";
    const id = String(formData.get("id") || "");
    const status = String(formData.get("status") || "pending") as
      | "pending"
      | "approved"
      | "rejected"
      | "paid";
    if (!id) return;
    await updatePayoutStatus(id, status);
    const title = status === "approved" ? "Payout approved" : status === "rejected" ? "Payout rejected" : status === "paid" ? "Payout marked as paid" : "Payout set to pending";
    redirect(`/admin/payments?notice=${encodeURIComponent(title)}`);
  }

  const totalPending = payouts
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalApproved = payouts
    .filter((p) => p.status === "approved")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalPaidOut = payouts
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-4">
      <AdminAutoRefresh intervalMs={300} storageKey="admin_auto_refresh:/admin/payments" defaultEnabled={true} />
      {notice ? <ToastNotice message={notice} /> : null}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Payments & Payouts</h2>
          <p className="text-sm text-gray-600">Review doctor payout requests and track outgoing payments.</p>
        </div>
        <AdminRefreshToggle storageKey="admin_auto_refresh:/admin/payments" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-6 text-sm text-gray-700">
          <div>
            <span className="font-semibold mr-1">Total requests:</span>
            {payouts.length}
          </div>
          <div>
            <span className="font-semibold mr-1">Pending amount (NGN):</span>
            {totalPending.toLocaleString("en-NG")}
          </div>
          <div>
            <span className="font-semibold mr-1">Approved amount (NGN):</span>
            {totalApproved.toLocaleString("en-NG")}
          </div>
          <div>
            <span className="font-semibold mr-1">Paid out amount (NGN):</span>
            {totalPaidOut.toLocaleString("en-NG")}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">Doctor payout requests</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="get" className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-4">
            <select name="status" defaultValue={sp.status || "all"} className="border rounded px-2 py-2">
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
            <input name="from" type="date" defaultValue={sp.from || ""} className="border rounded px-2 py-2" />
            <input name="to" type="date" defaultValue={sp.to || ""} className="border rounded px-2 py-2" />
            <input name="min" type="number" inputMode="numeric" placeholder="Min NGN" defaultValue={sp.min || ""} className="border rounded px-2 py-2" />
            <input name="max" type="number" inputMode="numeric" placeholder="Max NGN" defaultValue={sp.max || ""} className="border rounded px-2 py-2" />
            <input name="q" placeholder="Doctor name/email" defaultValue={sp.q || ""} className="border rounded px-2 py-2 md:col-span-2" />
            <div className="md:col-span-4 flex gap-2">
              <Button type="submit" variant="outline">Apply</Button>
              <a href="/admin/payments" className="inline-flex items-center border rounded px-3">Reset</a>
            </div>
          </form>
          {payouts.length === 0 ? (
            <p className="text-sm text-gray-500">No payout requests submitted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Doctor</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Amount (NGN)</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Bank</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Status</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Requested</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Note</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => {
                    const doc = doctorMap.get(p.doctor_id);
                    const bank = bankMap.get(p.doctor_id);
                    return (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-900">{doc?.name || "Doctor"}</div>
                          <div className="text-xs text-gray-500">{doc?.email}</div>
                        </td>
                        <td className="px-3 py-2 text-gray-900">{(p.amount || 0).toLocaleString("en-NG")}</td>
                        <td className="px-3 py-2 text-xs text-gray-700">
                          {bank ? (
                            <div className="space-y-0.5">
                              <div className="font-medium">{bank.bank_name}</div>
                              <div>{bank.account_name}</div>
                              <div className="font-mono">{bank.account_number}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">No bank on file</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(
                              p.status,
                            )}`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          {new Date(p.created_at).toLocaleString("en-NG", {
                            timeZone: "Africa/Lagos",
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-700 max-w-xs truncate">
                          {p.note || "-"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex gap-2 justify-end">
                            <form action={handleStatus}>
                              <input type="hidden" name="id" value={p.id} />
                              <input type="hidden" name="status" value="approved" />
                              <Button type="submit" size="sm" variant="outline">
                                Approve
                              </Button>
                            </form>
                            <form action={handleStatus}>
                              <input type="hidden" name="id" value={p.id} />
                              <input type="hidden" name="status" value="rejected" />
                              <Button type="submit" size="sm" variant="outline">
                                Reject
                              </Button>
                            </form>
                            <form action={handleStatus}>
                              <input type="hidden" name="id" value={p.id} />
                              <input type="hidden" name="status" value="paid" />
                              <Button type="submit" size="sm" variant="outline">
                                Mark as paid
                              </Button>
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
