import {
  getPilastri,
  getMonthlyStats,
  getDebtPlanStatus,
  getRecentTransactions,
  getAllBalances,
  getLibertaStatus,
} from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatEuro, formatMonth, currentMonth } from "@/lib/utils";
import Link from "next/link";
import { Flame, TrendingDown, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [pilastri, stats, debt, recent, balances, liberta] = await Promise.all([
    getPilastri(),
    getMonthlyStats(),
    getDebtPlanStatus(),
    getRecentTransactions(3),
    getAllBalances(),
    getLibertaStatus(),
  ]);

  const month = currentMonth();
  const totalBalance = balances.reduce((s, b) => s + b.balance, 0);

  const totalBudget = pilastri.reduce((s, p) => s + p.monthlyBudget, 0);
  const totalSpent = Object.values(stats.byPilastro).reduce((s, p) => s + p.spent, 0);
  const spentPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const pilastriInAllarme = pilastri.filter((p) => {
    const spent = stats.byPilastro[p.id]?.spent ?? 0;
    return p.monthlyBudget > 0 && spent / p.monthlyBudget > 0.8;
  });
  const tuttoOk = pilastriInAllarme.length === 0;

  return (
    <div className="space-y-4">

      {/* Saldo */}
      <div className="pt-2">
        <p className="text-stone-400 text-sm capitalize">{formatMonth(month)}</p>
        <div className="flex items-end justify-between mt-1">
          <div>
            <p className="text-xs text-stone-500 mb-0.5">Saldo disponibile</p>
            <p className="text-4xl font-bold text-stone-900 tracking-tight">
              {formatEuro(totalBalance)}
            </p>
          </div>
          <div className="text-right space-y-0.5 pb-1">
            {balances.map((b) => (
              <div key={b.id} className="flex items-center gap-2 justify-end">
                <span className="text-xs text-stone-400">{b.name}</span>
                <span className="text-xs font-medium text-stone-600">{formatEuro(b.balance)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spese mese */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex justify-between items-baseline mb-2">
            <p className="text-sm font-semibold text-stone-700">Spese questo mese</p>
            <Link href="/pilastri" className="text-xs text-emerald-700 font-medium flex items-center gap-0.5">
              Dettaglio <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <Progress
            value={Math.min(spentPercent, 100)}
            variant={spentPercent > 100 ? "danger" : spentPercent > 80 ? "warning" : "success"}
            className="h-3"
          />
          <div className="flex justify-between text-xs mt-2">
            <span className="font-semibold text-stone-800">{formatEuro(totalSpent)}</span>
            <span className="text-stone-400">budget {formatEuro(totalBudget)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Pilastri in allarme */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">
          Pilastri
        </p>
        {tuttoOk ? (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            <span className="text-lg">✅</span>
            <p className="text-sm font-medium text-emerald-800">Tutto nei limiti questo mese</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pilastriInAllarme.map((p) => {
              const spent = stats.byPilastro[p.id]?.spent ?? 0;
              const percent = (spent / p.monthlyBudget) * 100;
              const isOver = percent > 100;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                    isOver
                      ? "bg-red-50 border-red-100"
                      : "bg-amber-50 border-amber-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{p.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-stone-800">{p.name}</p>
                      <p className="text-xs text-stone-500">
                        {formatEuro(spent)} / {formatEuro(p.monthlyBudget)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      isOver ? "text-red-600" : "text-amber-600"
                    }`}
                  >
                    {Math.round(percent)}%
                  </span>
                </div>
              );
            })}
            <Link href="/pilastri" className="block text-center text-xs text-stone-400 pt-1">
              Vedi tutti i pilastri →
            </Link>
          </div>
        )}
      </div>

      {/* Libertà Finanziaria — mini */}
      <Link href="/liberta">
        <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100 active:scale-[0.99] transition-transform">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500" />
                <p className="text-sm font-semibold text-stone-800">Libertà Finanziaria</p>
              </div>
              <span className="text-xs text-orange-600 font-bold">
                {liberta.coveragePercent.toFixed(1)}%
              </span>
            </div>
            <Progress
              value={Math.min(liberta.coveragePercent, 100)}
              barClassName="bg-orange-500"
              className="h-2 mb-2"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1 text-xs text-stone-500">
                <TrendingDown className="w-3 h-3 text-violet-500" />
                <span>Debito estinto {liberta.debtPaidPercent.toFixed(1)}%</span>
              </div>
              <span className="text-xs text-stone-400">
                asset {formatEuro(liberta.totalAssetIncome)}/mese
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Ultimi movimenti */}
      <div>
        <div className="flex justify-between items-baseline mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            Ultimi movimenti
          </p>
          <Link href="/transazioni" className="text-xs text-emerald-700 font-medium">
            Tutti →
          </Link>
        </div>
        {recent.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-stone-400 text-sm">
              Nessun movimento — importa un CSV per iniziare
            </CardContent>
          </Card>
        ) : (
          <Card>
            <ul className="divide-y divide-stone-100">
              {recent.map((t) => (
                <li key={t.id} className="px-4 py-3 flex justify-between items-center">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-900 truncate">
                      {t.merchant || t.description}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {t.pilastro?.emoji} {t.pilastro?.name ?? "Non categorizzato"} ·{" "}
                      {t.date.toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold ml-3 ${t.amount < 0 ? "text-stone-800" : "text-emerald-600"}`}>
                    {formatEuro(t.amount, { sign: true })}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

    </div>
  );
}
