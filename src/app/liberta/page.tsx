import { getLibertaStatus } from "@/lib/queries";
import { formatEuro, formatMonth } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, TrendingUp, TrendingDown, Landmark, Calendar, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  immobile: "Immobile",
  business: "Business",
  investimento: "Investimento",
  altro: "Altro",
};

export default async function LibertaPage() {
  const status = await getLibertaStatus();
  const {
    assets,
    totalAssetIncome,
    totalAssetValue,
    monthlyExpenses,
    coveragePercent,
    remainingDebt,
    debtPaidPercent,
    netWorth,
    debtStatus,
  } = status;

  const gapToFreedom = Math.max(0, monthlyExpenses - totalAssetIncome);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <p className="text-orange-600 text-sm font-medium uppercase tracking-wide">
            Percorso
          </p>
        </div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Libertà Finanziaria</h1>
        <p className="text-stone-500 text-sm mt-1">
          Obiettivo: reddito da asset ≥ spese mensili
        </p>
      </header>

      {/* Termometro copertura */}
      <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100">
        <CardContent className="pt-6 pb-5">
          <div className="flex items-end justify-between mb-1">
            <div>
              <p className="text-xs uppercase tracking-wide text-orange-600 font-semibold">
                Copertura spese
              </p>
              <p className="text-4xl font-bold text-stone-900 mt-0.5">
                {coveragePercent.toFixed(1)}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-500">Reddito asset</p>
              <p className="text-lg font-bold text-emerald-600">{formatEuro(totalAssetIncome)}/mese</p>
              <p className="text-xs text-stone-400">su {formatEuro(monthlyExpenses)}/mese</p>
            </div>
          </div>
          <Progress value={Math.min(coveragePercent, 100)} barClassName="bg-orange-500" className="h-4 mt-3" />
          {gapToFreedom > 0 && (
            <p className="text-xs text-stone-500 mt-2 text-center">
              Mancano <span className="font-semibold text-stone-700">{formatEuro(gapToFreedom)}/mese</span> di reddito passivo
            </p>
          )}
          {gapToFreedom === 0 && (
            <p className="text-xs text-emerald-600 mt-2 text-center font-semibold">
              🎉 Libertà finanziaria raggiunta!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Attivi */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <CardTitle>Attivi</CardTitle>
            </div>
            <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {formatEuro(totalAssetIncome)}/mese
            </span>
          </div>
          <CardDescription>Ciò che mette soldi in tasca ogni mese</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{asset.emoji}</span>
                <div>
                  <p className="font-semibold text-stone-900 text-sm">{asset.name}</p>
                  <p className="text-xs text-stone-400">{CATEGORY_LABEL[asset.category] ?? asset.category}</p>
                  {asset.notes && (
                    <p className="text-xs text-stone-400 mt-0.5 italic">{asset.notes}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                {asset.monthlyIncome > 0 ? (
                  <p className="text-sm font-bold text-emerald-600">+{formatEuro(asset.monthlyIncome)}/mese</p>
                ) : (
                  <p className="text-xs text-stone-400 italic">in costruzione</p>
                )}
                {asset.currentValue > 0 && (
                  <p className="text-xs text-stone-400 mt-0.5">val. {formatEuro(asset.currentValue)}</p>
                )}
              </div>
            </div>
          ))}
          {assets.length === 0 && (
            <p className="text-sm text-stone-400 text-center py-4">Nessun asset configurato</p>
          )}
        </CardContent>
      </Card>

      {/* Passivi — barra che scende */}
      <Card className="bg-gradient-to-br from-violet-50 to-white border-violet-100">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-violet-600" />
              <CardTitle>Passivi</CardTitle>
            </div>
            <span className="text-sm font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
              -{formatEuro(remainingDebt)}
            </span>
          </div>
          <CardDescription>Ciò che toglie soldi di tasca — in diminuzione</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-xs text-stone-500 mb-1.5">
              <span>Debito estinto</span>
              <span className="font-medium text-violet-700">{debtPaidPercent.toFixed(1)}%</span>
            </div>
            {/* Barra inversa: cresce verso destra man mano che il debito scende */}
            <div className="w-full h-4 bg-violet-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all"
                style={{ width: `${Math.min(debtPaidPercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-stone-400 mt-1">
              <span>Pagato: {formatEuro((debtStatus?.paidAmount ?? 0))}</span>
              <span>Rimane: {formatEuro(remainingDebt)}</span>
            </div>
          </div>

          {/* Date liberazione */}
          {debtStatus && debtStatus.liberations.slice(0, 2).map((lib, i) => (
            <div
              key={lib.month}
              className={`flex items-center justify-between p-3 rounded-xl ${
                i === 0 ? "bg-amber-50 border border-amber-100" : "bg-stone-50 border border-stone-100"
              }`}
            >
              <div className="flex items-center gap-2">
                {i === 0 ? (
                  <Sparkles className="w-4 h-4 text-amber-500" />
                ) : (
                  <Calendar className="w-4 h-4 text-stone-400" />
                )}
                <div>
                  <p className="text-xs font-semibold text-stone-700 capitalize">{formatMonth(lib.month)}</p>
                  <p className="text-[10px] text-stone-400">liberazione step {i + 1}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-emerald-600">-{formatEuro(lib.saved)}/mese</p>
                <p className="text-[10px] text-stone-400">{formatEuro(lib.to)}/mese dopo</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Patrimonio netto */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-stone-600" />
            <CardTitle>Patrimonio Netto</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Valore totale attivi" value={formatEuro(totalAssetValue)} positive />
          <Row label="Debito residuo" value={`-${formatEuro(remainingDebt)}`} negative />
          <div className="border-t border-stone-200 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="font-semibold text-stone-700">Patrimonio netto</span>
              <span className={`font-bold text-base ${netWorth >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                {netWorth >= 0 ? "+" : ""}{formatEuro(netWorth)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  positive,
  negative,
}: {
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex justify-between py-1.5 border-b border-stone-100 last:border-0">
      <span className="text-stone-600">{label}</span>
      <span className={`font-medium ${positive ? "text-emerald-700" : negative ? "text-red-600" : "text-stone-900"}`}>
        {value}
      </span>
    </div>
  );
}
