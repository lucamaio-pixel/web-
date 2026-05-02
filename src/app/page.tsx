import {
  getPilastri,
  getMonthlyStats,
  getDebtPlanStatus,
  getScudoStatus,
  getRecentTransactions,
  getDataInfo,
  getAllBalances,
} from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatEuro, formatMonth, currentMonth } from "@/lib/utils";
import Link from "next/link";
import { Upload, Shield, ArrowRight, Sparkles, Landmark, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [pilastri, stats, debt, scudo, recent, dataInfo, balances] = await Promise.all([
    getPilastri(),
    getMonthlyStats(),
    getDebtPlanStatus(),
    getScudoStatus(),
    getRecentTransactions(5),
    getDataInfo(),
    getAllBalances(),
  ]);

  const month = currentMonth();
  const totalBalance = balances.reduce((s, b) => s + b.balance, 0);
  const isEmpty = dataInfo.txCount === 0;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-stone-500 text-sm capitalize">{formatMonth(month)}</p>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Pilastri</h1>
      </header>

      {isEmpty && <EmptyState />}

      <Card>
        <CardContent className="pt-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-stone-500">Disponibile oggi</p>
              <p className="text-3xl font-bold text-stone-900 mt-1">
                {formatEuro(totalBalance)}
              </p>
            </div>
            <div className="text-right text-xs text-stone-600 space-y-0.5">
              {balances.map((b) => (
                <div key={b.id} className="flex items-center gap-2 justify-end">
                  <span className="text-stone-500">{b.name}</span>
                  <span className="font-medium">{formatEuro(b.balance)}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {scudo && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                <CardTitle>Scudo Emergenze</CardTitle>
              </div>
              <span className="text-sm font-semibold text-emerald-700">
                {Math.round(scudo.percent)}%
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={scudo.percent} className="h-3" />
            <div className="flex justify-between text-sm mt-3">
              <span className="text-stone-600">
                <span className="font-semibold text-stone-900">{formatEuro(scudo.current)}</span>
                <span className="text-stone-400"> / {formatEuro(scudo.target)}</span>
              </span>
              {scudo.monthsToGoal > 0 && (
                <span className="text-stone-500">~{scudo.monthsToGoal} mesi all'obiettivo</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {debt && debt.nextLiberation && (
        <Card className="bg-gradient-to-br from-violet-50 to-white border-violet-100">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-violet-600" />
                <CardTitle>Piano Debito</CardTitle>
              </div>
              <Link
                href="/debiti"
                className="text-xs text-violet-700 font-medium hover:underline flex items-center gap-1"
              >
                Dettaglio <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress
              value={debt.progressPercent}
              barClassName="bg-violet-600"
            />
            <div className="flex justify-between text-xs text-stone-600">
              <span>{debt.paidCount} rate pagate</span>
              <span>{debt.remainingCount} rimanenti</span>
            </div>
            <div className="bg-violet-100/60 rounded-xl p-3 mt-2">
              <div className="flex items-center gap-2 text-violet-900">
                <Sparkles className="w-4 h-4" />
                <p className="text-sm font-semibold">
                  Prima liberazione: {formatMonth(debt.nextLiberation.month)}
                </p>
              </div>
              <p className="text-xs text-violet-700 mt-1">
                Mancano {debt.monthsToNextLiberation} mesi → {formatEuro(debt.nextLiberation.saved)}/mese liberi
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <section>
        <div className="flex justify-between items-baseline mb-3">
          <h2 className="text-lg font-semibold text-stone-900">I Pilastri</h2>
          <Link href="/pilastri" className="text-xs text-emerald-700 font-medium hover:underline">
            Tutti →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {pilastri.slice(0, 6).map((p) => {
            const spent = stats.byPilastro[p.id]?.spent ?? 0;
            const percent = p.monthlyBudget > 0 ? (spent / p.monthlyBudget) * 100 : 0;
            const variant: "success" | "warning" | "danger" =
              percent > 100 ? "danger" : percent > 80 ? "warning" : "success";
            return (
              <Card key={p.id} className="p-4">
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{p.emoji}</span>
                  <span className="text-[10px] uppercase tracking-wide text-stone-400 font-medium">
                    mese
                  </span>
                </div>
                <p className="font-semibold text-stone-900 mt-2">{p.name}</p>
                <div className="mt-2 space-y-1.5">
                  <Progress value={percent} variant={variant} />
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-600">{formatEuro(spent)}</span>
                    <span className="text-stone-400">{formatEuro(p.monthlyBudget)}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex justify-between items-baseline mb-3">
          <h2 className="text-lg font-semibold text-stone-900">Ultimi movimenti</h2>
          <Link href="/transazioni" className="text-xs text-emerald-700 font-medium">
            Tutti →
          </Link>
        </div>
        {recent.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-stone-500 text-sm">
              Nessun movimento. Importa il primo CSV per iniziare.
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
                    <p className="text-xs text-stone-500 mt-0.5">
                      {t.pilastro?.emoji} {t.pilastro?.name ?? "Non categorizzato"} ·{" "}
                      {t.date.toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
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
        )}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link href="/import">
          <Button variant="default" className="w-full" size="lg">
            <Upload className="w-4 h-4" /> Importa CSV
          </Button>
        </Link>
        <Link href="/report">
          <Button variant="soft" className="w-full" size="lg">
            <FileText className="w-4 h-4" /> Report Claude
          </Button>
        </Link>
      </section>

      {dataInfo.txCount > 0 && (
        <p className="text-center text-xs text-stone-400 pt-4">
          {dataInfo.txCount} transazioni · {dataInfo.months} mesi di storico ·{" "}
          {stats.txCount} questo mese
        </p>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
      <CardContent className="py-8 text-center space-y-4">
        <div className="text-5xl">🏛️</div>
        <div>
          <h2 className="font-semibold text-stone-900">Benvenuto nei Pilastri</h2>
          <p className="text-sm text-stone-600 mt-1 max-w-sm mx-auto">
            Il sistema è pronto. Importa il primo CSV di Hype per iniziare a vedere
            la fotografia delle tue finanze.
          </p>
        </div>
        <Link href="/import">
          <Button>
            <Upload className="w-4 h-4" /> Importa primo CSV
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
