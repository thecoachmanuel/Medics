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
import { useEffect, useState } from "react";

import { Suspense } from "react";

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
  ];

  const links = user.type === "doctor" ? doctorLinks : patientLinks;

  // Don't show on login/signup pages even if in app (unlikely if we have user, but good safety)
  if (pathname.includes("/login") || pathname.includes("/signup") || pathname.includes("/call/")) return null;

  return (
    <>
      {/* Spacer to prevent content from being hidden behind the nav */}
      <div className="h-20 md:hidden" />
      
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-t border-gray-200 pb-[env(safe-area-inset-bottom,20px)] md:hidden shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16 px-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = link.activePattern.test(pathname);
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200",
                  isActive 
                    ? "text-blue-600" 
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                <Icon 
                  className={cn(
                    "w-6 h-6 transition-transform duration-200",
                    isActive && "scale-110"
                  )} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-[10px] font-medium tracking-wide">
                  {link.label}
                </span>
              </Link>
            );
          })}
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
