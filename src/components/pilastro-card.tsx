"use client";

import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { formatEuro } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

interface MerchantRow {
  name: string;
  total: number;
  count: number;
}

interface Props {
  id: string;
  name: string;
  emoji: string;
  monthlyBudget: number;
  spent: number;
  merchants: MerchantRow[];
  isGrowth?: boolean;
  goalAmount?: number | null;
}

export function PilastroCard({ id, name, emoji, monthlyBudget, spent, merchants, isGrowth, goalAmount }: Props) {
  const [open, setOpen] = useState(false);
  const percent = monthlyBudget > 0 ? (spent / monthlyBudget) * 100 : 0;
  const remaining = monthlyBudget - spent;
  const variant: "success" | "warning" | "danger" =
    isGrowth ? "success" : percent > 100 ? "danger" : percent > 80 ? "warning" : "success";

  return (
    <div
      className={`rounded-xl border p-3 space-y-2 transition-colors ${
        isGrowth ? "bg-emerald-50 border-emerald-100" : "bg-white border-stone-200"
      }`}
    >
      <button
        className="w-full text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-stone-900 leading-tight truncate">{name}</p>
            <p className={`text-[10px] ${isGrowth ? "text-emerald-600" : "text-stone-400"}`}>
              {formatEuro(monthlyBudget)}/m
            </p>
          </div>
          {merchants.length > 0 && (
            isGrowth
              ? <ChevronDown className={`w-3.5 h-3.5 text-emerald-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
              : <ChevronDown className={`w-3.5 h-3.5 text-stone-300 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
          )}
        </div>

        <Progress value={Math.min(percent, 100)} variant={variant} className="h-1.5 mt-2" />

        <div className="flex justify-between text-[11px] mt-1">
          <span className={isGrowth ? "text-emerald-700 font-medium" : "text-stone-500"}>
            {formatEuro(spent)}
          </span>
          {isGrowth ? (
            <span className="text-emerald-500">
              {percent >= 100 ? "✓ pieno" : `${Math.round(percent)}%`}
            </span>
          ) : (
            <span className={remaining < 0 ? "text-red-600 font-semibold" : remaining < monthlyBudget * 0.2 ? "text-amber-600 font-medium" : "text-stone-400"}>
              {remaining >= 0 ? `−${formatEuro(remaining)}` : `+${formatEuro(Math.abs(remaining))}`}
            </span>
          )}
        </div>

        {isGrowth && goalAmount && (
          <p className="text-[10px] text-emerald-600 border-t border-emerald-100 pt-1.5 mt-1 text-left">
            Obiettivo: {formatEuro(goalAmount)}
          </p>
        )}
      </button>

      {open && merchants.length > 0 && (
        <div className="border-t border-stone-100 pt-2 space-y-1">
          {merchants
            .sort((a, b) => b.total - a.total)
            .map((m) => (
              <div key={m.name} className="flex justify-between items-center text-[11px]">
                <span className="text-stone-600 truncate max-w-[60%]">
                  {m.name}
                  {m.count > 1 && <span className="text-stone-400 ml-1">×{m.count}</span>}
                </span>
                <span className="font-medium text-stone-800">{formatEuro(m.total)}</span>
              </div>
            ))}
        </div>
      )}

      {open && merchants.length === 0 && (
        <p className="text-[11px] text-stone-400 border-t border-stone-100 pt-2">
          Nessuna spesa questo mese
        </p>
      )}
    </div>
  );
}
