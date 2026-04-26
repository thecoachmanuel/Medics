"use client";
import { Bell, Calendar, CreditCard, DollarSign, LogOut, Settings, User, MessageSquare } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { userAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useAppointmentStore } from "@/store/appointmentStore";
import { supabase } from "@/lib/supabase/client";

interface HeaderProps {
  showDashboardNav?: boolean;
  siteName?: string;
  logoUrl?: string | null;
}

interface NavigationItem {
  lable: string;
  icon: React.ComponentType<any>;
  href: string;
  active: boolean;
}
import { useAppDetection } from "@/hooks/use-app-detection";

const Header: React.FC<HeaderProps> = ({ showDashboardNav = false, siteName, logoUrl }) => {
  const isApp = useAppDetection();
  const { user, isAuthenticated, logout } = userAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { unreadCount: chatUnreadCount, fetchUnreadCount } = useChatStore();
  const { appointments, fetchAppointments } = useAppointmentStore();
  const brandName = siteName && siteName.trim().length > 0 ? siteName : "MedicsOnline";
  const headerLogoUrl = "/MedicsOnline_logo.png";
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user?.id) {
      if (appointments.length === 0) fetchAppointments(user.type as any);
      else fetchUnreadCount(user.id, appointments.map(a => a._id));
      
      const channel = supabase.channel('global_unread')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'appointment_messages' }, (payload) => {
           const msg = payload.new as any;
           if (msg.sender_id !== user.id && appointments.some(a => a._id === msg.appointment_id)) {
              useChatStore.setState(s => ({ unreadCount: s.unreadCount + 1 }));
           }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'appointment_messages' }, (payload) => {
           const msg = payload.new as any;
           if (msg.is_read && msg.sender_id !== user.id && appointments.some(a => a._id === msg.appointment_id)) {
              useChatStore.getState().fetchUnreadCount(user.id, appointments.map(a => a._id));
           }
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user?.id, appointments]);

  useEffect(() => {
    const checkAdmin = () => {
      const match = document.cookie.match(new RegExp('(^| )medics_admin=([^;]+)'));
      if (match && match[2] === '1') {
        setIsAdmin(true);
      }
    };
    checkAdmin();
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  void logoUrl;

  useEffect(() => {
    if (isApp) return;
    if (!user || !showDashboardNav) {
      setUnreadCount(0);
      return;
    }

    let isMounted = true;

    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false);

        if (error) {
          console.error("Failed to fetch notifications", error);
          if (isMounted) setUnreadCount(0);
          return;
        }

        if (isMounted) {
          setUnreadCount(count ?? 0);
        }
      } catch (error) {
        console.error("Failed to fetch notifications", error);
        if (isMounted) {
          setUnreadCount(0);
        }
      }
    };

    const handleMarkedAllRead = () => {
      if (!isMounted) return;
      setUnreadCount(0);
    };

    fetchUnreadCount();

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    window.addEventListener("notifications:markAllRead", handleMarkedAllRead);

    return () => {
      isMounted = false;
      window.removeEventListener("notifications:markAllRead", handleMarkedAllRead);
      supabase.removeChannel(channel);
    };
  }, [isApp, user?.id, showDashboardNav]);

  const getDashboardNavigation = (): NavigationItem[] => {
    if (!user || !showDashboardNav) return [];

    if (user?.type === "patient") {
      return [
        {
          lable: "Appointments",
          icon: Calendar,
          href: "/patient/dashboard",
          active: pathname?.includes("/patient/dashboard") || false,
        },
        {
          lable: "Chat",
          icon: MessageSquare,
          href: "/chat",
          active: pathname?.includes("/chat") || false,
        },
      ];
    } else if (user?.type === "doctor") {
      return [
        {
          lable: "Dashboard",
          icon: Calendar,
          href: "/doctor/dashboard",
          active: pathname?.includes("/doctor/dashboard") || false,
        },
        {
          lable: "Appointments",
          icon: Calendar,
          href: "/doctor/appointments",
          active: pathname?.includes("/doctor/appointments") || false,
        },
        {
          lable: "Chat",
          icon: MessageSquare,
          href: "/chat",
          active: pathname?.includes("/chat") || false,
        },
        {
          lable: "Payouts",
          icon: DollarSign,
          href: "/doctor/payouts",
          active: pathname?.includes("/doctor/payouts") || false,
        },
      ];
    }
    return [];
  };

  if (isApp) return null;
  return (
    <header className="border-b bg-white/80 backdrop-blur-md fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
        {/* Left side -> logo  + navigation */}
        <div className="flex items-center space-x-12">
          <button
            type="button"
            onClick={() => {
              if (isAuthenticated && user) {
                if (user.type === "patient" && pathname?.startsWith("/patient")) {
                  router.push("/patient/dashboard");
                  return;
                }
                if (user.type === "doctor" && pathname?.startsWith("/doctor")) {
                  router.push("/doctor/dashboard");
                  return;
                }
              }
              router.push("/");
            }}
            className="flex items-center space-x-2 focus:outline-none transition-transform active:scale-95"
          >
            <img
              src={headerLogoUrl}
              alt={brandName}
              className="h-7 md:h-10 w-auto"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </button>

          {/* Dashboard navigation - Desktop only */}
          {isAuthenticated && showDashboardNav && (
            <nav className="hidden lg:flex items-center space-x-8">
              {getDashboardNavigation().map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center space-x-2 py-2 transition-all ${
                    item.active
                      ? "text-blue-600"
                      : "text-gray-500 hover:text-blue-600"
                  }`}
                >
                  <div className={`p-1.5 rounded-lg transition-colors ${item.active ? "bg-blue-50" : "group-hover:bg-blue-50"}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold tracking-tight">{item.lable}</span>
                  {item.lable === "Chat" && chatUnreadCount > 0 && (
                    <span className="flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-black bg-red-500 text-white shadow-lg shadow-red-200 border-2 border-white leading-none">
                      {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                    </span>
                  )}
                  {item.active && (
                    <div className="absolute -bottom-[21px] left-0 right-0 h-1 bg-blue-600 rounded-t-full shadow-[0_-2px_8px_rgba(37,99,235,0.4)]" />
                  )}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {isAuthenticated && showDashboardNav ? (
          <div className="flex items-center space-x-2 md:space-x-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative w-10 h-10 rounded-xl hover:bg-gray-50 transition-colors"
              onClick={() => {
                if (!user) return;
                const base = `/${user.type}`;
                router.push(`${base}/notifications`);
              }}
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 flex items-center justify-center text-[9px] font-black bg-red-500 text-white rounded-full border-2 border-white shadow-sm">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 pl-2 pr-1 md:pr-4 h-10 md:h-12 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
                >
                  <div className="relative">
                    <Avatar className="w-8 h-8 md:w-9 md:h-9 border-2 border-white shadow-sm">
                      <AvatarImage
                        src={user?.profileImage}
                        alt={user?.name}
                      />
                      <AvatarFallback className="bg-blue-50 text-blue-600 text-xs font-black">
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                  </div>
                  <div className="hidden md:flex flex-col items-start leading-none">
                    <p className="text-sm font-black text-gray-900">
                      {user?.name?.split(' ')[0]}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                      {user?.type}
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl border-gray-100">
                <DropdownMenuLabel className="p-2 mb-2 bg-gray-50/50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                      <AvatarImage
                        src={user?.profileImage}
                        alt={user?.name}
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-100" />
                
                {/* Dynamic Menu Items based on user type */}
                {user?.type === "doctor" && (
                  <>
                    <DropdownMenuItem asChild className="rounded-lg focus:bg-blue-50 focus:text-blue-600 cursor-pointer">
                      <Link href="/doctor/dashboard" className="flex items-center">
                        <Calendar className="w-4 h-4 mr-3" />
                        <span className="font-medium">Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg focus:bg-blue-50 focus:text-blue-600 cursor-pointer">
                      <Link href="/doctor/appointments" className="flex items-center">
                        <Calendar className="w-4 h-4 mr-3" />
                        <span className="font-medium">Appointments</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                
                {user?.type === "patient" && (
                  <DropdownMenuItem asChild className="rounded-lg focus:bg-blue-50 focus:text-blue-600 cursor-pointer">
                    <Link href="/patient/dashboard" className="flex items-center">
                      <Calendar className="w-4 h-4 mr-3" />
                      <span className="font-medium">My Appointments</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem asChild className="rounded-lg focus:bg-blue-50 focus:text-blue-600 cursor-pointer">
                  <Link href="/chat" className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <MessageSquare className="w-4 h-4 mr-3" />
                      <span className="font-medium">Messages</span>
                    </div>
                    {chatUnreadCount > 0 && (
                      <Badge className="bg-red-500 hover:bg-red-600 px-1.5 h-4 min-w-[1.1rem] flex items-center justify-center text-[10px] rounded-full border-none shadow-sm text-white">
                         {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                      </Badge>
                    )}
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-gray-100" />
                
                <DropdownMenuItem asChild className="rounded-lg focus:bg-blue-50 focus:text-blue-600 cursor-pointer">
                  <Link href={`/${user?.type}/profile`} className="flex items-center">
                    <User className="w-4 h-4 mr-3" />
                    <span className="font-medium">Profile</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild className="rounded-lg focus:bg-blue-50 focus:text-blue-600 cursor-pointer">
                  <Link href={`/${user?.type}/profile`} className="flex items-center">
                    <Settings className="w-4 h-4 mr-3" />
                    <span className="font-medium">Settings</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-gray-100" />
                
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="rounded-lg text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  <span className="font-medium">Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            {isAdmin ? (
              <Link href="/admin">
                <Button
                  variant="ghost"
                  className="text-blue-900 font-medium hover:text-blue-700"
                >
                  Admin Dashboard
                </Button>
              </Link>
            ) : !isAuthenticated ? (
              <>
                <Link href="/login/patient">
                  <Button
                    variant="ghost"
                    className="text-blue-900 font-medium hover:text-blue-700"
                  >
                    Log in
                  </Button>
                </Link>

                <Link href="/signup/patient" className="hidden md:block">
                  <Button className="bg-gradient-to-r from-blue-600 to-blue-700  font-medium hover:from-blue-700 hover:to-blue-800 rounded-full px-6">
                    Book Consultation
                  </Button>
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-4 ">
                <span className="hidden md:block text-sm text-gray-700 font-medium whitespace-nowrap">
                  Welcome,&nbsp;{user?.name}
                </span>

                <Link href={`/${user?.type}/dashboard`}>
                  <Button
                    variant="ghost"
                    className="text-blue-900 font-medium hover:text-blue-700"
                  >
                    Dashboard
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
