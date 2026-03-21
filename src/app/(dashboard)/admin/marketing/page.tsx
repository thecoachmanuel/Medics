"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Segment = "patients" | "doctors" | "subscribers" | "custom";

export default function AdminMarketingPage() {
  const [segment, setSegment] = useState<Segment>("patients");
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [customEmails, setCustomEmails] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canQuery = segment === "patients" || segment === "doctors";

  const emailsArray = useMemo(() => customEmails.split(/[,\n]+/).map(s => s.trim()).filter(Boolean), [customEmails]);

  const handleSend = async () => {
    setSending(true);
    setSent(false);
    setError(null);
    try {
      const payload: any = { segment, subject, html };
      if (canQuery && query.trim().length > 0) payload.query = query.trim();
      if (segment === "custom") payload.emails = emailsArray;
      const res = await fetch("/api/admin/email/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error || "Unable to send emails");
        return;
      }
      setSent(true);
    } catch {
      setError("Unable to send emails");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Email Marketing</h2>
        <p className="text-sm text-gray-600">Search and email selected audiences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">Compose</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Audience</label>
              <select className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" value={segment} onChange={(e) => setSegment(e.target.value as Segment)}>
                <option value="patients">Patients</option>
                <option value="doctors">Doctors</option>
                <option value="subscribers">Newsletter subscribers</option>
                <option value="custom">Custom emails</option>
              </select>
            </div>
            {segment === "custom" ? (
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-gray-600">Emails (comma or newline separated)</label>
                <textarea className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm min-h-[60px]" value={customEmails} onChange={(e) => setCustomEmails(e.target.value)} />
              </div>
            ) : canQuery ? (
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-gray-600">Filter by email contains (optional)</label>
                <input className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
            ) : (
              <div className="md:col-span-2" />
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Subject</label>
            <input className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">HTML Body</label>
            <textarea className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm min-h-[160px]" value={html} onChange={(e) => setHtml(e.target.value)} />
          </div>
          {error && <div className="text-xs text-red-600">{error}</div>}
          {sent && !error && <div className="text-xs text-green-600">Emails queued.</div>}
          <div className="flex justify-end">
            <Button type="button" className="bg-blue-600 text-white hover:bg-blue-700" onClick={handleSend} disabled={sending || !subject || !html}>
              {sending ? "Sending…" : "Send"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

