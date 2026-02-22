import { getServiceSupabase } from "@/lib/supabase/service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AdminAutoRefresh } from "@/components/admin/AdminAutoRefresh";

interface ContactMessageRow {
  id: string;
  full_name: string;
  email: string;
  subject: string | null;
  message: string;
  created_at: string;
}

export default async function AdminMessagesPage() {
  const supabase = getServiceSupabase();
  const { data } = await supabase
    .from("contact_messages")
    .select("id,full_name,email,subject,message,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const messages = (data || []) as ContactMessageRow[];

  return (
    <div className="space-y-4">
      <AdminAutoRefresh />
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Contact Messages</h2>
        <p className="text-sm text-gray-600">
          Messages submitted from the public contact form on MedicsOnline.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">
            Recent messages ({messages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-sm text-gray-500">No messages received yet.</p>
          ) : (
            <div className="space-y-4">
              {messages.map((m) => (
                <div key={m.id} className="border rounded-lg p-3 bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-gray-900">{m.full_name}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(m.created_at).toLocaleString("en-NG", {
                        timeZone: "Africa/Lagos",
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div className="text-xs text-blue-700 mb-1">{m.email}</div>
                  {m.subject && (
                    <div className="text-sm font-medium text-gray-700 mb-1">{m.subject}</div>
                  )}
                  <p className="text-sm text-gray-700 whitespace-pre-line">{m.message}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
