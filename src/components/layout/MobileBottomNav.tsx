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
import { motion } from "framer-motion";

function MobileBottomNavContent() {
  const isApp = useAppDetection();
  const pathname = usePathname();
  const { user } = userAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only render on client, if it's the app, and we have a user
  if (!mounted || !isApp || !user) return null;

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

  // Don't show on login/signup pages even if in app (unlikely if we have user, but good safety)
  if (pathname.includes("/login") || pathname.includes("/signup") || pathname.includes("/call/")) return null;

  return (
    <>
      {/* Spacer to prevent content from being hidden behind the nav */}
      <div className="h-24 md:hidden" />
      
      <div className="fixed inset-x-0 bottom-0 z-50 md:hidden pb-[env(safe-area-inset-bottom,16px)]">
        <div className="mx-auto w-[calc(100%-1.25rem)] max-w-md">
          <div className="rounded-[28px] bg-white/75 backdrop-blur-xl ring-1 ring-black/5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] px-2 py-2">
            <div className="grid grid-cols-4 gap-1">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = link.activePattern.test(pathname);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative"
                  >
                    <motion.div
                      whileTap={{ scale: 0.96 }}
                      className={cn(
                        "relative flex h-16 w-full flex-col items-center justify-center rounded-2xl text-[10px] font-semibold tracking-wide",
                        isActive ? "text-blue-700" : "text-gray-500"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="mobile-bottom-nav-active"
                          className="absolute inset-0 rounded-2xl bg-gradient-to-b from-blue-50 to-white"
                          transition={{ type: "spring", stiffness: 520, damping: 38 }}
                        />
                      )}

                      <motion.div
                        className="relative z-10"
                        animate={{ y: isActive ? -1 : 0, scale: isActive ? 1.08 : 1 }}
                        transition={{ type: "spring", stiffness: 520, damping: 38 }}
                      >
                        <Icon
                          className={cn(
                            "h-6 w-6",
                            isActive ? "text-blue-700" : "text-gray-500"
                          )}
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                      </motion.div>
                      <motion.span
                        className="relative z-10 mt-1"
                        animate={{ opacity: isActive ? 1 : 0.9 }}
                        transition={{ duration: 0.18 }}
                      >
                        {link.label}
                      </motion.span>
                    </motion.div>
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
