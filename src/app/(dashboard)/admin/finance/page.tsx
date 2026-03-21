import { getServiceSupabase } from "@/lib/supabase/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminAutoRefresh } from "@/components/admin/AdminAutoRefresh";
import AdminRefreshToggle from "@/components/admin/AdminRefreshToggle";
import { formatDateTimeNG } from "@/lib/datetime";

export const dynamic = "force-dynamic";

type SearchParams = {
  status?: string;
  provider?: string;
  from?: string;
  to?: string;
  q?: string;
  min?: string;
  max?: string;
};

type PaymentRow = {
  id: string;
  created_at: string;
  status: string;
  provider: string;
  reference: string | null;
  amount: number;
  currency: string;
  admin_commission_amount: number | null;
  doctor_net_amount: number | null;
  doctor_name: string | null;
  doctor_email: string | null;
  patient_name: string | null;
  patient_email: string | null;
  slot_start_iso: string | null;
  appointment_status: string | null;
};

type DoctorFinancialRow = {
  doctor_id: string;
  doctor_name: string | null;
  doctor_email: string | null;
  total_appointments: number;
  paid_appointments: number;
  gross_amount: number;
  admin_commission_amount: number;
  doctor_net_amount: number;
  payouts_pending: number;
  payouts_paid: number;
  available_balance: number;
  withdrawable_balance: number;
};

type FinanceKpis = {
  completed: { today: number; week: number; month: number };
  pending: { today: number; week: number; month: number };
  total_commission_completed: number;
  total_commission_pending: number;
};

type WalletRow = {
  wallet_id: string;
  user_id: string;
  patient_name: string;
  patient_email: string;
  balance: number;
  currency: string;
  last_updated: string;
};

type WalletFundingRow = {
  transaction_id: string;
  wallet_id: string;
  user_id: string;
  patient_name: string;
  patient_email: string;
  amount: number;
  reference: string;
  status: string;
  created_at: string;
};

