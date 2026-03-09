"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function useAppDetection() {
  const [isApp, setIsApp] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // 1. Check if we already detected it in this session
    const storedIsApp = typeof window !== 'undefined' && sessionStorage.getItem("is_mobile_app") === "true";
    if (storedIsApp) {
      setIsApp(true);
      return;
    }

    // 2. Check for Query Parameter (e.g., ?source=mobile_app)
    const sourceParam = searchParams.get("source");
    const isSourceApp = sourceParam === "mobile_app" || sourceParam === "ios" || sourceParam === "android";

    // 3. Check for User Agent
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isUserAgentApp = 
      userAgent.includes("MedicsOnlineNative") || 
      userAgent.includes("wv") || // Android WebView
      (userAgent.includes("Mobile") && !userAgent.includes("Safari")); // Very broad fallback for some webviews

    // 4. Check for React Native specific window object
    const isReactNative = 
      typeof window !== "undefined" && 
      ((window as any).ReactNativeWebView || (window as any).isNativeApp);

    if (isSourceApp || isUserAgentApp || isReactNative) {
      setIsApp(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem("is_mobile_app", "true");
      }
    }
  }, [searchParams]);

  return isApp;
}
