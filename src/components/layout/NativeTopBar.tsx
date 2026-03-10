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
import { LogOut, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

function NativeTopBarContent() {
  const isApp = useAppDetection();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = userAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  return (
    <div className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/favicon.ico" alt="MedicsOnline" className="h-7 w-7 rounded-md" />
          <div className="text-sm font-semibold text-gray-900">MedicsOnline</div>
        </div>

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
                <span className="text-sm font-medium text-gray-900">{user.name || "Account"}</span>
                <span className="text-xs text-gray-500">{currentUser.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfile}>
              <User className="mr-2 h-4 w-4" />
              Profile
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
  );
}

export function NativeTopBar() {
  return (
    <Suspense fallback={null}>
      <NativeTopBarContent />
    </Suspense>
  );
}
