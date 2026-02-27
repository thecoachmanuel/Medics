'use client';

import { useEffect } from "react";
import { userAuthStore } from "@/store/authStore";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const { fetchProfile } = userAuthStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return <>{children}</>;
}
