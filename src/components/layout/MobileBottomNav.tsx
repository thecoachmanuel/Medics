"use client";

import { useAppDetection } from "@/hooks/use-app-detection";
import { userAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { 
  LayoutGrid, 
  Calendar, 
  User, 
  CreditCard, 
  Stethoscope, 
  Home,
  Search
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

function MobileBottomNavContent() {
  const isApp = useAppDetection();
  const pathname = usePathname();
  const { user } = userAuthStore();
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

  const patientLinks = useMemo(() => [
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
      href: "/patient/payments",
      label: "Payments",
      icon: CreditCard,
      activePattern: /^\/patient\/payments/,
    },
    {
      href: "/patient/profile",
      label: "Profile",
      icon: User,
      activePattern: /^\/patient\/profile/,
    },
  ], []);

  const doctorLinks = useMemo(() => [
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
      href: "/doctor/payments",
      label: "Payments",
      icon: CreditCard,
      activePattern: /^\/doctor\/payments/,
    },
    {
      href: "/doctor/profile",
      label: "Profile",
      icon: User,
      activePattern: /^\/doctor\/profile/,
    },
  ], []);

  const links = user.type === "doctor" ? doctorLinks : patientLinks;

  const activeIndex = useMemo(() => {
    const idx = links.findIndex((link) => link.activePattern.test(pathname));
    return idx >= 0 ? idx : 0;
  }, [links, pathname]);

  // Don't show on login/signup pages even if in app (unlikely if we have user, but good safety)
  if (pathname.includes("/login") || pathname.includes("/signup") || pathname.includes("/call/")) return null;

  return (
    <>
      {/* Spacer to prevent content from being hidden behind the nav */}
      <div className="h-24 md:hidden" />
      
      <div className="fixed inset-x-0 bottom-0 z-50 md:hidden pb-[env(safe-area-inset-bottom,16px)]">
        <div className="mx-auto w-[calc(100%-1.25rem)] max-w-md">
          <div className="rounded-[28px] bg-white/75 backdrop-blur-xl ring-1 ring-black/5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] px-2 py-2">
            <div className="relative grid grid-cols-4 gap-1">
              <div
                className="pointer-events-none absolute inset-y-0 left-0 w-[calc((100%-12px)/4)] rounded-2xl bg-gradient-to-b from-blue-50 to-white transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)]"
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
                    className="relative"
                  >
                    <div
                      className={cn(
                        "relative flex h-16 w-full flex-col items-center justify-center rounded-2xl text-[10px] font-semibold tracking-wide transition-transform duration-200 active:scale-[0.96]",
                        isActive ? "text-blue-700" : "text-gray-500"
                      )}
                    >
                      <div
                        className={cn(
                          "relative z-10 transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)]",
                          isActive ? "-translate-y-[1px] scale-[1.08]" : "translate-y-0 scale-100"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-6 w-6 transition-colors duration-200",
                            isActive ? "text-blue-700" : "text-gray-500"
                          )}
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                      </div>
                      <span
                        className={cn(
                          "relative z-10 mt-1 transition-opacity duration-200",
                          isActive ? "opacity-100" : "opacity-90"
                        )}
                      >
                        {link.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
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
