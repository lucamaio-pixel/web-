import { getPilastri, getMonthlyStats } from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatEuro, formatMonth, currentMonth } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PilastriPage() {
  const [pilastri, stats] = await Promise.all([getPilastri(), getMonthlyStats()]);
  const totalBudget = pilastri.reduce((s, p) => s + p.monthlyBudget, 0);
  const totalSpent = Object.values(stats.byPilastro).reduce((s, p) => s + p.spent, 0);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-stone-500 text-sm capitalize">{formatMonth(currentMonth())}</p>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">I Pilastri</h1>
        <p className="text-stone-600 text-sm mt-1">
          Ogni euro ha un compito. {formatEuro(totalSpent)} di {formatEuro(totalBudget)} allocati questo mese.
        </p>
      </header>

      <div className="space-y-3">
        {pilastri.map((p) => {
          const spent = stats.byPilastro[p.id]?.spent ?? 0;
          const count = stats.byPilastro[p.id]?.count ?? 0;
          const percent = p.monthlyBudget > 0 ? (spent / p.monthlyBudget) * 100 : 0;
          const remaining = p.monthlyBudget - spent;
          const variant: "success" | "warning" | "danger" =
            percent > 100 ? "danger" : percent > 80 ? "warning" : "success";

          return (
            <Card key={p.id}>
              <CardContent className="pt-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-3 items-start">
                    <span className="text-3xl">{p.emoji}</span>
                    <div>
                      <h3 className="font-semibold text-stone-900">{p.name}</h3>
                      {p.description && (
                        <p className="text-xs text-stone-500 mt-0.5 max-w-xs">
                          {p.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-stone-900">
                      {formatEuro(p.monthlyBudget)}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-stone-400">
                      al mese
                    </p>
                  </div>
                </div>

                <Progress value={percent} variant={variant} className="h-2.5" />

                <div className="flex justify-between text-sm mt-2">
                  <span className="text-stone-600">
                    Speso: <span className="font-medium text-stone-900">{formatEuro(spent)}</span>
                  </span>
                  <span
                    className={
                      remaining < 0
                        ? "text-red-600 font-medium"
                        : remaining < p.monthlyBudget * 0.2
                        ? "text-amber-600"
                        : "text-emerald-700"
                    }
                  >
                    {remaining >= 0
                      ? `${formatEuro(remaining)} rimasti`
                      : `${formatEuro(Math.abs(remaining))} sforati`}
                  </span>
                </div>
                {count > 0 && (
                  <p className="text-xs text-stone-400 mt-2">
                    {count} {count === 1 ? "transazione" : "transazioni"} questo mese
                  </p>
                )}

                {p.key === "scudo" && p.goalAmount && (
                  <div className="mt-3 pt-3 border-t border-stone-100">
                    <p className="text-xs text-stone-500">
                      Obiettivo totale:{" "}
                      <span className="font-semibold text-stone-700">
                        {formatEuro(p.goalAmount)}
                      </span>{" "}
                      · saldo attuale {formatEuro(p.currentBalance)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
