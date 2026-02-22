import { getServiceSupabase } from "@/lib/supabase/service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AdminAutoRefresh } from "@/components/admin/AdminAutoRefresh";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  age: number | null;
  dob: string | null;
  blood_group: string | null;
  type: "doctor" | "patient" | null;
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

export default async function AdminUsersPage(props: {
  searchParams: Promise<{ role?: string; q?: string }>;
}) {
  const searchParams = (await props.searchParams) || {};
  const roleParam = (searchParams.role || "patient").toLowerCase();
  const roleFilter: "all" | "doctor" | "patient" =
    roleParam === "all" || roleParam === "doctor" || roleParam === "patient"
      ? (roleParam as "all" | "doctor" | "patient")
      : "patient";
  const search = (searchParams.q || "").trim().toLowerCase();
  const supabase = getServiceSupabase();
  const { data } = await supabase
    .from("profiles")
    .select("id,name,email,phone,gender,age,dob,blood_group,type,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data || []) as UserRow[];

  const users = rows.filter((u) => {
    if (roleFilter !== "all" && u.type !== roleFilter) return false;
    if (!search) return true;
    const name = (u.name || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    const phone = (u.phone || "").toLowerCase();
    return (
      name.includes(search) ||
      email.includes(search) ||
      phone.includes(search)
    );
  });

  const totalUsers = rows.length;
  const totalPatients = rows.filter((u) => u.type === "patient").length;
  const totalDoctors = rows.filter((u) => u.type === "doctor").length;

  return (
    <div className="space-y-4">
      <AdminAutoRefresh />
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Users</h2>
        <p className="text-sm text-gray-600">
          View all registered users on MedicsOnline and filter by role.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">Overview</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700">
          <div>
            <span className="font-semibold mr-1">Total users:</span>
            {totalUsers}
          </div>
          <div className="mt-1 flex gap-4 text-xs text-gray-600">
            <span>
              Patients: <span className="font-semibold">{totalPatients}</span>
            </span>
            <span>
              Doctors: <span className="font-semibold">{totalDoctors}</span>
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">User list</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col md:flex-row md:items-center gap-3">
            <form className="flex flex-1 flex-col md:flex-row gap-3" action="/admin/users" method="get">
              <Input
                name="q"
                placeholder="Search by name, email, or phone"
                defaultValue={searchParams.q || ""}
                className="md:max-w-xs"
              />
              <select
                name="role"
                defaultValue={roleFilter}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All roles</option>
                <option value="patient">Patients</option>
                <option value="doctor">Doctors</option>
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
                  <a href="/admin/users">Reset</a>
                </Button>
              </div>
            </form>
          </div>
          {users.length === 0 ? (
            <p className="text-sm text-gray-500">No users found for this filter.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Name</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Email</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Role</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Gender</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Age</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Blood group</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Phone</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((p) => {
                    const effectiveAge =
                      typeof p.age === "number" && p.age > 0 ? p.age : calculateAge(p.dob);
                    return (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="px-3 py-2 text-gray-900">{p.name || "Unnamed"}</td>
                        <td className="px-3 py-2 text-gray-700">{p.email}</td>
                        <td className="px-3 py-2 text-gray-700">
                          {p.type === "doctor" ? "Doctor" : p.type === "patient" ? "Patient" : "-"}
                        </td>
                        <td className="px-3 py-2 text-gray-700">{p.gender || "-"}</td>
                        <td className="px-3 py-2 text-gray-700">{effectiveAge ?? "-"}</td>
                        <td className="px-3 py-2 text-gray-700">{p.blood_group || "-"}</td>
                        <td className="px-3 py-2 text-gray-700">{p.phone || "-"}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          {new Date(p.created_at).toLocaleDateString("en-NG", {
                            timeZone: "Africa/Lagos",
                          })}
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
