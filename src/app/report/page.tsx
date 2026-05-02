import {
  getPilastri,
  getMonthlyStats,
  getDebtPlanStatus,
  getScudoStatus,
  getDataInfo,
  getAllBalances,
} from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";
import { formatEuro, formatMonth, currentMonth } from "@/lib/utils";
import { ReportClient } from "./client";

export const dynamic = "force-dynamic";

export default async function ReportPage() {
  const month = currentMonth();
  const [pilastri, stats, debt, scudo, info, balances] = await Promise.all([
    getPilastri(),
    getMonthlyStats(month),
    getDebtPlanStatus(),
    getScudoStatus(),
    getDataInfo(),
    getAllBalances(),
  ]);

  const totalBalance = balances.reduce((s, b) => s + b.balance, 0);

  let report = `📋 REPORT PILASTRI — ${formatMonth(month)}\n\n`;

  report += `💰 SALDO TOTALE: ${formatEuro(totalBalance)}\n`;
  for (const b of balances) {
    report += `   ${b.name}: ${formatEuro(b.balance)}\n`;
  }

  if (scudo) {
    report += `\n🛡️  SCUDO: ${formatEuro(scudo.current)} / ${formatEuro(scudo.target)} (${Math.round(scudo.percent)}%)\n`;
    report += `   Mancano ${scudo.monthsToGoal} mesi all'obiettivo\n`;
  }

  if (debt) {
    report += `\n🏛️  PIANO DEBITO: ${Math.round(debt.progressPercent)}% pagato\n`;
    report += `   ${debt.paidCount} rate pagate · ${debt.remainingCount} rimanenti\n`;
    report += `   Rata mensile attuale: ${formatEuro(debt.currentMonthlyTotal)}\n`;
    if (debt.nextLiberation) {
      report += `   ✨ Prima liberazione: ${formatMonth(debt.nextLiberation.month)} (${debt.monthsToNextLiberation} mesi) → -${formatEuro(debt.nextLiberation.saved)}/mese\n`;
    }
  }

  report += `\n🪣 STATO PILASTRI questo mese:\n`;
  for (const p of pilastri) {
    const spent = stats.byPilastro[p.id]?.spent ?? 0;
    const percent = p.monthlyBudget > 0 ? Math.round((spent / p.monthlyBudget) * 100) : 0;
    const bar = "█".repeat(Math.min(10, Math.floor(percent / 10))) + "░".repeat(Math.max(0, 10 - Math.floor(percent / 10)));
    report += `   ${p.emoji} ${p.name.padEnd(14)} ${bar} ${percent}% — ${formatEuro(spent)} / ${formatEuro(p.monthlyBudget)}\n`;
  }

  report += `\n📊 RIEPILOGO MESE:\n`;
  report += `   Entrate: ${formatEuro(stats.totalIncome)}\n`;
  report += `   Uscite:  ${formatEuro(stats.totalExpenses)}\n`;
  report += `   Netto:   ${formatEuro(stats.totalIncome - stats.totalExpenses, { sign: true })}\n`;
  report += `   Movimenti: ${stats.txCount}\n`;

  report += `\n📈 DATI:\n`;
  report += `   Totale transazioni storiche: ${info.txCount}\n`;
  report += `   Mesi tracciati: ${info.months}\n`;
  if (info.firstDate) {
    report += `   Primo movimento: ${info.firstDate.toLocaleDateString("it-IT")}\n`;
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-stone-500 text-sm">Per consultazione</p>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">
          Report per Claude
        </h1>
        <p className="text-stone-600 text-sm mt-1">
          Copia questo report e incollalo nella chat per ragionare insieme sui dati.
        </p>
      </header>

      <ReportClient text={report} />

      <Card>
        <CardContent className="pt-5">
          <pre className="text-xs font-mono text-stone-800 whitespace-pre-wrap leading-relaxed overflow-x-auto">
            {report}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
