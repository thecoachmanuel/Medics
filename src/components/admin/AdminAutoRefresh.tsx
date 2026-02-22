"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface AdminAutoRefreshProps {
  intervalMs?: number;
}

export function AdminAutoRefresh({ intervalMs = 20000 }: AdminAutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("admin_auto_refresh");
    if (stored === "off") return;

    const id = window.setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => {
      window.clearInterval(id);
    };
  }, [router, intervalMs]);

  return null;
}

