import { prisma } from "@/lib/prisma";
import { getAvailableMonths } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { MonthSelector } from "@/components/month-selector";
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

  const [txs, availableMonths] = await Promise.all([
    prisma.transaction.findMany({
      where: { deleted: false, date: { gte: from, lt: to } },
      orderBy: { date: "desc" },
      include: { account: true, pilastro: true },
    }),
    getAvailableMonths(),
  ]);

  // Raggruppa per giorno
  const byDay = new Map<string, typeof txs>();
  for (const t of txs) {
    const key = t.date.toISOString().slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(t);
  }

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
        Array.from(byDay.entries()).map(([day, items]) => {
          const dayDate = new Date(day + "T12:00:00");
          const total = items.reduce((s, t) => s + t.amount, 0);
          return (
            <div key={day} className="space-y-2">
              <div className="flex justify-between items-baseline px-1">
                <h2 className="text-sm font-semibold text-stone-700 capitalize">
                  {dayDate.toLocaleDateString("it-IT", {
                    weekday: "short",
                    day: "2-digit",
                    month: "long",
                  })}
                </h2>
                <span className="text-xs text-stone-500">
                  {formatEuro(total, { sign: true })}
                </span>
              </div>
              <Card>
                <ul className="divide-y divide-stone-100">
                  {items.map((t) => (
                    <li key={t.id} className="px-4 py-3 flex justify-between items-center">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-stone-900 truncate">
                          {t.merchant || t.description}
                        </p>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {t.pilastro?.emoji} {t.pilastro?.name ?? "—"} · {t.account.name}
                          {t.isDebtPayment && " · 🏛️ debito"}
                          {t.isInternalTransfer && " · ↔ interno"}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-semibold ml-3 ${
                          t.amount < 0 ? "text-stone-900" : "text-emerald-600"
                        }`}
                      >
                        {formatEuro(t.amount, { sign: true })}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          );
        })
      )}
    </div>
  );
}
