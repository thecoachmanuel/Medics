import { getServiceSupabase } from "@/lib/supabase/service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { setDoctorVerification } from "@/actions/admin-actions";

interface DoctorRow {
  id: string;
  name: string | null;
  email: string | null;
  specialization: string | null;
  is_verified: boolean | null;
  created_at: string;
}

export default async function AdminDoctorsPage() {
  const supabase = getServiceSupabase();
  const { data } = await supabase
    .from("profiles")
    .select("id,name,email,specialization,is_verified,created_at")
    .eq("type", "doctor")
    .order("created_at", { ascending: false })
    .limit(200);

  const doctors = (data || []) as DoctorRow[];
  const pendingCount = doctors.filter((d) => !d.is_verified).length;

  async function handleVerify(formData: FormData) {
    "use server";
    const id = String(formData.get("id") || "");
    const verifiedFlag = String(formData.get("verified") || "false") === "true";
    if (!id) return;
    await setDoctorVerification(id, verifiedFlag);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Doctors</h2>
        <p className="text-sm text-gray-600">
          Approve new doctors and review their status on MedicsOnline.
        </p>
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
          {doctors.length === 0 ? (
            <p className="text-sm text-gray-500">No doctors registered yet.</p>
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
                  {doctors.map((d) => {
                    const isVerified = !!d.is_verified;
                    return (
                      <tr key={d.id} className="border-b last:border-0">
                        <td className="px-3 py-2 text-gray-900">{d.name || "Unnamed"}</td>
                        <td className="px-3 py-2 text-gray-700">{d.email}</td>
                        <td className="px-3 py-2 text-gray-700">{d.specialization || "-"}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          {new Date(d.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              isVerified
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {isVerified ? "Approved" : "Pending"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <form action={handleVerify} className="inline">
                            <input type="hidden" name="id" value={d.id} />
                            <input
                              type="hidden"
                              name="verified"
                              value={isVerified ? "false" : "true"}
                            />
                            <Button
                              type="submit"
                              size="sm"
                              variant={isVerified ? "outline" : "default"}
                            >
                              {isVerified ? "Revoke" : "Approve"}
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

