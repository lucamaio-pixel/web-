"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export function ReportClient({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Button onClick={copy} size="lg" className="w-full">
      {copied ? (
        <>
          <Check className="w-4 h-4" /> Copiato negli appunti
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" /> Copia tutto il report
        </>
      )}
    </Button>
  );
}
