"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const hasAdmin = document.cookie.includes("medics_admin=1");
    if (hasAdmin) {
      const id = window.setTimeout(() => {
        router.replace("/admin");
      }, 2500);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => {
      router.replace("/");
    }, 2500);
    return () => window.clearTimeout(id);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mb-6 flex items-center gap-2">
        <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
          MO
        </div>
        <span className="text-xl font-semibold text-gray-900">MedicsOnline</span>
      </div>

      <div className="max-w-md text-center space-y-3">
        <h1 className="text-3xl font-bold text-gray-900">Page not found</h1>
        <p className="text-sm text-gray-600">
          The page you are looking for does not exist or may have been moved.
        </p>
        <p className="text-xs text-gray-500">
          You will be redirected shortly. Patients go to the homepage, admins go to the admin dashboard.
        </p>
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="px-4 py-2 rounded-md border text-sm font-medium text-gray-800 bg-white hover:bg-gray-100"
        >
          Go to homepage
        </Link>
        <Link
          href="/admin"
          className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Go to admin dashboard
        </Link>
      </div>
    </div>
  );
}

