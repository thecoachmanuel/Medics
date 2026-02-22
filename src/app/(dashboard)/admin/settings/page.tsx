"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("admin_auto_refresh") : null;
    if (stored === "off") {
      setAutoRefresh(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("admin_auto_refresh", autoRefresh ? "on" : "off");
  }, [autoRefresh]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-600">Control how the admin dashboard behaves.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">Real-time updates</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between text-sm text-gray-700">
          <div>
            <div className="font-semibold">Auto refresh admin pages</div>
            <p className="text-xs text-gray-500">
              When enabled, admin dashboards periodically refresh to show the latest activity.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh((prev) => !prev)}
          >
            {autoRefresh ? "On" : "Off"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
