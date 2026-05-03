import { prisma } from "@/lib/prisma";
import { getAvailableMonths, getPilastri } from "@/lib/queries";
import { MonthSelector } from "@/components/month-selector";
import { TransactionList } from "@/components/transaction-list";
import { formatEuro, currentMonth } from "@/lib/utils";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function TransazioniPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const month = monthParam ?? currentMonth();
  const [y, m] = month.split("-").map(Number);
  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m, 1);

  const [txs, availableMonths, pilastri] = await Promise.all([
    prisma.transaction.findMany({
      where: { deleted: false, date: { gte: from, lt: to } },
      orderBy: { date: "desc" },
      include: { account: true, pilastro: true },
    }),
    getAvailableMonths(),
    getPilastri(),
  ]);

  // Raggruppa per giorno
  const byDay = new Map<string, typeof txs>();
  for (const t of txs) {
    const key = t.date.toISOString().slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(t);
  }

  const groups = Array.from(byDay.entries()).map(([day, items]) => ({ day, items }));

  const totalIncome = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalExpenses = txs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div className="space-y-5">
      <header>
        <p className="text-stone-500 text-sm">Storico</p>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Movimenti</h1>
      </header>

      <Suspense>
        <MonthSelector selected={month} availableMonths={availableMonths} />
      </Suspense>

      {txs.length > 0 && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white border border-stone-200 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wider text-stone-400">Entrate</p>
            <p className="text-sm font-bold text-emerald-600 mt-0.5">{formatEuro(totalIncome)}</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wider text-stone-400">Uscite</p>
            <p className="text-sm font-bold text-stone-900 mt-0.5">{formatEuro(totalExpenses)}</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wider text-stone-400">Netto</p>
            <p className={`text-sm font-bold mt-0.5 ${totalIncome - totalExpenses >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatEuro(totalIncome - totalExpenses, { sign: true })}
            </p>
          </div>
        </div>
      )}

      {txs.length === 0 ? (
        <p className="text-center text-stone-400 text-sm py-12">
          Nessun movimento in questo mese.
        </p>
      ) : (
        <TransactionList
          groups={groups}
          pilastri={pilastri.map((p) => ({ id: p.id, key: p.key, name: p.name, emoji: p.emoji }))}
        />
      )}
    </div>
  );
}
