"use client";
import { useEffect, useMemo, useState } from "react";
import Header from "../landing/Header";
import { usePaymentStore } from "@/store/paymentStore";
import { Payment, PaymentFilters, PaymentStatus } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Calendar, Download, Search, SlidersHorizontal } from "lucide-react";

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
  const [filters, setFilters] = useState<PaymentFilters>({ sortBy: "created_at", sortOrder: "desc" });

  useEffect(() => {
    fetchPayments("patient", filters);
  }, [fetchPayments, filters]);

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
                    ))}
                  </div>
                ) : payments.length ? (
                  <div className="divide-y">
                    {payments.map((p) => (
                      <div key={p.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-50 rounded">
                            <Calendar className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{currency(p.amount, p.currency)}</div>
                            <div className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-gray-500">{p.reference || "N/A"}</div>
                          <Badge className={statusColor(p.status)}>{p.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500">No payments found</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total records</span>
                  <span className="font-semibold">{payments.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total paid</span>
                  <span className="font-semibold">{currency(totalPaid, "NGN")}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

