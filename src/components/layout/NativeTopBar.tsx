"use client";

import { useAppDetection } from "@/hooks/use-app-detection";
import { userAuthStore } from "@/store/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";
import { ArrowLeft, Bell, LogOut, Stethoscope, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

function NativeTopBarContent() {
  const isApp = useAppDetection();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = userAuthStore();
  const [mounted, setMounted] = useState(false);
  const [headerLogoUrl, setHeaderLogoUrl] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const initialNotificationsLoadedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let alive = true;
    const loadBrand = async () => {
      try {
        const res = await fetch("/api/homepage");
        if (!res.ok) return;
        const json = (await res.json()) as { config?: { headerLogoUrl?: string | null } };
        if (alive) setHeaderLogoUrl(json?.config?.headerLogoUrl ?? null);
      } catch {
        if (alive) setHeaderLogoUrl(null);
      }
    };
    loadBrand();
    return () => {
      alive = false;
    };
  }, []);

  const shouldRender = useMemo(() => {
    if (!mounted || !isApp || !user) return false;
    if (pathname.includes("/call/")) return false;
    if (pathname.includes("/patient/booking/")) return false;
    if (pathname.includes("/login") || pathname.includes("/signup")) return false;
    return pathname.startsWith("/patient/") || pathname.startsWith("/doctor/");
  }, [isApp, mounted, pathname, user]);

  if (!shouldRender) return null;

  const currentUser = user;
  const isDashboard = /^(\/doctor|\/patient)\/dashboard(\/|$)/.test(pathname);
  const showBack = !isDashboard;
  const showBell = isDashboard;

  const fallback = (currentUser.name?.trim()?.[0] || currentUser.email?.trim()?.[0] || "U").toUpperCase();

  const handleLogout = async () => {
    await logout();
    const role = currentUser.type === "doctor" ? "doctor" : "patient";
    router.replace(`/login/${role}?source=mobile_app`);
  };

  const handleProfile = () => {
    const path = currentUser.type === "doctor" ? "/doctor/profile" : "/patient/profile";
    router.push(path);
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(`/${currentUser.type}/dashboard`);
  };

  const handleLogo = () => {
    router.push(`/${currentUser.type}/dashboard`);
  };

  const handleNotifications = () => {
    router.push(`/${currentUser.type}/notifications`);
  };

  useEffect(() => {
    if (!isApp) return;

    let isMounted = true;

    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", currentUser.id)
          .eq("is_read", false);

        if (error) {
          if (isMounted) setUnreadCount(0);
          return;
        }

        if (isMounted) setUnreadCount(count ?? 0);
      } catch {
        if (isMounted) setUnreadCount(0);
      }
    };

    const handleMarkedAllRead = () => {
      if (!isMounted) return;
      setUnreadCount(0);
    };

    fetchUnreadCount().finally(() => {
      initialNotificationsLoadedRef.current = true;
    });

    const channel = supabase
      .channel(`notifications:native:${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          fetchUnreadCount();

          if (!initialNotificationsLoadedRef.current) return;

          const row = payload.new as { title?: string | null; message?: string | null };
          const title = row?.title?.trim() || "New notification";
          const description = row?.message?.trim() || undefined;

          toast(title, {
            description,
          });
        }
      )
      .subscribe();

    window.addEventListener("notifications:markAllRead", handleMarkedAllRead);

    return () => {
      isMounted = false;
      initialNotificationsLoadedRef.current = false;
      window.removeEventListener("notifications:markAllRead", handleMarkedAllRead);
      supabase.removeChannel(channel);
    };
  }, [currentUser.id, isApp]);

  return (
    <div className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showBack && (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-gray-100 active:bg-gray-200"
            >
              <ArrowLeft className="h-5 w-5 text-gray-900" />
            </button>
          )}

          <button type="button" onClick={handleLogo} className="flex items-center gap-2">
            {headerLogoUrl ? (
              <img src={headerLogoUrl} alt="MedicsOnline" className="h-7 w-auto" />
            ) : (
              <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="text-sm font-semibold text-gray-900">MedicsOnline</div>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {showBell && (
            <button
              type="button"
              onClick={handleNotifications}
              aria-label="Notifications"
              className="relative h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-gray-100 active:bg-gray-200"
            >
              <Bell className="h-5 w-5 text-gray-900" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 min-w-5 h-5 px-1 text-xs bg-red-500 hover:bg-red-600 justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="flex items-center gap-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={currentUser.profileImage || ""} alt={currentUser.name || "Profile"} />
                  <AvatarFallback>{fallback}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">{currentUser.name || "Account"}</span>
                  <span className="text-xs text-gray-500">{currentUser.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfile}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleNotifications}>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

export function NativeTopBar() {
  return (
    <Suspense fallback={null}>
      <NativeTopBarContent />
    </Suspense>
  );
}
