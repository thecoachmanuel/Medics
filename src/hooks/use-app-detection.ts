"use client";

import { useEffect, useState } from "react";

export function useAppDetection() {
  const [isApp, setIsApp] = useState(false);

  useEffect(() => {
    const getSessionFlag = (): boolean => {
      try {
        return (
          typeof window !== "undefined" &&
          "sessionStorage" in window &&
          window.sessionStorage.getItem("is_mobile_app") === "true"
        );
      } catch {
        return false;
      }
    };

    const setSessionFlag = (): void => {
      try {
        if (typeof window !== "undefined") {
          if ("sessionStorage" in window) {
            window.sessionStorage.setItem("is_mobile_app", "true");
          }
        }
      } catch {}
    };

    if (getSessionFlag()) {
      setIsApp(true);
      return;
    }

    // 2. Check for Query Parameter (e.g., ?source=mobile_app)
    let sourceParam: string | null = null;
    try {
      if (typeof window !== "undefined") {
        sourceParam = new URLSearchParams(window.location.search).get("source");
      }
    } catch {
      sourceParam = null;
    }
    const isSourceApp =
      sourceParam === "mobile_app" ||
      sourceParam === "ios" ||
      sourceParam === "android";

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
      setSessionFlag();
    }
  }, []);

  return isApp;
}
