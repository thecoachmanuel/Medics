"use client";
import { useEffect, useState } from "react";
import Header from "@/components/landing/Header";
import { supabase } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTimeNG } from "@/lib/datetime";

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export default function Page() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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
        .select("id,title,message,created_at,is_read")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(100);
      setItems((data || []) as NotificationRow[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
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
          .select("id,title,message,created_at,is_read")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(100);
        setItems((data || []) as NotificationRow[]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const handleMarkAllRead = async () => {
    setUpdating(true);
    try {
      const { data: session } = await supabase.auth.getUser();
      const uid = session.user?.id;
      if (!uid) return;
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", uid)
        .eq("is_read", false);
      await load();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("notifications:markAllRead"));
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Header showDashboardNav={true} />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-8 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Notifications</h1>
            <p className="text-sm text-gray-600">Updates from MedicsOnline and your doctors.</p>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={loading || updating || items.length === 0}
              onClick={handleMarkAllRead}
           >
              {updating ? "Marking..." : "Mark all as read"}
            </Button>
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
                    <div
                      key={n.id}
                      className={`border rounded-lg p-3 bg-white ${n.is_read ? "opacity-70" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-gray-900">{n.title}</div>
                        <div className="text-xs text-gray-500">{formatDateTimeNG(n.created_at)}</div>
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
