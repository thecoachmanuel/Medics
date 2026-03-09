"use client";

import { useEffect, useState } from "react";

export function useAppDetection() {
  const [isApp, setIsApp] = useState(false);

  useEffect(() => {
    // Check for React Native WebView specific object
    const isReactNative = 
      typeof window !== "undefined" && 
      ((window as any).ReactNativeWebView || 
       window.navigator.userAgent.includes("MedicsOnlineNative"));

    setIsApp(!!isReactNative);
  }, []);

  return isApp;
}
