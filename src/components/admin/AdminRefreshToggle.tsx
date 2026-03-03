"use client";
import { useEffect, useState } from "react";

interface Props {
  storageKey: string;
  options?: Array<{ label: string; value: number | "off" }>;
  defaultValue?: number | "off";
}

export default function AdminRefreshToggle({ storageKey, options, defaultValue = "off" }: Props) {
  const opts = options || [
    { label: "Off", value: "off" },
    { label: "30s", value: 30000 },
    { label: "1m", value: 60000 },
    { label: "5m", value: 300000 },
  ];
  const [value, setValue] = useState<string>(defaultValue === "off" ? "off" : `on:${defaultValue}`);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(storageKey);
      if (!v) {
        const initial = defaultValue === "off" ? "off" : `on:${defaultValue}`;
        window.localStorage.setItem(storageKey, initial);
        setValue(initial);
      } else {
        setValue(v);
      }
    } catch {}
  }, [storageKey, defaultValue]);

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setValue(v);
    try {
      window.localStorage.setItem(storageKey, v);
      window.dispatchEvent(new Event("admin:autoRefresh:changed"));
    } catch {}
  };

  const current = value === "off" ? "off" : (value.startsWith("on:") ? parseInt(value.slice(3), 10) : "off");

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-600">Auto-refresh</span>
      <select
        value={current === "off" ? "off" : `on:${current}`}
        onChange={onChange}
        className="border rounded px-2 py-1 bg-white"
        aria-label="Auto-refresh interval"
      >
        {opts.map((o) => (
          <option key={String(o.value)} value={o.value === "off" ? "off" : `on:${o.value}`}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
