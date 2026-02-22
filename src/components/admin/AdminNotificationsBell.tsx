"use client";
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

interface AdminNotificationItem {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  link: string;
}

export default function AdminNotificationsBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<AdminNotificationItem[]>([]);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    const res = await fetch("/api/admin/notifications", { cache: "no-store" });
    if (!res.ok) return;
    const json = (await res.json()) as { unreadCount?: number; items?: AdminNotificationItem[] };
    setUnread(Math.max(0, Number(json.unreadCount || 0)));
    setItems(Array.isArray(json.items) ? json.items : []);
  };

  useEffect(() => {
    load();
    const id = window.setInterval(load, 300);
    const c1 = supabase
      .channel("admin_notifications_doctor_payouts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "doctor_payout_requests" }, load)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "doctor_payout_requests" }, load)
      .subscribe();
    const c2 = supabase
      .channel("admin_notifications_contact_messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contact_messages" }, load)
      .subscribe();
    const c3 = supabase
      .channel("admin_notifications_table_notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, load)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications" }, load)
      .subscribe();
    const onDoc = (e: MouseEvent) => {
      if (!panelRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => {
      clearInterval(id);
      document.removeEventListener("click", onDoc);
      supabase.removeChannel(c1);
      supabase.removeChannel(c2);
      supabase.removeChannel(c3);
    };
  }, []);

  const markRead = async (id?: string) => {
    try {
      await fetch("/api/admin/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { ids: [id] } : { all: true }),
      });
      load();
    } catch {}
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className="relative inline-flex items-center justify-center rounded-md border px-2 py-1 text-sm bg-white hover:bg-gray-50"
        onClick={() => setOpen((v) => !v)}
        aria-label="Admin notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] h-5 min-w-5 px-1">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[92vw] rounded-md border bg-white shadow-lg z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <div className="text-sm font-medium">Notifications</div>
            <button
              type="button"
              className="text-xs text-blue-600 hover:underline"
              onClick={() => markRead()}
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-96 overflow-auto">
            {items.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">No notifications</div>
            ) : (
              items.map((n) => (
                <div key={n.id} className={`px-3 py-2 border-b last:border-0 ${n.is_read ? "opacity-70" : ""}`}>
                  <Link href={n.link} onClick={() => markRead(n.id)} className="block">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900">{n.title}</div>
                      <div className="text-[11px] text-gray-500">{new Date(n.created_at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                    <div className="text-xs text-gray-600 line-clamp-2">{n.message}</div>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

