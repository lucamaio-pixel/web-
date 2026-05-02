import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { formatEuro } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TransazioniPage() {
  const txs = await prisma.transaction.findMany({
    where: { deleted: false },
    orderBy: { date: "desc" },
    take: 200,
    include: { account: true, pilastro: true },
  });

  // Raggruppa per giorno
  const byDay = new Map<string, typeof txs>();
  for (const t of txs) {
    const key = t.date.toISOString().slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(t);
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-stone-500 text-sm">Storico</p>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Movimenti</h1>
        <p className="text-stone-600 text-sm mt-1">
          {txs.length === 0
            ? "Nessun movimento ancora. Importa un CSV."
            : `${txs.length} transazioni più recenti`}
        </p>
      </header>

      {Array.from(byDay.entries()).map(([day, items]) => {
        const dayDate = new Date(day);
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
                  <li
                    key={t.id}
                    className="px-4 py-3 flex justify-between items-center"
                  >
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
      })}
    </div>
  );
}