export default async function AdminFinancePage(props: { searchParams?: Promise<SearchParams> }) {
  const sp = (await props.searchParams) || ({} as SearchParams);
  const supabase = getServiceSupabase();

  const q = (sp.q || "").trim();
  const status = sp.status || "all";
  const provider = sp.provider || "all";

  const [{ data: kpisData }, paymentsResult, doctorsResult, totalWalletBalanceRes, walletRowsRes, walletFundingRes] = await Promise.all([
    supabase.rpc("admin_finance_kpis").maybeSingle<FinanceKpis>(),
    (async () => {
      let query = supabase
        .from("admin_payments_view")
        .select(
          "id,created_at,status,provider,reference,amount,currency,admin_commission_amount,doctor_net_amount,doctor_name,doctor_email,patient_name,patient_email,slot_start_iso,appointment_status",
        )
        .order("created_at", { ascending: false })
        .limit(500);

      if (status !== "all") query = query.eq("status", status);
      if (provider !== "all") query = query.eq("provider", provider);
      if (sp.from) query = query.gte("created_at", sp.from);
      if (sp.to) query = query.lte("created_at", sp.to);
      if (sp.min) query = query.gte("amount", Number(sp.min));
      if (sp.max) query = query.lte("amount", Number(sp.max));
      if (q) {
        const esc = q.replaceAll(",", " ");
        query = query.or(
          `doctor_name.ilike.%${esc}%,doctor_email.ilike.%${esc}%,patient_name.ilike.%${esc}%,patient_email.ilike.%${esc}%,reference.ilike.%${esc}%`,
        );
      }
      return query;
    })(),
    supabase.rpc("admin_doctor_financials", { p_query: q || null, p_limit: 200, p_offset: 0 }).returns<DoctorFinancialRow[]>(),
    supabase.rpc("admin_total_wallet_balance"),
    supabase.rpc("admin_patient_wallets", { p_query: q || null, p_limit: 100, p_offset: 0 }).returns<WalletRow[]>(),
    supabase.rpc("admin_wallet_funding_history", { p_query: q || null, p_limit: 100, p_offset: 0 }).returns<WalletFundingRow[]>(),
  ]);

  const payments = (paymentsResult.data || []) as PaymentRow[];
  const doctorFinancials = (doctorsResult.data || []) as DoctorFinancialRow[];
  const kpis = (kpisData || {
    completed: { today: 0, week: 0, month: 0 },
    pending: { today: 0, week: 0, month: 0 },
    total_commission_completed: 0,
    total_commission_pending: 0,
  }) as FinanceKpis;
  const totalWalletBalance = Number(totalWalletBalanceRes.data || 0);
  const wallets = (walletRowsRes.data || []) as WalletRow[];
  const fundings = (walletFundingRes.data || []) as WalletFundingRow[];

  const totals = payments.reduce(
    (acc, row) => {
      const amt = Number(row.amount || 0);
      const commission = Number(row.admin_commission_amount || 0);
      const net = Number(row.doctor_net_amount || 0);
      acc.count += 1;
      acc.amount += amt;
      acc.adminCommission += commission;
      acc.doctorNet += net;
      if (row.status === "success") acc.successCount += 1;
      if (row.status === "pending" || row.status === "initiated") acc.pendingCount += 1;
      return acc;
    },
    { count: 0, successCount: 0, pendingCount: 0, amount: 0, adminCommission: 0, doctorNet: 0 },
  );

  return (
    <div className="space-y-4">
      <AdminAutoRefresh storageKey="admin_auto_refresh:/admin/finance" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Finance</h2>
          <p className="text-sm text-gray-600">Monitor incoming payments, doctor balances, and admin commissions.</p>
        </div>
        <AdminRefreshToggle storageKey="admin_auto_refresh:/admin/finance" defaultValue="off" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Payments (filtered)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-700">
            <div className="text-2xl font-bold text-gray-900">{totals.count}</div>
            <div className="mt-1 flex gap-4 text-xs text-gray-500">
              <span>Success: {totals.successCount}</span>
              <span>Pending: {totals.pendingCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Gross Volume (NGN)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totals.amount.toLocaleString("en-NG")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Admin Commission (NGN)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totals.adminCommission.toLocaleString("en-NG")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Doctor Net (NGN)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totals.doctorNet.toLocaleString("en-NG")}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Commission by Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-xs text-gray-500">Completed Meetings</div>
              <div className="text-lg font-bold text-green-600">NGN {Number(kpis.total_commission_completed || 0).toLocaleString("en-NG")}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Scheduled/Ongoing</div>
              <div className="text-lg font-bold text-orange-600">NGN {Number(kpis.total_commission_pending || 0).toLocaleString("en-NG")}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Commission History (Completed)</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4 text-sm text-gray-700">
            <div>
              <div className="text-xs text-gray-500">Today</div>
              <div className="font-semibold">{Number(kpis.completed.today || 0).toLocaleString("en-NG")}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Week</div>
              <div className="font-semibold">{Number(kpis.completed.week || 0).toLocaleString("en-NG")}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Month</div>
              <div className="font-semibold">{Number(kpis.completed.month || 0).toLocaleString("en-NG")}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Commission History (Pending)</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4 text-sm text-gray-700">
            <div>
              <div className="text-xs text-gray-500">Today</div>
              <div className="font-semibold">{Number(kpis.pending.today || 0).toLocaleString("en-NG")}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Week</div>
              <div className="font-semibold">{Number(kpis.pending.week || 0).toLocaleString("en-NG")}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Month</div>
              <div className="font-semibold">{Number(kpis.pending.month || 0).toLocaleString("en-NG")}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">Incoming payments</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="get" className="grid grid-cols-1 md:grid-cols-7 gap-2 mb-4">
            <select name="status" defaultValue={status} className="border rounded px-2 py-2">
              <option value="all">All statuses</option>
              <option value="success">Success</option>
              <option value="initiated">Initiated</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <select name="provider" defaultValue={provider} className="border rounded px-2 py-2">
              <option value="all">All providers</option>
              <option value="paystack">Paystack</option>
              <option value="wallet">Wallet</option>
            </select>
            <input name="from" type="date" defaultValue={sp.from || ""} className="border rounded px-2 py-2" />
            <input name="to" type="date" defaultValue={sp.to || ""} className="border rounded px-2 py-2" />
            <input name="min" type="number" inputMode="numeric" placeholder="Min NGN" defaultValue={sp.min || ""} className="border rounded px-2 py-2" />
            <input name="max" type="number" inputMode="numeric" placeholder="Max NGN" defaultValue={sp.max || ""} className="border rounded px-2 py-2" />
            <input name="q" placeholder="Doctor/patient/reference" defaultValue={q} className="border rounded px-2 py-2 md:col-span-2" />
            <div className="md:col-span-5 flex gap-2">
              <Button type="submit" variant="outline">Apply</Button>
              <a href="/admin/finance" className="inline-flex items-center border rounded px-3">Reset</a>
            </div>
          </form>

          {payments.length === 0 ? (
            <p className="text-sm text-gray-500">No payments match these filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-3 py-2 font-medium text-gray-600">When</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Reference</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Patient</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Doctor</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Amount</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Commission</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Doctor Net</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Status</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Provider</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Appointment</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="px-3 py-2 text-xs text-gray-500">{formatDateTimeNG(p.created_at)}</td>
                      <td className="px-3 py-2">
                        <div className="font-mono text-xs text-gray-900">{p.reference || "-"}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-900">{p.patient_name || "Patient"}</div>
                        <div className="text-xs text-gray-500">{p.patient_email}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-900">{p.doctor_name || "Doctor"}</div>
                        <div className="text-xs text-gray-500">{p.doctor_email}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-900">{Number(p.amount || 0).toLocaleString("en-NG")}</td>
                      <td className="px-3 py-2 text-gray-900">{Number(p.admin_commission_amount || 0).toLocaleString("en-NG")}</td>
                      <td className="px-3 py-2 text-gray-900">{Number(p.doctor_net_amount || 0).toLocaleString("en-NG")}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">{p.status}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">{p.provider}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">
                        <div>{p.slot_start_iso ? formatDateTimeNG(p.slot_start_iso) : "-"}</div>
                        <div className="text-gray-500">{p.appointment_status || "-"}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">Doctor balances</CardTitle>
        </CardHeader>
        <CardContent>
          {doctorFinancials.length === 0 ? (
            <p className="text-sm text-gray-500">No doctors found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Doctor</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Appointments</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Paid</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Gross</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Commission</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Net</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Payouts Pending</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Payouts Paid</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Available</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Withdrawable</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorFinancials.map((d) => (
                    <tr key={d.doctor_id} className="border-b last:border-0">
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-900">{d.doctor_name || "Doctor"}</div>
                        <div className="text-xs text-gray-500">{d.doctor_email}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-900">{Number(d.total_appointments || 0).toLocaleString("en-NG")}</td>
                      <td className="px-3 py-2 text-gray-900">{Number(d.paid_appointments || 0).toLocaleString("en-NG")}</td>
                      <td className="px-3 py-2 text-gray-900">{Number(d.gross_amount || 0).toLocaleString("en-NG")}</td>
                      <td className="px-3 py-2 text-gray-900">{Number(d.admin_commission_amount || 0).toLocaleString("en-NG")}</td>
                      <td className="px-3 py-2 text-gray-900">{Number(d.doctor_net_amount || 0).toLocaleString("en-NG")}</td>
                      <td className="px-3 py-2 text-gray-900">{Number(d.payouts_pending || 0).toLocaleString("en-NG")}</td>
                      <td className="px-3 py-2 text-gray-900">{Number(d.payouts_paid || 0).toLocaleString("en-NG")}</td>
                      <td className="px-3 py-2 text-gray-900">{Number(d.available_balance || 0).toLocaleString("en-NG")}</td>
                      <td className="px-3 py-2 text-gray-900">{Number(d.withdrawable_balance || 0).toLocaleString("en-NG")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">Patient Wallets</CardTitle>
          <div className="text-xs text-gray-500">
            Total Balance: <span className="font-semibold text-gray-900">NGN {totalWalletBalance.toLocaleString("en-NG")}</span>
          </div>
        </CardHeader>
        <CardContent>
          {wallets.length === 0 ? (
            <p className="text-sm text-gray-500">No patient wallets found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Patient</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Balance</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((w) => (
                    <tr key={w.wallet_id} className="border-b last:border-0">
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-900">{w.patient_name || "Patient"}</div>
                        <div className="text-xs text-gray-500">{w.patient_email}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-900">{Number(w.balance || 0).toLocaleString("en-NG")}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{formatDateTimeNG(w.last_updated)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">Recent Wallet Funding</CardTitle>
        </CardHeader>
        <CardContent>
          {fundings.length === 0 ? (
            <p className="text-sm text-gray-500">No funding transactions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Date</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Patient</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Amount</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Reference</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {fundings.map((f) => (
                    <tr key={f.transaction_id} className="border-b last:border-0">
                      <td className="px-3 py-2 text-xs text-gray-500">{formatDateTimeNG(f.created_at)}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-900">{f.patient_name || "Patient"}</div>
                        <div className="text-xs text-gray-500">{f.patient_email}</div>
                      </td>
                      <td className="px-3 py-2 text-green-600 font-medium">+{Number(f.amount || 0).toLocaleString("en-NG")}</td>
                      <td className="px-3 py-2 text-xs font-mono text-gray-500">{f.reference}</td>
                      <td className="px-3 py-2 text-xs text-gray-700 capitalize">{f.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

