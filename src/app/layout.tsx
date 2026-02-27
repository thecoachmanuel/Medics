import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/ClientProviders";

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
        <ClientProviders>
              {children}
        </ClientProviders>
      </body>
    </html>
  );
}
