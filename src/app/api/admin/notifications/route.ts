import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";

const linkFor = (title: string, message: string): string => {
  const t = (title || "").toLowerCase();
  const m = (message || "").toLowerCase();
  if (t.includes("payout") || m.includes("payout")) return "/admin/payments";
  if (t.includes("message") || t.includes("contact")) return "/admin/messages";
  if (t.includes("signup") || t.includes("user")) return "/admin/users";
  if (t.includes("appointment")) return "/admin/appointments";
  if (t.includes("review") || t.includes("rating") || m.includes("doctor")) return "/admin/doctors";
  return "/admin";
};

export async function GET() {
  try {
    const supabase = getServiceSupabase();
    const [{ data: rowsUnread }, { data: rowsAll }] = await Promise.all([
      supabase
        .from("notifications")
        .select("id", { head: false })
        .eq("role", "admin")
        .eq("is_read", false),
      supabase
        .from("notifications")
        .select("id,title,message,created_at,is_read")
        .eq("role", "admin")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const unreadCount = (rowsUnread || []).length;
    const items = (rowsAll || []).map((r: any) => ({
      id: r.id as string,
      title: String(r.title || "Notification"),
      message: String(r.message || ""),
      created_at: r.created_at as string,
      is_read: !!r.is_read,
      link: linkFor(String(r.title || ""), String(r.message || "")),
    }));

    return NextResponse.json({ unreadCount, items, now: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

