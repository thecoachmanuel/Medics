"use client";
import { useEffect, useState } from "react";

export default function ToastNotice({ message }: { message: string }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setOpen(false), 4000);
    return () => clearTimeout(id);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] max-w-sm w-[92vw] sm:w-80">
      <div className="rounded-md border border-green-200 bg-green-50 text-green-900 shadow-md">
        <div className="px-4 py-3 text-sm font-medium">{message}</div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute top-1 right-1 text-green-700 hover:text-green-900 px-2"
        >
          ×
        </button>
      </div>
    </div>
  );
}

