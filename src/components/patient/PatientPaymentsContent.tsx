"use client";
import { useEffect, useMemo, useState } from "react";
import Header from "../landing/Header";
import { usePaymentStore } from "@/store/paymentStore";
import { Payment, PaymentFilters, PaymentStatus } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Calendar, Download, Search, SlidersHorizontal } from "lucide-react";
import { formatDateTimeNG } from "@/lib/datetime";
import WalletCard from "./WalletCard";
import { useWalletStore } from "@/store/walletStore";
import { userAuthStore } from "@/store/authStore";

const statusColor = (s: PaymentStatus) =>
  s === "success"
    ? "bg-green-100 text-green-700"
    : s === "pending"
    ? "bg-yellow-100 text-yellow-700"
    : s === "refunded"
    ? "bg-purple-100 text-purple-700"
    : "bg-red-100 text-red-700";

const currency = (n: number, cur: string) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: cur || "NGN" }).format(n);

export default function PatientPaymentsContent() {
  const { payments, fetchPayments, loading } = usePaymentStore();
  const { fetchWallet, fetchTransactions } = useWalletStore();
  const { user } = userAuthStore();
  const [filters, setFilters] = useState<PaymentFilters>({ sortBy: "created_at", sortOrder: "desc" });

  useEffect(() => {
    fetchPayments("patient", filters);
  }, [fetchPayments, filters]);

  useEffect(() => {
    if (user?.id) {
      fetchWallet(user.id);
      fetchTransactions(user.id);
    }
  }, [user, fetchWallet, fetchTransactions]);

  const totalPaid = useMemo(
    () => payments.filter((p) => p.status === "success").reduce((s, p) => s + p.amount, 0),
    [payments]
  );

  const exportCSV = () => {
    const header = ["Date", "Reference", "Amount", "Currency", "Status"].join(",");
    const rows = payments
      .map((p) => [new Date(p.createdAt).toISOString(), p.reference || "", p.amount, p.currency, p.status].join(","))
      .join("\n");
    const csv = `${header}\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Header showDashboardNav={true} />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
              <p className="text-gray-600">Track your payment history and receipts</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportCSV}>
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <WalletCard />
            </div>
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4" /> Filters
                  </CardTitle>
                </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select
                value={(filters.status as string) || ""}
                onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value || undefined) as any }))}
                className="border rounded px-3 py-2"
              >
                <option value="">All Status</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
              <input
                type="date"
                value={filters.from || ""}
                onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value || undefined }))}
                className="border rounded px-3 py-2"
              />
              <input
                type="date"
                value={filters.to || ""}
                onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value || undefined }))}
                className="border rounded px-3 py-2"
              />
              <div className="flex items-center border rounded px-3">
                <Search className="w-4 h-4 mr-2 text-gray-400" />
                <input
                  placeholder="Search reference"
                  className="flex-1 py-2 outline-none"
                  value={filters.search || ""}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : payments.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No payments found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="py-2">Date</th>
                        <th className="py-2">Reference</th>
                        <th className="py-2">Amount</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {formatDateTimeNG(p.createdAt)}
                            </div>
                          </td>
                          <td className="py-3 font-mono text-xs">{p.reference || "-"}</td>
                          <td className="py-3 font-medium">{currency(p.amount, p.currency)}</td>
                          <td className="py-3">
                            <Badge className={statusColor(p.status)} variant="secondary">
                              {p.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</>
  );
}
