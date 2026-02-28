"use client";
import { useEffect, useMemo, useState } from "react";
import Header from "../landing/Header";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { supabase } from "@/lib/supabase/client";
import { usePaymentStore } from "@/store/paymentStore";
import { PaymentFilters } from "@/lib/types";
import { formatDateTimeNG } from "@/lib/datetime";
import { fetchBillingSettings } from "@/lib/settings";

const currency = (n: number, cur: string) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: cur || "NGN" }).format(n);

export default function DoctorPayoutsContent() {
  const { payments, fetchPayments } = usePaymentStore();
  const [filters] = useState<PaymentFilters>({ sortBy: "created_at", sortOrder: "desc" });

  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutNote, setPayoutNote] = useState("");
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null);
  const [payoutRequestedTotal, setPayoutRequestedTotal] = useState(0);
  const [lastPayout, setLastPayout] = useState<{
    id: string;
    amount: number;
    status: string;
    created_at: string;
  } | null>(null);
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankSaving, setBankSaving] = useState(false);
  const [bankMessage, setBankMessage] = useState<string | null>(null);
  const [payoutList, setPayoutList] = useState<Array<{ id: string; amount: number; status: string; created_at: string; note: string | null }>>([]);
  const [payoutListLoading, setPayoutListLoading] = useState(false);
  const [payoutListFilter, setPayoutListFilter] = useState<string>("");

  useEffect(() => {
    fetchPayments("doctor", filters);
  }, [fetchPayments, filters]);

  const totals = useMemo(() => {
    const paidRaw = payments
      .filter((p) => p.status === "success" && p.appointmentStatus === "Completed")
      .reduce((s, p) => s + p.amount, 0);
    return { paidRaw } as const;
  }, [payments]);

  const [commissionPercent, setCommissionPercent] = useState<number>(20);
  const [maxWithdrawalPercent, setMaxWithdrawalPercent] = useState<number>(85);

  useEffect(() => {
    fetchBillingSettings().then((cfg) => {
      setCommissionPercent(cfg.adminCommissionPercent);
      setMaxWithdrawalPercent(cfg.maxWithdrawalPercent);
    }).catch(() => undefined);
  }, []);

  const earningsPaid = useMemo(() => {
    const factor = Math.max(0, Math.min(1, (100 - commissionPercent) / 100));
    return Math.round(totals.paidRaw * factor);
  }, [totals, commissionPercent]);

  useEffect(() => {
    const loadPayoutStats = async () => {
      try {
        const { data: session } = await supabase.auth.getUser();
        const uid = session.user?.id;
        if (!uid) {
          setPayoutRequestedTotal(0);
          return;
        }
        const { data, error } = await supabase
          .from("doctor_payout_requests")
          .select("id,amount,status,created_at")
          .eq("doctor_id", uid);
        if (error) return;
        const rows = (data || []) as { id: string; amount: number | null; status: string | null; created_at: string }[];
        const requested = rows
          .filter((r) => String(r.status || "").toLowerCase() !== "rejected")
          .reduce((sum, r) => sum + Number(r.amount || 0), 0);
        setPayoutRequestedTotal(requested);
        if (rows.length) {
          const last = [...rows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
          setLastPayout({ id: last.id, amount: Number(last.amount || 0), status: String(last.status || "pending"), created_at: last.created_at });
        } else {
          setLastPayout(null);
        }
      } catch {
        setPayoutRequestedTotal(0);
      }
    };
    loadPayoutStats();
  }, []);

  useEffect(() => {
    const loadPayouts = async () => {
      setPayoutListLoading(true);
      try {
        const { data: session } = await supabase.auth.getUser();
        const uid = session.user?.id;
        if (!uid) {
          setPayoutList([]);
          return;
        }
        let q = supabase
          .from("doctor_payout_requests")
          .select("id,amount,status,created_at,note")
          .eq("doctor_id", uid)
          .order("created_at", { ascending: false });
        if (payoutListFilter) q = q.eq("status", payoutListFilter);
        const { data, error } = await q;
        if (error) {
          setPayoutList([]);
          return;
        }
        const rows = (data || []) as { id: string; amount: number | null; status: string | null; created_at: string; note: string | null }[];
        setPayoutList(rows.map((r) => ({ id: r.id, amount: Number(r.amount || 0), status: String(r.status || "pending"), created_at: r.created_at, note: r.note })));
      } finally {
        setPayoutListLoading(false);
      }
    };
    loadPayouts();
  }, [payoutListFilter]);

  useEffect(() => {
    const loadBankDetails = async () => {
      try {
        const { data: session } = await supabase.auth.getUser();
        const uid = session.user?.id;
        if (!uid) return;
        const { data } = await supabase
          .from("doctor_bank_accounts")
          .select("bank_name,account_name,account_number")
          .eq("doctor_id", uid)
          .maybeSingle();
        if (data) {
          setBankName(String((data as any).bank_name || ""));
          setAccountName(String((data as any).account_name || ""));
          setAccountNumber(String((data as any).account_number || ""));
        }
      } catch {}
    };
    loadBankDetails();
  }, []);

  const availableForPayout = useMemo(() => {
    const available = earningsPaid - payoutRequestedTotal;
    if (!Number.isFinite(available)) return 0;
    const netAvailable = available > 0 ? available : 0;
    if (maxWithdrawalPercent >= 100) return netAvailable;
    return Math.floor(netAvailable * (maxWithdrawalPercent / 100));
  }, [earningsPaid, payoutRequestedTotal, maxWithdrawalPercent]);

  const submitPayoutRequest = async () => {
    setPayoutMessage(null);
    if (!bankName || !accountName || !accountNumber) {
      setPayoutMessage("Add bank details before requesting a payout.");
      return;
    }
    const amountValue = parseInt(payoutAmount, 10);
    if (Number.isNaN(amountValue) || amountValue <= 0) {
      setPayoutMessage("Enter a valid payout amount.");
      return;
    }
    if (amountValue > availableForPayout) {
      setPayoutMessage(`You can request up to ${currency(availableForPayout, "NGN")} based on your available balance.`);
      return;
    }
    setPayoutSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getUser();
      const uid = session.user?.id;
      if (!uid) throw new Error("Not authenticated");
      const { data: rows, error } = await supabase
        .from("doctor_payout_requests")
        .insert({ doctor_id: uid, amount: amountValue, note: payoutNote || null, status: "pending" })
        .select("id")
        .single();
      if (error) throw error;
      setPayoutMessage("Payout request submitted to admin.");
      setPayoutAmount("");
      setPayoutNote("");
      setPayoutRequestedTotal((current) => current + amountValue);
      try {
        const { data } = await supabase
          .from("doctor_payout_requests")
          .select("id,amount,status,created_at,note")
          .order("created_at", { ascending: false })
          .limit(1);
        if (data && data[0]) {
          const row = data[0] as any;
          setLastPayout({ id: row.id, amount: Number(row.amount || 0), status: String(row.status || "pending"), created_at: row.created_at });
        }
      } catch {}
      setPayoutList((prev) => [{ id: rows!.id as string, amount: amountValue, status: "pending", created_at: new Date().toISOString(), note: payoutNote || null }, ...prev]);
      const requestId = rows?.id as string | undefined;
      if (requestId) {
        try {
          await fetch("/api/admin/activity", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "payout_request", payload: { requestId } }) });
        } catch {}
      }
    } catch (error: any) {
      setPayoutMessage(error.message || "Unable to submit payout request.");
    } finally {
      setPayoutSubmitting(false);
    }
  };

  const saveBankDetails = async () => {
    setBankMessage(null);
    if (!bankName || !accountName || !accountNumber) {
      setBankMessage("All bank fields are required.");
      return;
    }
    if (!/^\d{10,}$/.test(accountNumber)) {
      setBankMessage("Enter a valid account number.");
      return;
    }
    setBankSaving(true);
    try {
      const { data: session } = await supabase.auth.getUser();
      const uid = session.user?.id;
      if (!uid) throw new Error("Not authenticated");
      const payload = { doctor_id: uid, bank_name: bankName, account_name: accountName, account_number: accountNumber, updated_at: new Date().toISOString() };
      const { error } = await supabase.from("doctor_bank_accounts").upsert(payload, { onConflict: "doctor_id" });
      if (error) throw error;
      setBankMessage("Bank details saved.");
    } catch (e: any) {
      setBankMessage(e.message || "Unable to save bank details.");
    } finally {
      setBankSaving(false);
    }
  };

  return (
    <>
      <Header showDashboardNav={true} />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
              <p className="text-gray-600">Manage bank details and request payouts</p>
            </div>
          </div>

          <Card id="request-payout">
            <CardHeader>
              <CardTitle>Request Payout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1"><label className="text-sm text-gray-600">Amount (NGN)</label><input type="number" min={0} className="w-full border rounded px-3 py-2" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} /></div>
              <div className="space-y-1"><label className="text-sm text-gray-600">Notes for admin</label><textarea className="w-full border rounded px-3 py-2 min-h-[72px]" value={payoutNote} onChange={(e) => setPayoutNote(e.target.value)} placeholder="Include account or payout details if needed." /></div>
              <div className="text-xs text-gray-600">
                Available for payout: <span className="font-semibold">{currency(availableForPayout, "NGN")}</span>
                {maxWithdrawalPercent < 100 && (
                  <span className="ml-1 text-gray-500">(Max {maxWithdrawalPercent}% of balance)</span>
                )}
              </div>
              <div className="text-xs text-gray-500">Calculated from your earnings after {commissionPercent}% commission.</div>
              {payoutMessage && <p className="text-xs text-gray-600">{payoutMessage}</p>}
              <Button type="button" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" onClick={submitPayoutRequest} disabled={payoutSubmitting}>{payoutSubmitting ? "Submitting request..." : "Submit payout request"}</Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Payout Requests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <select className="w-full border rounded px-3 py-2" value={payoutListFilter} onChange={(e) => setPayoutListFilter(e.target.value)}>
                    <option value="">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="paid">Paid</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                {payoutListLoading ? (
                  <div className="space-y-2">{[...Array(4)].map((_, i) => (<div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />))}</div>
                ) : payoutList.length ? (
                  <div className="relative pl-4 border-l">
                    {payoutList.map((r) => (
                      <div key={r.id} className="mb-4">
                        <div className="absolute -left-[7px] mt-1 w-3 h-3 rounded-full bg-blue-500" />
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{currency(r.amount, "NGN")}</div>
                          <span className="text-xs capitalize text-gray-600">{r.status}</span>
                        </div>
                        <div className="text-xs text-gray-500">{formatDateTimeNG(r.created_at)}</div>
                        {r.note ? (<div className="text-xs text-gray-600 mt-1">{r.note}</div>) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No payout requests yet.</div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              {lastPayout && (
                <Card>
                  <CardHeader>
                    <CardTitle>Last Payout Request</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-700 space-y-2">
                    <div className="flex items-center justify-between"><span className="text-gray-600">Amount</span><span className="font-semibold">{currency(lastPayout.amount, "NGN")}</span></div>
                    <div className="flex items-center justify-between"><span className="text-gray-600">Status</span><span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">{lastPayout.status}</span></div>
                    <div className="flex items-center justify-between"><span className="text-gray-600">Requested</span><span className="text-xs text-gray-600">{formatDateTimeNG(lastPayout.created_at)}</span></div>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader>
                  <CardTitle>Bank Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1"><label className="text-sm text-gray-600">Bank name</label><input className="w-full border rounded px-3 py-2" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. Access Bank" /></div>
                  <div className="space-y-1"><label className="text-sm text-gray-600">Account name</label><input className="w-full border rounded px-3 py-2" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="e.g. John Doe" /></div>
                  <div className="space-y-1"><label className="text-sm text-gray-600">Account number</label><input className="w-full border rounded px-3 py-2" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="e.g. 0123456789" /></div>
                  {bankMessage && <p className="text-xs text-gray-600">{bankMessage}</p>}
                  <Button type="button" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" onClick={saveBankDetails} disabled={bankSaving}>{bankSaving ? "Saving..." : "Save bank details"}</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
