"use client";
import { useEffect, useState } from "react";
import Header from "@/components/landing/Header";
import { supabase } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  created_at: string;
  read_at: string | null;
}

export default function Page() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: session } = await supabase.auth.getUser();
        const uid = session.user?.id;
        if (!uid) {
          setItems([]);
          return;
        }
        const { data } = await supabase
          .from("notifications")
          .select("id,title,message,created_at,read_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(100);
        setItems((data || []) as NotificationRow[]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <>
      <Header showDashboardNav={true} />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-8 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Notifications</h1>
            <p className="text-sm text-gray-600">Updates from MedicsOnline and your patients.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-700">Recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <p className="text-sm text-gray-500">You do not have any notifications yet.</p>
              ) : (
                <div className="space-y-3">
                  {items.map((n) => (
                    <div key={n.id} className="border rounded-lg p-3 bg-white">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-gray-900">{n.title}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(n.created_at).toLocaleString()}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
