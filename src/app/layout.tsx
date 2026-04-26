import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { NativeTopBar } from "@/components/layout/NativeTopBar";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
 title: 'MedicsOnline - Online Doctor Consultations',
  description: 'Connect with certified doctors online for quality healthcare. Professional medical consultations from the comfort of your home.',
  keywords: ['telemedicine', 'online doctor', 'healthcare', 'consultation', 'medical advice', 'teleconsultation'],
  authors: [{ name: 'MedicsOnline' }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
  interactiveWidget: "resizes-content",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
              <NativeTopBar />
              {children}
              <MobileBottomNav />
        </Providers>
        <Script id="webview-permission-shim" strategy="afterInteractive">
          {`
            (function() {
              // 1. Spoof User Agent to look like a full Chrome browser
              // This prevents WebRTC libraries from blocking the WebView
              if (navigator.userAgent.includes('wv') || navigator.userAgent.includes('Android')) {
                Object.defineProperty(navigator, 'userAgent', {
                  get: function () { return 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'; }
                });
              }

              // 2. Pre-request permissions to trigger OS dialogs early
              if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({ audio: true, video: true })
                  .then(function(s) { s.getTracks().forEach(t => t.stop()); })
                  .catch(function(e) { console.log('Early perm check:', e); });
              }
            })();
          `}
        </Script>
      </body>
    </html>
  );
}
