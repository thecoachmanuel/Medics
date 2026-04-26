"use client";

import { useAppDetection } from "@/hooks/use-app-detection";
import { userAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { cn } from "@/lib/utils";
import { 
  LayoutGrid, 
  Calendar, 
  User, 
  CreditCard, 
  Stethoscope, 
  Home,
  Search,
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function MobileBottomNavContent() {
  const isApp = useAppDetection();
  const pathname = usePathname();
  const { user } = userAuthStore();
  const { unreadCount: chatUnreadCount } = useChatStore();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const update = () => {
      try {
        if (typeof window === "undefined") return;
        const mq = window.matchMedia?.("(max-width: 768px)");
        if (mq) {
          setIsMobile(mq.matches);
          return;
        }
        setIsMobile(window.innerWidth <= 768);
      } catch {
        setIsMobile(false);
      }
    };

    update();
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
    };
  }, []);

  // Only render on client and when we have a user
  if (!mounted || !user) return null;

  // Show on app wrapper and also for all mobile screens
  if (!isApp && !isMobile) return null;

  const patientLinks = [
    {
      href: "/patient/dashboard",
      label: "Dashboard",
      icon: Home,
      activePattern: /^\/patient\/dashboard/,
    },
    {
      href: "/doctor-list",
      label: "Find Doctor",
      icon: Search, // or Stethoscope
      activePattern: /^\/doctor-list/,
    },
    {
      href: "/chat",
      label: "Chat",
      icon: MessageSquare,
      activePattern: /^\/chat/,
    },
    {
      href: "/patient/profile",
      label: "Profile",
      icon: User,
      activePattern: /^\/patient\/profile/,
    },
  ];

  const doctorLinks = [
    {
      href: "/doctor/dashboard",
      label: "Dashboard",
      icon: LayoutGrid,
      activePattern: /^\/doctor\/dashboard/,
    },
    {
      href: "/doctor/appointments",
      label: "Appointments",
      icon: Calendar,
      activePattern: /^\/doctor\/appointments/,
    },
    {
      href: "/chat",
      label: "Chat",
      icon: MessageSquare,
      activePattern: /^\/chat/,
    },
    {
      href: "/doctor/profile",
      label: "Profile",
      icon: User,
      activePattern: /^\/doctor\/profile/,
    },
  ];

  const links = user.type === "doctor" ? doctorLinks : patientLinks;

  const activeIndex = (() => {
    const idx = links.findIndex((link) => link.activePattern.test(pathname));
    return idx >= 0 ? idx : 0;
  })();

  // Don't show on login/signup/onboarding pages even if in app (unlikely if we have user, but good safety)
  if (pathname === "/" || pathname.includes("/login") || pathname.includes("/signup") || pathname.includes("/call/") || pathname.includes("/chat/") || pathname.includes("/onboarding")) return null;

  return (
    <>
      {/* Spacer to prevent content from being hidden behind the nav */}
      <div className="h-20 md:hidden" />
      
      <div className="fixed inset-x-0 bottom-0 z-50 md:hidden">
        {/* Modern Blur Background */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-2xl border-t border-gray-100 pb-[env(safe-area-inset-bottom,16px)]" />
        
        <div className="relative mx-auto max-w-md pb-[env(safe-area-inset-bottom,16px)]">
          <div className="flex justify-around items-center h-16 px-2">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = link.activePattern.test(pathname);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative flex flex-col items-center justify-center flex-1 h-full group"
                >
                  <div className={cn(
                    "relative flex flex-col items-center justify-center transition-all duration-300 ease-out",
                    isActive ? "-translate-y-1" : "translate-y-0"
                  )}>
                    <div className={cn(
                      "p-2 rounded-2xl transition-all duration-300",
                      isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110" : "text-gray-400 group-hover:text-gray-600"
                    )}>
                      <Icon
                        className="h-5 w-5"
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      {link.label === "Chat" && chatUnreadCount > 0 && (
                        <div className={cn(
                          "absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold border-2 border-white",
                          isActive ? "bg-red-500 text-white" : "bg-blue-600 text-white"
                        )}>
                          {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                        </div>
                      )}
                    </div>
                    <span className={cn(
                      "text-[10px] mt-1 font-medium transition-all duration-300",
                      isActive ? "text-blue-600 opacity-100 scale-100" : "text-gray-400 opacity-0 scale-75"
                    )}>
                      {link.label}
                    </span>
                  </div>
                  
                  {/* Indicator Dot */}
                  {isActive && (
                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export function MobileBottomNav() {
  return (
    <Suspense fallback={null}>
      <MobileBottomNavContent />
    </Suspense>
  );
}
