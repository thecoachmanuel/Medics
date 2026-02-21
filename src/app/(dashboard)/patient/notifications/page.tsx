"use client";
import Header from "@/components/landing/Header";

export default function Page() {
  return (
    <>
      <Header showDashboardNav={true} />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-sm text-gray-600">
            Your notifications will appear here.
          </p>
        </div>
      </div>
    </>
  );
}

