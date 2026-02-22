"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface AdminAutoRefreshProps {
  intervalMs?: number;
  storageKey?: string;
  defaultEnabled?: boolean;
}

export function AdminAutoRefresh({ intervalMs = 20000, storageKey = "admin_auto_refresh", defaultEnabled = true }: AdminAutoRefreshProps) {
  const router = useRouter();
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const parse = (v: string | null): { enabled: boolean; ms: number } => {
      if (!v) return { enabled: defaultEnabled, ms: intervalMs };
      if (v === "off") return { enabled: false, ms: intervalMs };
      if (v.startsWith("on:")) {
        const ms = parseInt(v.slice(3), 10);
        return { enabled: true, ms: Number.isFinite(ms) && ms > 0 ? ms : intervalMs };
      }
      return { enabled: defaultEnabled, ms: intervalMs };
    };

    const start = () => {
      const conf = parse(window.localStorage.getItem(storageKey));
      if (!conf.enabled) return;
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(() => {
        router.refresh();
      }, conf.ms) as unknown as number;
    };

    const stop = () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const reconfigure = () => {
      stop();
      const v = window.localStorage.getItem(storageKey);
      const conf = parse(v);
      if (conf.enabled) {
        intervalRef.current = window.setInterval(() => {
          router.refresh();
        }, conf.ms) as unknown as number;
      }
    };

    // initialize: set default on:300 if no key and default enabled with small interval
    const existing = window.localStorage.getItem(storageKey);
    if (!existing && defaultEnabled) {
      const def = `on:${intervalMs}`;
      window.localStorage.setItem(storageKey, def);
    }
    start();

    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey) reconfigure();
    };
    const onCustom = () => reconfigure();
    window.addEventListener("storage", onStorage);
    window.addEventListener("admin:autoRefresh:changed", onCustom as any);

    return () => {
      stop();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("admin:autoRefresh:changed", onCustom as any);
    };
  }, [router, intervalMs, storageKey, defaultEnabled]);

  return null;
}
