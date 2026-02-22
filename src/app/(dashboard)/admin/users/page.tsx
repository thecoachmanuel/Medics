import { getServiceSupabase } from "@/lib/supabase/service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AdminAutoRefresh } from "@/components/admin/AdminAutoRefresh";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateUserBlockStatus, adminCreateUser, adminDeleteUser, adminUpdateUser } from "@/actions/admin-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  is_blocked: boolean | null;
  created_at: string;
  profile_image?: string | null;
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
  searchParams: Promise<{ role?: string; q?: string; page?: string; perPage?: string }>;
}) {
  const searchParams = (await props.searchParams) || {};
  const roleParam = (searchParams.role || "all").toLowerCase();
  const roleFilter: "all" | "doctor" | "patient" =
    roleParam === "all" || roleParam === "doctor" || roleParam === "patient"
      ? (roleParam as "all" | "doctor" | "patient")
      : "all";
  const search = (searchParams.q || "").trim().toLowerCase();
  const page = Math.max(1, parseInt(String(searchParams.page || "1"), 10) || 1);
  const perPageRaw = parseInt(String(searchParams.perPage || "20"), 10) || 20;
  const perPage = Math.min(100, Math.max(5, perPageRaw));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const supabase = getServiceSupabase();
  let query = supabase
    .from("profiles")
    .select("id,name,email,phone,gender,age,dob,blood_group,type,is_blocked,created_at,profile_image")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (roleFilter !== "all") {
    query = query.eq("type", roleFilter);
  }
  if (search) {
    // OR filter across name/email/phone with ilike
    const like = `%${search}%`;
    query = query.or(
      `name.ilike.${like},email.ilike.${like},phone.ilike.${like}`,
    );
  }

  // Count queries mirror filters for accurate totals
  const baseCount = supabase.from("profiles").select("id", { count: "exact", head: true });
  const doctorCountQ = supabase.from("profiles").select("id", { count: "exact", head: true }).eq("type", "doctor");
  const patientCountQ = supabase.from("profiles").select("id", { count: "exact", head: true }).eq("type", "patient");

  const filteredCountQ = (() => {
    let q = supabase.from("profiles").select("id", { count: "exact", head: true });
    if (roleFilter !== "all") q = q.eq("type", roleFilter);
    if (search) {
      const like = `%${search}%`;
      q = q.or(`name.ilike.${like},email.ilike.${like},phone.ilike.${like}`);
    }
    return q;
  })();

  const [{ data }, totalAllRes, totalDoctorsRes, totalPatientsRes, totalFilteredRes] = await Promise.all([
    query,
    baseCount,
    doctorCountQ,
    patientCountQ,
    filteredCountQ,
  ]);

  const rows = (data || []) as UserRow[];

  const users = rows;

  const totalUsers = totalAllRes.count ?? rows.length;
  const totalDoctors = totalDoctorsRes.count ?? rows.filter((u) => u.type === "doctor").length;
  const totalPatients = totalPatientsRes.count ?? rows.filter((u) => u.type === "patient").length;
  const totalFiltered = totalFilteredRes.count ?? users.length;

  async function handleBlock(formData: FormData) {
    "use server";
    const id = String(formData.get("id") || "");
    const roleValue = String(formData.get("role") || "");
    const actionValue = String(formData.get("action") || "");

    if (!id) return;
    if (roleValue !== "doctor" && roleValue !== "patient") return;
    if (actionValue !== "block" && actionValue !== "unblock") return;

    await updateUserBlockStatus(id, roleValue, actionValue === "block" ? "block" : "unblock");
  }

  async function handleCreate(formData: FormData) {
    "use server";
    const role = String(formData.get("new_role") || "");
    const email = String(formData.get("new_email") || "");
    const password = String(formData.get("new_password") || "");
    const name = String(formData.get("new_name") || "");
    const phone = String(formData.get("new_phone") || "");
    const gender = String(formData.get("new_gender") || "");
    const blood = String(formData.get("new_blood") || "");
    if (!email || !password || (role !== "doctor" && role !== "patient")) return;
    await adminCreateUser({ email, password, name: name || undefined, type: role as any, phone: phone || undefined, gender: gender || undefined, blood_group: blood || undefined });
  }

  async function handleDelete(formData: FormData) {
    "use server";
    const id = String(formData.get("id") || "");
    if (!id) return;
    await adminDeleteUser(id);
  }

  async function handleUpdate(formData: FormData) {
    "use server";
    const id = String(formData.get("id") || "");
    const name = String(formData.get("name") || "");
    const phone = String(formData.get("phone") || "");
    const gender = String(formData.get("gender") || "");
    const blood = String(formData.get("blood_group") || "");
    const type = String(formData.get("type") || "");
    if (!id) return;
    await adminUpdateUser({ id, name: name || undefined, phone: phone || undefined, gender: gender || undefined, blood_group: blood || undefined, type: type === "doctor" || type === "patient" ? (type as any) : undefined });
  }

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
            {search || roleFilter !== 'all' ? (
              <span className="ml-2 text-xs text-gray-500">(matching filter: {totalFiltered})</span>
            ) : null}
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
          <div className="mb-6">
            <form action={handleCreate} className="grid grid-cols-1 md:grid-cols-7 gap-2">
              <select name="new_role" className="border rounded px-3 py-2 text-sm">
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
              <input name="new_name" placeholder="Full name" className="border rounded px-3 py-2 text-sm" />
              <input name="new_email" placeholder="Email" className="border rounded px-3 py-2 text-sm" />
              <input name="new_phone" placeholder="Phone" className="border rounded px-3 py-2 text-sm" />
              <input name="new_gender" placeholder="Gender" className="border rounded px-3 py-2 text-sm" />
              <input name="new_blood" placeholder="Blood group" className="border rounded px-3 py-2 text-sm" />
              <input name="new_password" placeholder="Temp password" className="border rounded px-3 py-2 text-sm" />
              <div className="md:col-span-7">
                <Button type="submit" size="sm">Create user</Button>
              </div>
            </form>
          </div>
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
              <select
                name="perPage"
                defaultValue={String(perPage)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Rows per page"
              >
                <option value="20">20 / page</option>
                <option value="50">50 / page</option>
                <option value="100">100 / page</option>
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
                    <th className="text-left px-3 py-2 font-medium text-gray-600">User</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Email</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Role</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Gender</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Age</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Blood group</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Phone</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Joined</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Account</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Edit</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((p) => {
                    const effectiveAge =
                      typeof p.age === "number" && p.age > 0 ? p.age : calculateAge(p.dob);
                    const isBlocked = !!p.is_blocked;
                    const accountLabel = isBlocked ? "Blocked" : "Active";
                    const accountClass = isBlocked
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800";
                    return (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="px-3 py-2 text-gray-900">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={p.profile_image ?? undefined} alt={p.name ?? undefined} />
                              <AvatarFallback>{(p.name || "?").slice(0, 1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span>{p.name || "Unnamed"}</span>
                          </div>
                        </td>
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
                        <td className="px-3 py-2">
                          {p.type === "doctor" || p.type === "patient" ? (
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${accountClass}`}
                            >
                              {accountLabel}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <form action={handleUpdate} className="flex flex-col gap-1">
                            <input type="hidden" name="id" value={p.id} />
                            <div className="flex gap-2">
                              <input name="name" defaultValue={p.name || ''} placeholder="Name" className="w-28 border rounded px-2 py-1 text-xs" />
                              <input name="phone" defaultValue={p.phone || ''} placeholder="Phone" className="w-28 border rounded px-2 py-1 text-xs" />
                            </div>
                            <div className="flex gap-2">
                              <input name="gender" defaultValue={p.gender || ''} placeholder="Gender" className="w-24 border rounded px-2 py-1 text-xs" />
                              <input name="blood_group" defaultValue={p.blood_group || ''} placeholder="Blood" className="w-20 border rounded px-2 py-1 text-xs" />
                              <select name="type" defaultValue={p.type || ''} className="border rounded px-2 py-1 text-xs">
                                <option value="">Role</option>
                                <option value="patient">Patient</option>
                                <option value="doctor">Doctor</option>
                              </select>
                              <Button type="submit" size="sm" variant="outline">Save</Button>
                            </div>
                          </form>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {p.type === "doctor" || p.type === "patient" ? (
                            <form action={handleBlock} className="inline">
                              <input type="hidden" name="id" value={p.id} />
                              <input type="hidden" name="role" value={p.type} />
                              <input
                                type="hidden"
                                name="action"
                                value={isBlocked ? "unblock" : "block"}
                              />
                              <Button type="submit" size="sm" variant="outline">
                                {isBlocked ? "Unblock" : "Block"}
                              </Button>
                            </form>
                          ) : null}
                          <form action={handleDelete} className="inline ml-2">
                            <input type="hidden" name="id" value={p.id} />
                            <Button type="submit" size="sm" variant="outline">Delete</Button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="flex items-center justify-between mt-3">
                <div className="text-xs text-gray-600">
                  Showing {(from + 1)}-{Math.min(from + users.length, totalFiltered)} of {totalFiltered}
                </div>
                <div className="flex items-center gap-2">
                  <a
                    className={`px-3 py-1 rounded border text-xs ${page > 1 ? 'bg-white' : 'opacity-50 cursor-not-allowed'}`}
                    href={`/admin/users?role=${roleFilter}&q=${encodeURIComponent(search)}&page=${Math.max(1, page - 1)}&perPage=${perPage}`}
                    aria-disabled={page <= 1}
                  >
                    Prev
                  </a>
                  <a
                    className={`px-3 py-1 rounded border text-xs ${from + users.length < totalFiltered ? 'bg-white' : 'opacity-50 cursor-not-allowed'}`}
                    href={`/admin/users?role=${roleFilter}&q=${encodeURIComponent(search)}&page=${page + 1}&perPage=${perPage}`}
                    aria-disabled={from + users.length >= totalFiltered}
                  >
                    Next
                  </a>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
