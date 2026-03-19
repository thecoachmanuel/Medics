"use client";

import { useAppDetection } from "@/hooks/use-app-detection";
import { userAuthStore } from "@/store/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, MagnifyingGlass } from "phosphor-react";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

function NativeTopBarContent() {
  const isApp = useAppDetection();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = userAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shouldRender = useMemo(() => {
    if (!mounted || !isApp || !user) return false;
    if (pathname.includes("/call/")) return false;
    if (pathname.includes("/login") || pathname.includes("/signup")) return false;
    return true;
  }, [isApp, mounted, pathname, user]);

  if (!shouldRender) return null;

  const currentUser = user!;

  const handleNotifications = () => {
    router.push(`/${currentUser.type}/notifications`);
  };

  const handleProfile = () => {
    router.push(`/${currentUser.type}/profile`);
  };

  const handleSearch = () => {
    router.push('/doctor-list');
  };

  const fallback = (currentUser.name?.trim()?.[0] || currentUser.email?.trim()?.[0] || "U").toUpperCase();

  return (
    <div className="bg-background sticky top-0 z-40 pt-safe">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            <Avatar asChild onClick={handleProfile}>
              <button>
                <AvatarImage src={currentUser.profileImage || ""} alt={currentUser.name || "Profile"} />
                <AvatarFallback>{fallback}</AvatarFallback>
              </button>
            </Avatar>
            <div>
              <p className="text-sm text-gray-500">Welcome Back</p>
              <h2 className="text-lg font-bold text-gray-900">{currentUser.name}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleNotifications}
            aria-label="Notifications"
            className="relative h-10 w-10 inline-flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200"
          >
            <Bell className="h-6 w-6 text-gray-800" />
          </button>
        </div>
        <div className="pb-4">
          <button
            onClick={handleSearch}
            className="w-full flex items-center gap-3 px-4 h-12 bg-gray-100 rounded-full text-gray-500"
          >
            <MagnifyingGlass className="w-5 h-5" />
            <span>Search doctor or anything...</span>
          </button>
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
