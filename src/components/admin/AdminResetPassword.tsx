"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AdminResetPassword({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onReset = async () => {
    setLoading(true);
    setError(null);
    setValue(null);
    try {
      const res = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        setError(json?.error || "Unable to reset password");
        return;
      }
      setValue(String(json.password || ""));
    } catch {
      setError("Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" onClick={onReset} disabled={loading}>
          {loading ? "Resetting…" : "Reset password"}
        </Button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
      {value && (
        <div className="text-sm">
          <div className="font-medium text-gray-800">Temporary password</div>
          <div className="mt-1 flex items-center gap-2">
            <input
              value={value}
              readOnly
              className="w-full max-w-sm rounded-md border border-gray-300 px-2 py-1 text-sm"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(value);
              }}
            >
              Copy
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Share this with the user and advise them to change it after login.</p>
        </div>
      )}
    </div>
  );
}

