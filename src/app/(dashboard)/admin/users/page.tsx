import { getServiceSupabase } from "@/lib/supabase/service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AdminAutoRefresh } from "@/components/admin/AdminAutoRefresh";

interface PatientRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  age: number | null;
  dob: string | null;
  blood_group: string | null;
  created_at: string;
}

const calculateAge = (dob: string | null): number | null => {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
};

export default async function AdminPatientsPage() {
  const supabase = getServiceSupabase();
  const { data } = await supabase
    .from("profiles")
    .select("id,name,email,phone,gender,age,dob,blood_group,created_at")
    .eq("type", "patient")
    .order("created_at", { ascending: false })
    .limit(200);

  const patients = (data || []) as PatientRow[];

  return (
    <div className="space-y-4">
      <AdminAutoRefresh />
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Patients</h2>
        <p className="text-sm text-gray-600">
          View all registered patients on MedicsOnline.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">Overview</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700">
          <div>
            <span className="font-semibold mr-1">Total patients:</span>
            {patients.length}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">Patient list</CardTitle>
        </CardHeader>
        <CardContent>
          {patients.length === 0 ? (
            <p className="text-sm text-gray-500">No patients registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Name</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Email</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Gender</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Age</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Blood group</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Phone</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => {
                    const effectiveAge = typeof p.age === "number" && p.age > 0 ? p.age : calculateAge(p.dob);
                    return (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="px-3 py-2 text-gray-900">{p.name || "Unnamed"}</td>
                        <td className="px-3 py-2 text-gray-700">{p.email}</td>
                        <td className="px-3 py-2 text-gray-700">{p.gender || "-"}</td>
                        <td className="px-3 py-2 text-gray-700">{effectiveAge ?? "-"}</td>
                        <td className="px-3 py-2 text-gray-700">{p.blood_group || "-"}</td>
                        <td className="px-3 py-2 text-gray-700">{p.phone || "-"}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          {new Date(p.created_at).toLocaleDateString()}
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
