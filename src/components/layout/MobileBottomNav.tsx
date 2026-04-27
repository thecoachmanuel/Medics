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
      <div className="h-24 md:hidden" />
      
      <div className="fixed inset-x-0 bottom-0 z-50 md:hidden pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
        <div className="mx-auto w-[calc(100%-1.25rem)] max-w-md">
          <nav
            className="rounded-full bg-white/70 backdrop-blur-xl ring-1 ring-black/5 shadow-[0_16px_48px_rgba(0,0,0,0.14)] px-2 py-2"
            aria-label="Bottom navigation"
          >
            <div className="relative flex items-stretch gap-1">
              <div
                className="pointer-events-none absolute inset-y-0 left-0 w-1/4 rounded-full bg-gradient-to-b from-blue-600 to-blue-700 shadow-[0_10px_30px_rgba(37,99,235,0.35)] transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)]"
                style={{
                  transform: `translateX(calc(${activeIndex} * (100% + 4px)))`,
                }}
              />

              {links.map((link) => {
                const Icon = link.icon;
                const isActive = link.activePattern.test(pathname);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative flex-1 rounded-full outline-none transition-transform duration-200 active:scale-[0.97]",
                      isActive ? "text-white" : "text-gray-600"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <div className="relative z-10 flex h-14 flex-col items-center justify-center">
                      <div className="relative">
                        <Icon
                          className={cn(
                            "h-6 w-6 transition-colors duration-200",
                            isActive ? "text-white" : "text-gray-600"
                          )}
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                        {link.label === "Chat" && chatUnreadCount > 0 && (
                          <div className="absolute -top-2 -right-3 bg-red-500 text-white shadow-sm border border-white text-[9px] font-bold px-1.5 min-w-[1.1rem] h-4 rounded-full flex items-center justify-center leading-none">
                            {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                          </div>
                        )}
                      </div>

                      <span
                        className={cn(
                          "mt-1 text-[10px] font-semibold tracking-wide transition-opacity duration-200",
                          isActive ? "opacity-100" : "opacity-70"
                        )}
                      >
                        {link.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>
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
