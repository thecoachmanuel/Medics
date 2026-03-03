import { getServiceSupabase } from "@/lib/supabase/service";
import { notFound, redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AdminAutoRefresh } from "@/components/admin/AdminAutoRefresh";
import AdminRefreshToggle from "@/components/admin/AdminRefreshToggle";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { adminUpdateUser } from "@/actions/admin-actions";

export const dynamic = 'force-dynamic';

export default async function AdminUserDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = getServiceSupabase();

  const { data } = await supabase
    .from("profiles")
    .select(
      "id,name,email,phone,type,gender,blood_group,is_blocked,created_at,updated_at,dob"
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const profile = data as {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    type: "doctor" | "patient" | null;
    gender: string | null;
    blood_group: string | null;
    is_blocked: boolean | null;
    dob: string | null;
    created_at: string;
    updated_at: string;
  };

  async function handleUpdate(formData: FormData) {
    "use server";
    const name = String(formData.get("name") || "");
    const phone = String(formData.get("phone") || "");
    const gender = String(formData.get("gender") || "");
    const blood = String(formData.get("blood_group") || "");
    const type = String(formData.get("type") || "");
    await adminUpdateUser({
      id: String(formData.get("id") || ""),
      name: name || undefined,
      phone: phone || undefined,
      gender: gender || undefined,
      blood_group: blood || undefined,
      type: type === "doctor" || type === "patient" ? (type as any) : undefined,
    });
    redirect(`/admin/users/${id}`);
  }

  return (
    <div className="space-y-4">
      <AdminAutoRefresh storageKey={`admin_auto_refresh:/admin/users/${profile.id}`} />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">User details</h2>
          <p className="text-sm text-gray-600">View and edit this user’s profile information.</p>
        </div>
        <div className="flex items-center gap-3">
          <AdminRefreshToggle storageKey={`admin_auto_refresh:/admin/users/${profile.id}`} defaultValue="off" />
          <Link href="/admin/users" className="text-sm text-blue-600 hover:underline">Back to users</Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div><span className="font-semibold mr-1">Name:</span>{profile.name || "Unnamed"}</div>
          <div><span className="font-semibold mr-1">Email:</span>{profile.email}</div>
          <div><span className="font-semibold mr-1">Phone:</span>{profile.phone || "-"}</div>
          <div><span className="font-semibold mr-1">Role:</span>{profile.type || "-"}</div>
          <div><span className="font-semibold mr-1">Gender:</span>{profile.gender || "-"}</div>
          <div><span className="font-semibold mr-1">Blood group:</span>{profile.blood_group || "-"}</div>
          <div><span className="font-semibold mr-1">DOB:</span>{profile.dob || "-"}</div>
          <div><span className="font-semibold mr-1">Account:</span>{profile.is_blocked ? "Blocked" : "Active"}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">Edit details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="hidden" name="id" value={profile.id} />
            <div>
              <label className="text-xs font-medium text-gray-600">Full name</label>
              <input name="name" defaultValue={profile.name || ''} className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Phone</label>
              <input name="phone" defaultValue={profile.phone || ''} className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Gender</label>
              <input name="gender" defaultValue={profile.gender || ''} className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Blood group</label>
              <input name="blood_group" defaultValue={profile.blood_group || ''} className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Role</label>
              <select name="type" defaultValue={profile.type || ''} className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm">
                <option value="">Select role</option>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" size="sm">Save changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

