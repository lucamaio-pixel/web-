import { getPilastri, getMonthlyStats, getAvailableMonths } from "@/lib/queries";
import { formatEuro, formatMonth, currentMonth } from "@/lib/utils";
import { MonthSelector } from "@/components/month-selector";
import { PilastroCard } from "@/components/pilastro-card";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

const SPESE_KEYS = ["fondamenta", "quotidiano", "figli", "amway", "debiti", "imprevisti"];
const CRESCITA_KEYS = ["scudo", "respiro", "margine", "arretrati"];

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
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">Spese</p>
          </div>
          {spese.map((p) => {
            const s = stats.byPilastro[p.id];
            const usedSubs = s?.subcategories ?? {};
            // Merge: TUTTE le sottocategorie del pilastro, anche quelle senza spese
            const subcategoryGroups = p.subcategories.map((sub) => {
              const used = usedSubs[sub.id];
              return {
                id: sub.id,
                key: sub.key,
                name: sub.name,
                emoji: sub.emoji,
                monthlyBudget: sub.monthlyBudget,
                total: used?.total ?? 0,
                count: used?.count ?? 0,
                merchants: used ? Object.entries(used.merchants).map(([name, v]) => ({ name, ...v })) : [],
              };
            });
            const ungrouped = Object.entries(s?.merchants ?? {}).map(([name, v]) => ({ name, ...v }));
            return (
              <PilastroCard
                key={p.id}
                id={p.id}
                name={p.name}
                emoji={p.emoji}
                monthlyBudget={p.monthlyBudget}
                spent={s?.spent ?? 0}
                subcategoryGroups={subcategoryGroups}
                ungrouped={ungrouped}
                isGrowth={false}
              />
            );
          })}
        </div>

        {/* DESTRA — Crescita & Liberazione */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-base text-emerald-600">↑</span>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Crescita</p>
          </div>
          {crescita.map((p) => {
            const s = stats.byPilastro[p.id];
            const usedSubs = s?.subcategories ?? {};
            const subcategoryGroups = p.subcategories.map((sub) => {
              const used = usedSubs[sub.id];
              return {
                id: sub.id,
                key: sub.key,
                name: sub.name,
                emoji: sub.emoji,
                monthlyBudget: sub.monthlyBudget,
                total: used?.total ?? 0,
                count: used?.count ?? 0,
                merchants: used ? Object.entries(used.merchants).map(([name, v]) => ({ name, ...v })) : [],
              };
            });
            const ungrouped = Object.entries(s?.merchants ?? {}).map(([name, v]) => ({ name, ...v }));
            return (
              <PilastroCard
                key={p.id}
                id={p.id}
                name={p.name}
                emoji={p.emoji}
                monthlyBudget={p.monthlyBudget}
                spent={s?.spent ?? 0}
                subcategoryGroups={subcategoryGroups}
                ungrouped={ungrouped}
                isGrowth={true}
                goalAmount={p.goalAmount}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
