import { getPilastri, getMonthlyStats, getAvailableMonths, getIncomeEstimate } from "@/lib/queries";
import { formatEuro, formatMonth, currentMonth } from "@/lib/utils";
import { MonthSelector } from "@/components/month-selector";
import { PilastroCard } from "@/components/pilastro-card";
import { Progress } from "@/components/ui/progress";
import { SECTIONS, sectionOf, type SectionId } from "@/lib/budget-groups";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

type Pilastro = Awaited<ReturnType<typeof getPilastri>>[number];
type Stats = Awaited<ReturnType<typeof getMonthlyStats>>;

export default async function PilastriPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const month = monthParam ?? currentMonth();

  const [pilastri, stats, availableMonths, income] = await Promise.all([
    getPilastri(),
    getMonthlyStats(month),
    getAvailableMonths(),
    getIncomeEstimate(),
  ]);

  // Raggruppa i pilastri nelle sezioni del budget a buste
  const bySection: Record<SectionId, Pilastro[]> = {
    fisse: [], variabili: [], imprevisti: [], buste: [], cuscino: [],
  };
  for (const p of pilastri) bySection[sectionOf(p.key)].push(p);

  // Totale budget mensile (spese correnti + buste, escluso cuscino)
  const totalBudget = (["fisse", "variabili", "imprevisti", "buste"] as SectionId[])
    .flatMap((s) => bySection[s])
    .reduce((sum, p) => sum + p.monthlyBudget, 0);
  const residuo = income - totalBudget;

  return (
    <div className="space-y-5">
      <header>
        <p className="text-stone-500 text-sm">Budget a buste</p>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight capitalize">
          {formatMonth(month)}
        </h1>
      </header>

      <Suspense>
        <MonthSelector selected={month} availableMonths={availableMonths} />
      </Suspense>

      {/* Entrate + residuo */}
      <div className="rounded-2xl bg-stone-900 text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-stone-400">Entrate operative</p>
            <p className="text-2xl font-bold">{formatEuro(income)}</p>
            <p className="text-[10px] text-stone-500">stipendio + assegni + Mileidy</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-stone-400">Budget / Residuo</p>
            <p className="text-lg font-semibold">{formatEuro(totalBudget)}</p>
            <p className={`text-sm font-bold ${residuo >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {residuo >= 0 ? "+" : ""}{formatEuro(residuo)}
            </p>
          </div>
        </div>
      </div>

      {/* Sezioni spese correnti */}
      {(["fisse", "variabili", "imprevisti"] as SectionId[]).map((sid) => {
        const list = bySection[sid];
        if (list.length === 0) return null;
        const sec = SECTIONS.find((s) => s.id === sid)!;
        const secBudget = list.reduce((s, p) => s + p.monthlyBudget, 0);
        return (
          <section key={sid}>
            <SectionHeader emoji={sec.emoji} label={sec.label} hint={sec.hint} total={secBudget} />
            <div className="space-y-2">
              {list.map((p) => renderSpesaCard(p, stats))}
            </div>
          </section>
        );
      })}

      {/* Buste */}
      {bySection.buste.length > 0 && (
        <section>
          <SectionHeader
            emoji="✉️"
            label="Buste — accantonamenti"
            hint="Metti da parte ogni mese per le spese annuali"
            total={bySection.buste.reduce((s, p) => s + p.monthlyBudget, 0)}
          />
          <div className="space-y-2">
            {bySection.buste.map((b) => (
              <BustaCard key={b.id} name={b.name} emoji={b.emoji}
                monthly={b.monthlyBudget} balance={b.currentBalance} goal={b.goalAmount ?? 0} />
            ))}
          </div>
        </section>
      )}

      {/* Cuscino (a parte, dal B&B) */}
      {bySection.cuscino.map((c) => (
        <div key={c.id} className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔒</span>
              <div>
                <p className="font-semibold text-stone-800 text-sm">Cuscino ({c.name})</p>
                <p className="text-xs text-stone-500">Alimentato dai €250/mese Atelier — a parte dal budget</p>
              </div>
            </div>
            <span className="text-sm font-bold text-emerald-700">{formatEuro(c.currentBalance)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionHeader({ emoji, label, hint, total }: { emoji: string; label: string; hint: string; total: number }) {
  return (
    <div className="flex items-end justify-between mb-2.5">
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{emoji}</span>
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-600">{label}</p>
        </div>
        <p className="text-[10px] text-stone-400 ml-6">{hint}</p>
      </div>
      <span className="text-xs font-semibold text-stone-500">{formatEuro(total)}/mese</span>
    </div>
  );
}

function BustaCard({ name, emoji, monthly, balance, goal }: { name: string; emoji: string; monthly: number; balance: number; goal: number }) {
  const percent = goal > 0 ? (balance / goal) * 100 : 0;
  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <p className="font-semibold text-stone-800 text-sm">{name}</p>
        </div>
        <span className="text-sm font-bold text-amber-700">+{formatEuro(monthly)}/mese</span>
      </div>
      {goal > 0 && (
        <>
          <Progress value={Math.min(percent, 100)} barClassName="bg-amber-500" className="h-2" />
          <div className="flex justify-between text-xs mt-1">
            <span className="text-stone-500">accumulato {formatEuro(balance)}</span>
            <span className="text-stone-400">obiettivo {formatEuro(goal)}</span>
          </div>
        </>
      )}
    </div>
  );
}

function renderSpesaCard(p: Pilastro, stats: Stats) {
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
      isGrowth={false}
      goalAmount={p.goalAmount}
    />
  );
}
