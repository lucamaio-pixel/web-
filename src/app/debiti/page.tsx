import { getDebtPlanStatus } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatEuro, formatMonth, currentMonth } from "@/lib/utils";
import { Sparkles, Calendar, TrendingDown, Landmark } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DebitiPage() {
  const status = await getDebtPlanStatus();

  if (!status) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-stone-900">Piano Debito</h1>
        <p className="text-stone-500 mt-2">Nessun piano attivo configurato.</p>
      </div>
    );
  }

  const {
    plan,
    totalCount,
    totalAmount,
    paidCount,
    paidAmount,
    remainingCount,
    remainingAmount,
    currentMonthlyTotal,
    progressPercent,
    liberations,
  } = status;

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Landmark className="w-5 h-5 text-violet-600" />
          <p className="text-violet-700 text-sm font-medium uppercase tracking-wide">
            Piano del Consumatore
          </p>
        </div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">{plan.name}</h1>
        {plan.description && (
          <p className="text-stone-600 text-sm mt-2">{plan.description}</p>
        )}
      </header>

      {/* Progresso totale */}
      <Card className="bg-gradient-to-br from-violet-50 to-white border-violet-100">
        <CardContent className="pt-6 pb-5">
          <div className="text-center mb-4">
            <p className="text-xs uppercase tracking-wide text-violet-600 font-semibold">
              Avanzamento
            </p>
            <p className="text-4xl font-bold text-stone-900 mt-1">
              {Math.round(progressPercent)}%
            </p>
          </div>
          <Progress value={progressPercent} barClassName="bg-violet-600" className="h-3" />
          <div className="grid grid-cols-3 gap-2 mt-5 text-center">
            <div>
              <p className="text-xs text-stone-500">Pagato</p>
              <p className="text-sm font-semibold text-stone-900">{formatEuro(paidAmount)}</p>
              <p className="text-[10px] text-stone-400">{paidCount} rate</p>
            </div>
            <div className="border-x border-violet-100">
              <p className="text-xs text-stone-500">Mensile ora</p>
              <p className="text-sm font-semibold text-stone-900">
                {formatEuro(currentMonthlyTotal)}
              </p>
              <p className="text-[10px] text-stone-400">questo mese</p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Rimanente</p>
              <p className="text-sm font-semibold text-stone-900">{formatEuro(remainingAmount)}</p>
              <p className="text-[10px] text-stone-400">{remainingCount} rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date di liberazione */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <CardTitle>Date di Liberazione</CardTitle>
          </div>
          <CardDescription>
            Ogni volta che una rata finisce, hai più soldi liberi ogni mese.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {liberations.map((lib, i) => {
            const isFirst = i === 0;
            const monthsAway = monthsBetween(currentMonth(), lib.month);
            return (
              <div
                key={lib.month}
                className={`flex items-center justify-between p-4 rounded-xl ${
                  isFirst
                    ? "bg-amber-50 border border-amber-200"
                    : "bg-stone-50 border border-stone-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar
                    className={`w-5 h-5 ${isFirst ? "text-amber-600" : "text-stone-500"}`}
                  />
                  <div>
                    <p className="font-semibold text-stone-900 text-sm capitalize">
                      {formatMonth(lib.month)}
                    </p>
                    <p className="text-xs text-stone-500">
                      {monthsAway} {monthsAway === 1 ? "mese" : "mesi"} da oggi
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-emerald-700 font-semibold text-sm">
                    <TrendingDown className="w-3 h-3" />
                    -{formatEuro(lib.saved)}/mese
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    da {formatEuro(lib.from)} a {formatEuro(lib.to)}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Riepilogo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riepilogo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Rate totali del piano" value={`${totalCount}`} />
          <Row label="Importo totale" value={formatEuro(totalAmount)} />
          <Row label="Già pagato" value={formatEuro(paidAmount)} />
          <Row label="Ancora da pagare" value={formatEuro(remainingAmount)} highlight />
          <Row
            label="Inizio piano"
            value={plan.startDate.toLocaleDateString("it-IT", {
              month: "long",
              year: "numeric",
            })}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-stone-100 last:border-0">
      <span className="text-stone-600">{label}</span>
      <span className={`font-medium ${highlight ? "text-violet-700" : "text-stone-900"}`}>
        {value}
      </span>
    </div>
  );
}

function monthsBetween(from: string, to: string): number {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm);
}
