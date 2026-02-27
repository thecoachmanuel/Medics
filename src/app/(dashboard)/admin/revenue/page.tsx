import { getServiceSupabase } from "@/lib/supabase/service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatDateTimeNG } from "@/lib/datetime";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminRevenuePage() {
  const supabase = getServiceSupabase();

  // Fetch successful payments
  const { data: payments, error } = await supabase
    .from("payments")
    .select("id, amount, consultation_fee, platform_fee, commission_amount, created_at, status, doctor_id, patient_id")
    .eq("status", "success")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return <div className="p-8 text-red-500">Failed to load revenue data</div>;
  }

  // Collect user IDs for manual join
  const userIds = new Set<string>();
  payments.forEach((p) => {
    if (p.doctor_id) userIds.add(p.doctor_id);
    if (p.patient_id) userIds.add(p.patient_id);
  });

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, email")
    .in("id", Array.from(userIds));

  const profileMap = new Map<string, { name: string; email: string }>();
  profiles?.forEach((p) => {
    profileMap.set(p.id, { name: p.name || "Unknown", email: p.email || "" });
  });

  // Calculate totals
  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalCommission = payments.reduce((sum, p) => sum + (p.commission_amount || 0), 0);
  const totalPlatformFees = payments.reduce((sum, p) => sum + (p.platform_fee || 0), 0);
  const totalEarnings = totalCommission + totalPlatformFees;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Revenue Tracking</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transaction Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₦{totalEarnings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Commission + Platform Fees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalCommission.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Platform Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalPlatformFees.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Consultation</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">Platform Fee</TableHead>
                <TableHead className="text-right">Net Earning</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment: any) => {
                const doctor = profileMap.get(payment.doctor_id);
                const patient = profileMap.get(payment.patient_id);
                const earning = (payment.commission_amount || 0) + (payment.platform_fee || 0);
                
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTimeNG(new Date(payment.created_at))}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{patient?.name || "Unknown"}</div>
                      <div className="text-xs text-gray-500">{patient?.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{doctor?.name || "Unknown"}</div>
                      <div className="text-xs text-gray-500">{doctor?.email}</div>
                    </TableCell>
                    <TableCell className="text-right font-medium">₦{payment.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-gray-600">₦{(payment.consultation_fee || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right text-blue-600">₦{(payment.commission_amount || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right text-purple-600">₦{(payment.platform_fee || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">₦{earning.toLocaleString()}</TableCell>
                  </TableRow>
                );
              })}
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
