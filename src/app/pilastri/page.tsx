import { getPilastri, getMonthlyStats, getAvailableMonths } from "@/lib/queries";
import { Progress } from "@/components/ui/progress";
import { formatEuro, formatMonth, currentMonth } from "@/lib/utils";
import { MonthSelector } from "@/components/month-selector";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

const SPESE_KEYS = ["fondamenta", "quotidiano", "figli", "amway", "debiti"];
const CRESCITA_KEYS = ["scudo", "imprevisti", "respiro", "margine", "arretrati"];

export default async function PilastriPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const month = monthParam ?? currentMonth();

  const [pilastri, stats, availableMonths] = await Promise.all([
    getPilastri(),
    getMonthlyStats(month),
    getAvailableMonths(),
  ]);

  const byKey = Object.fromEntries(pilastri.map((p) => [p.key, p]));
  const spese = SPESE_KEYS.map((k) => byKey[k]).filter(Boolean);
  const crescita = CRESCITA_KEYS.map((k) => byKey[k]).filter(Boolean);

  return (
    <div className="space-y-5">
      <header>
        <p className="text-stone-500 text-sm">Pilastri</p>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight capitalize">
          {formatMonth(month)}
        </h1>
      </header>

      <Suspense>
        <MonthSelector selected={month} availableMonths={availableMonths} />
      </Suspense>

      <div className="grid grid-cols-2 gap-3 items-start">
        {/* SINISTRA — Spese da governare */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-base">↓</span>
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
              Spese
            </p>
          </div>
          {spese.map((p) => {
            const spent = stats.byPilastro[p.id]?.spent ?? 0;
            const percent = p.monthlyBudget > 0 ? (spent / p.monthlyBudget) * 100 : 0;
            const remaining = p.monthlyBudget - spent;
            const variant: "success" | "warning" | "danger" =
              percent > 100 ? "danger" : percent > 80 ? "warning" : "success";
            return (
              <div
                key={p.id}
                className="bg-white border border-stone-200 rounded-xl p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{p.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900 leading-tight truncate">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-stone-400">{formatEuro(p.monthlyBudget)}/m</p>
                  </div>
                </div>
                <Progress value={percent} variant={variant} className="h-1.5" />
                <div className="flex justify-between text-[11px]">
                  <span className="text-stone-500">{formatEuro(spent)}</span>
                  <span
                    className={
                      remaining < 0
                        ? "text-red-600 font-semibold"
                        : remaining < p.monthlyBudget * 0.2
                        ? "text-amber-600 font-medium"
                        : "text-stone-400"
                    }
                  >
                    {remaining >= 0
                      ? `−${formatEuro(remaining)}`
                      : `+${formatEuro(Math.abs(remaining))}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* DESTRA — Crescita & Liberazione */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-base text-emerald-600">↑</span>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
              Crescita
            </p>
          </div>
          {crescita.map((p) => {
            const spent = stats.byPilastro[p.id]?.spent ?? 0;
            const percent = p.monthlyBudget > 0 ? (spent / p.monthlyBudget) * 100 : 0;
            const isScudo = p.key === "scudo";
            return (
              <div
                key={p.id}
                className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{p.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900 leading-tight truncate">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-emerald-600">{formatEuro(p.monthlyBudget)}/m</p>
                  </div>
                </div>
                <Progress value={Math.min(percent, 100)} variant="success" className="h-1.5" />
                <div className="flex justify-between text-[11px]">
                  <span className="text-emerald-700 font-medium">{formatEuro(spent)}</span>
                  <span className="text-emerald-500">
                    {percent >= 100 ? "✓ pieno" : `${Math.round(percent)}%`}
                  </span>
                </div>
                {isScudo && p.goalAmount && (
                  <p className="text-[10px] text-emerald-600 border-t border-emerald-100 pt-1.5">
                    Obiettivo: {formatEuro(p.goalAmount)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
