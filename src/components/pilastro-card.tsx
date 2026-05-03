"use client";

import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { formatEuro } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SubcategoryGroup {
  id: string;
  key: string;
  name: string;
  emoji: string;
  total: number;
  count: number;
  merchants: { name: string; total: number; count: number }[];
}

interface Props {
  id: string;
  name: string;
  emoji: string;
  monthlyBudget: number;
  spent: number;
  subcategoryGroups: SubcategoryGroup[];
  ungrouped: { name: string; total: number; count: number }[];
  isGrowth?: boolean;
  goalAmount?: number | null;
}

export function PilastroCard({
  name, emoji, monthlyBudget, spent,
  subcategoryGroups, ungrouped, isGrowth, goalAmount,
}: Props) {
  const [open, setOpen] = useState(false);
  const [openSub, setOpenSub] = useState<string | null>(null);

  const percent = monthlyBudget > 0 ? (spent / monthlyBudget) * 100 : 0;
  const remaining = monthlyBudget - spent;
  const hasDetail = subcategoryGroups.length > 0 || ungrouped.length > 0;
  const variant: "success" | "warning" | "danger" =
    isGrowth ? "success" : percent > 100 ? "danger" : percent > 80 ? "warning" : "success";

  return (
    <div className={`rounded-xl border p-3 space-y-2 transition-colors ${isGrowth ? "bg-emerald-50 border-emerald-100" : "bg-white border-stone-200"}`}>
      <button className="w-full text-left" onClick={() => hasDetail && setOpen((v) => !v)}>
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-stone-900 leading-tight truncate">{name}</p>
            <p className={`text-[10px] ${isGrowth ? "text-emerald-600" : "text-stone-400"}`}>
              {formatEuro(monthlyBudget)}/m
            </p>
          </div>
          {hasDetail && (
            <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""} ${isGrowth ? "text-emerald-400" : "text-stone-300"}`} />
          )}
        </div>

        <Progress value={Math.min(percent, 100)} variant={variant} className="h-1.5 mt-2" />

        <div className="flex justify-between text-[11px] mt-1">
          <span className={isGrowth ? "text-emerald-700 font-medium" : "text-stone-500"}>
            {formatEuro(spent)}
          </span>
          {isGrowth ? (
            <span className="text-emerald-500">{percent >= 100 ? "✓ pieno" : `${Math.round(percent)}%`}</span>
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

      {open && (
        <div className="border-t border-stone-100 pt-2 space-y-1.5">
          {/* Sottocategorie con espansione merchant */}
          {subcategoryGroups.sort((a, b) => b.total - a.total).map((sub) => (
            <div key={sub.key}>
              <button
                className="w-full flex justify-between items-center text-[11px] py-0.5"
                onClick={() => setOpenSub(openSub === sub.key ? null : sub.key)}
              >
                <span className="text-stone-700 font-medium flex items-center gap-1">
                  {sub.emoji} {sub.name}
                  {sub.count > 1 && <span className="text-stone-400">×{sub.count}</span>}
                  {sub.merchants.length > 1 && (
                    <ChevronDown className={`w-3 h-3 text-stone-300 transition-transform ${openSub === sub.key ? "rotate-180" : ""}`} />
                  )}
                </span>
                <span className="font-semibold text-stone-800">{formatEuro(sub.total)}</span>
              </button>
              {openSub === sub.key && sub.merchants.length > 1 && (
                <div className="pl-4 space-y-0.5 mt-0.5">
                  {sub.merchants.sort((a, b) => b.total - a.total).map((m) => (
                    <div key={m.name} className="flex justify-between text-[10px]">
                      <span className="text-stone-500 truncate max-w-[60%]">
                        {m.name}{m.count > 1 && <span className="text-stone-400 ml-1">×{m.count}</span>}
                      </span>
                      <span className="text-stone-600">{formatEuro(m.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Transazioni senza sottocategoria */}
          {ungrouped.sort((a, b) => b.total - a.total).map((m) => (
            <div key={m.name} className="flex justify-between items-center text-[11px]">
              <span className="text-stone-500 truncate max-w-[60%]">
                {m.name}{m.count > 1 && <span className="text-stone-400 ml-1">×{m.count}</span>}
              </span>
              <span className="text-stone-600">{formatEuro(m.total)}</span>
            </div>
          ))}

          {subcategoryGroups.length === 0 && ungrouped.length === 0 && (
            <p className="text-[11px] text-stone-400">Nessuna spesa questo mese</p>
          )}
        </div>
      )}
    </div>
  );
}
