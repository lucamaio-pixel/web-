"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SetupButton() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  async function handleSetup() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/setup", { method: "POST" });
      if (res.ok) {
        setDone(true);
        setTimeout(() => router.refresh(), 800);
      }
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center text-sm text-emerald-700 font-medium">
        ✓ Database inizializzato — ricarico...
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
      <p className="text-sm text-amber-800">
        <strong>Setup richiesto:</strong> la tabella Asset non è ancora presente nel database Turso.
      </p>
      <button
        onClick={handleSetup}
        disabled={loading}
        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors disabled:opacity-60"
      >
        {loading ? "Inizializzazione..." : "Inizializza Database"}
      </button>
    </div>
  );
}
