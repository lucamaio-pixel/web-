import {
  getPilastri,
  getMonthlyStats,
  getRecentTransactions,
  getLiquidityStatus,
  getLibertaStatus,
  getCushionBusinessSpend,
} from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatEuro, formatMonth, currentMonth } from "@/lib/utils";
import Link from "next/link";
import { Flame, TrendingDown, ChevronRight, Lock, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [pilastri, stats, recent, liquidity, liberta, cushionBusiness] = await Promise.all([
    getPilastri(),
    getMonthlyStats(),
    getRecentTransactions(3),
    getLiquidityStatus(),
    getLibertaStatus(),
    getCushionBusinessSpend(),
  ]);

  const month = currentMonth();
  const balances = liquidity.balances;
  const totalBalance = liquidity.total;
  const cushion = liquidity.cushion;

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

      {/* Cuscino congelato + disponibile operativo */}
      {cushion && (
        <Card className={cushion.belowFloor ? "border-red-200 bg-red-50/60" : "border-emerald-100 bg-emerald-50/40"}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Lock className={`w-4 h-4 ${cushion.belowFloor ? "text-red-500" : "text-emerald-600"}`} />
                <p className="text-sm font-semibold text-stone-700">
                  Cuscino congelato <span className="font-normal text-stone-400">({cushion.accountName})</span>
                </p>
              </div>
              <span className={`text-sm font-bold ${cushion.belowFloor ? "text-red-600" : "text-emerald-700"}`}>
                {formatEuro(cushion.balance)}
              </span>
            </div>
            <Progress
              value={Math.min(cushion.percentToTarget, 100)}
              barClassName={cushion.belowFloor ? "bg-red-500" : "bg-emerald-500"}
              className="h-2"
            />
            <div className="flex justify-between text-xs mt-1.5">
              <span className="text-stone-400">obiettivo {formatEuro(cushion.target)}</span>
              <span className="text-stone-400">
                {cushion.deficit > 0 ? `mancano ${formatEuro(cushion.deficit)}` : "obiettivo raggiunto"}
              </span>
            </div>

            {/* Allarme: spese business pagate dal cuscino */}
            {cushionBusiness.total > 0 && (
              <div className="flex items-start gap-1.5 mt-3 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg p-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>{formatEuro(cushionBusiness.total)}</strong> di spese business pagate dal cuscino questo mese
                  ({cushionBusiness.count} mov.). Il business va pagato con i suoi incassi, non dal cuscino.
                </span>
              </div>
            )}

            {cushion.belowFloor ? (
              <p className="text-xs text-red-700 mt-3">
                Sotto il minimo di {formatEuro(cushion.floor)} — da ricostruire.
              </p>
            ) : (
              <p className="text-xs text-stone-500 mt-3">
                Disponibile senza toccare il cuscino:{" "}
                <strong className="text-stone-700">{formatEuro(liquidity.operational)}</strong>
              </p>
            )}
          </CardContent>
        </Card>
      )}

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
                        {isOver && (
                          <span className="text-red-600 font-medium">
                            {" "}· +{formatEuro(spent - p.monthlyBudget)} oltre
                          </span>
                        )}
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
