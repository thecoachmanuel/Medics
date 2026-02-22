"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  Bell,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Mail,
  Settings,
  Stethoscope,
  Users2,
} from "lucide-react";

const items = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/users", icon: Users2, label: "Users" },
  { href: "/admin/doctors", icon: Stethoscope, label: "Doctors" },
  { href: "/admin/appointments", icon: ClipboardList, label: "Appointments" },
  { href: "/admin/payments", icon: CreditCard, label: "Payments" },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/admin/messages", icon: Mail, label: "Messages" },
  { href: "/admin/announcements", icon: Bell, label: "Announcements" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    document.cookie = "medics_admin=; path=/; max-age=0";
    router.push("/admin/login");
  };

  useEffect(() => {
    const hasSession = document.cookie.includes("medics_admin=1");
    if (!hasSession) {
      router.replace("/admin/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`bg-white border-r transition-all duration-200 ${collapsed ? "w-16" : "w-64"}`}>
        <div className="h-16 flex items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>MO</AvatarFallback>
            </Avatar>
            {!collapsed && <span className="font-bold text-gray-900">MedicsOnline</span>}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)}>
            <BarChart3 className="h-4 w-4 rotate-90" />
          </Button>
        </div>
        <Separator />
        <nav className="p-2 space-y-1">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer hover:bg-accent/50 ${
                    active ? "bg-accent/70" : ""
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Admin Portal</h1>
            <p className="text-xs text-gray-500">Welcome back, System Administrator</p>
          </div>
          <Button variant="outline" size="sm" onClick={logout} className="cursor-pointer">
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
