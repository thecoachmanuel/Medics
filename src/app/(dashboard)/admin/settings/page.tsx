"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [platformFeePercent, setPlatformFeePercent] = useState<string>("0");
  const [adminCommissionPercent, setAdminCommissionPercent] = useState<string>("20");
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/billing-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.config) {
          setPlatformFeePercent(String(data.config.platformFeePercent));
          setAdminCommissionPercent(String(data.config.adminCommissionPercent));
        }
      })
      .catch(() => {
        setMessage({ type: 'error', text: "Failed to load settings" });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/billing-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformFeePercent: Number(platformFeePercent),
          adminCommissionPercent: Number(adminCommissionPercent),
        }),
      });
      
      if (!res.ok) throw new Error("Failed to save");
      
      setMessage({ type: 'success', text: "Billing settings updated successfully" });
    } catch (error) {
      setMessage({ type: 'error', text: "Failed to update settings" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Billing & Commission Configuration</CardTitle>
          <CardDescription>
            Configure platform fees charged to patients and commission rates deducted from doctor earnings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {message && (
            <div className={`p-4 rounded-md flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {message.text}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="platformFee">Platform Fee (%)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="platformFee"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={platformFeePercent}
                onChange={(e) => setPlatformFeePercent(e.target.value)}
              />
              <span className="text-sm text-muted-foreground w-12">%</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Additional fee charged to patients on top of consultation fees. (Default: 0%)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commission">Admin Commission (%)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="commission"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={adminCommissionPercent}
                onChange={(e) => setAdminCommissionPercent(e.target.value)}
              />
              <span className="text-sm text-muted-foreground w-12">%</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Percentage deducted from doctor's consultation fee as platform revenue. (Default: 20%)
            </p>
          </div>

          <div className="pt-4 flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
