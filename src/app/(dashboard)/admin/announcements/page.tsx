"use client";
import { useEffect, useState, FormEvent } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createAnnouncement } from "@/actions/admin-actions";
import { supabase } from "@/lib/supabase/client";
import { AdminAutoRefresh } from "@/components/admin/AdminAutoRefresh";
import AdminRefreshToggle from "@/components/admin/AdminRefreshToggle";

type Audience = "all" | "doctors" | "patients" | "user";

interface AnnouncementRow {
  id: string;
  title: string;
  message: string;
  audience: Audience;
  target_user_id: string | null;
  created_at: string;
}

export default function AdminAnnouncementsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<Audience>("all");
  const [targetUserId, setTargetUserId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [items, setItems] = useState<AnnouncementRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("announcements")
        .select("id,title,message,audience,target_user_id,created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      setItems((data || []) as AnnouncementRow[]);
    };
    load();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const result = await createAnnouncement({
        title,
        message,
        audience,
        targetUserId: audience === "user" ? targetUserId || undefined : undefined,
      });
      if (!result.success) {
        setError(result.error || "Unable to create announcement.");
        return;
      }
      setSuccess("Announcement created and notifications sent.");
      setTitle("");
      setMessage("");
      setTargetUserId("");
    } finally {
      setSubmitting(false);
    }
  };

  const audienceLabel = (value: Audience): string => {
    if (value === "doctors") return "Doctors";
    if (value === "patients") return "Patients";
    if (value === "user") return "Single user";
    return "All users";
  };

  return (
    <div className="space-y-4">
      <AdminAutoRefresh intervalMs={300} storageKey="admin_auto_refresh:/admin/announcements" defaultEnabled={true} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Announcements</h2>
          <p className="text-sm text-gray-600">Send broadcast messages to doctors, patients, or specific users. They appear inside the in-app notifications for recipients.</p>
        </div>
        <AdminRefreshToggle storageKey="admin_auto_refresh:/admin/announcements" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">Create announcement</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Title</label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Audience</label>
                <select
                  className="border rounded px-3 py-2 w-full"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as Audience)}
                >
                  <option value="all">All users</option>
                  <option value="doctors">Doctors</option>
                  <option value="patients">Patients</option>
                  <option value="user">Specific user id</option>
                </select>
              </div>
            </div>

            {audience === "user" && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Target user id</label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="Supabase profile id"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Message</label>
              <textarea
                className="border rounded px-3 py-2 w-full min-h-[120px]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              disabled={submitting}
            >
              {submitting ? "Sending..." : "Send announcement"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">Recent announcements</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-gray-500">No announcements created yet.</p>
          ) : (
            <div className="space-y-3">
              {items.map((a) => (
                <div key={a.id} className="border rounded-lg p-3 bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-gray-900">{a.title}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(a.created_at).toLocaleString("en-NG", {
                        timeZone: "Africa/Lagos",
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mb-1">Audience: {audienceLabel(a.audience)}</div>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{a.message}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
