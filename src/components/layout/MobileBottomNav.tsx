"use client";

import { useAppDetection } from "@/hooks/use-app-detection";
import { userAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { House, Chat, Calendar, User } from "phosphor-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function MobileBottomNavContent() {
  const isApp = useAppDetection();
  const pathname = usePathname();
  const { user } = userAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user) return null;
  if (!isApp) return null;

  const links = [
    {
      href: user.type === "doctor" ? "/doctor/dashboard" : "/patient/dashboard",
      label: "Home",
      icon: House,
      activePattern: /^\/(patient|doctor)\/dashboard/,
    },
    {
      href: "/messages",
      label: "Message",
      icon: Chat,
      activePattern: /^\/messages/,
    },
    {
      href: "/appointments",
      label: "Booking",
      icon: Calendar,
      activePattern: /^\/appointments/,
    },
    {
      href: user.type === "doctor" ? "/doctor/profile" : "/patient/profile",
      label: "Profile",
      icon: User,
      activePattern: /^\/(patient|doctor)\/profile/,
    },
  ];

  if (pathname.includes("/login") || pathname.includes("/signup") || pathname.includes("/call/")) return null;

  return (
    <>
      <div className="h-20" />
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white/80 backdrop-blur-lg border-t border-gray-200 pb-safe">
        <div className="flex justify-around items-center h-20">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = link.activePattern.test(pathname);

            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center justify-center text-xs font-medium gap-1"
              >
                <Icon
                  weight={isActive ? "fill" : "regular"}
                  className={cn(
                    "w-7 h-7 transition-colors",
                    isActive ? "text-primary" : "text-gray-500"
                  )}
                />
                <span className={cn(isActive ? "text-primary" : "text-gray-600")}>
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
