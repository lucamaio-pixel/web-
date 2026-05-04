import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL ?? "file:./dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const fondamenta = await prisma.pilastro.findUnique({
    where: { key: "fondamenta" },
    include: { subcategories: true },
  });
  if (!fondamenta) return;

  console.log(`\n🏠 FONDAMENTA — Budget dichiarato: €${fondamenta.monthlyBudget}/mese\n`);

  // Per ogni mese disponibile, raggruppa per sottocategoria
  const txs = await prisma.transaction.findMany({
    where: { pilastroId: fondamenta.id, deleted: false, amount: { lt: 0 } },
    include: { subcategory: true },
    orderBy: { date: "asc" },
  });

  // Raggruppa per mese
  const byMonth = new Map<string, typeof txs>();
  for (const t of txs) {
    const m = t.date.toISOString().slice(0, 7);
    if (!byMonth.has(m)) byMonth.set(m, []);
    byMonth.get(m)!.push(t);
  }

  // Media per sottocategoria
  const subcatTotals = new Map<string, number[]>();
  for (const [, monthTxs] of byMonth) {
    const monthBySubcat = new Map<string, number>();
    for (const t of monthTxs) {
      const key = t.subcategory?.name ?? "Senza sottocategoria";
      monthBySubcat.set(key, (monthBySubcat.get(key) ?? 0) + Math.abs(t.amount));
    }
    for (const [k, v] of monthBySubcat) {
      if (!subcatTotals.has(k)) subcatTotals.set(k, []);
      subcatTotals.get(k)!.push(v);
    }
  }

  console.log("Spesa media mensile per sottocategoria (dai dati reali):\n");
  const rows: { name: string; avg: number }[] = [];
  for (const [name, vals] of subcatTotals) {
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    rows.push({ name, avg });
  }
  rows.sort((a, b) => b.avg - a.avg);

  let total = 0;
  for (const r of rows) {
    console.log(`  ${r.name.padEnd(30)} €${r.avg.toFixed(0).padStart(6)}/mese`);
    total += r.avg;
  }
  console.log(`\n  ${"TOTALE MEDIO".padEnd(30)} €${total.toFixed(0).padStart(6)}/mese`);
  console.log(`  ${"BUDGET DICHIARATO".padEnd(30)} €${fondamenta.monthlyBudget.toFixed(0).padStart(6)}/mese`);
  console.log(`\nMesi analizzati: ${byMonth.size} (${[...byMonth.keys()].join(", ")})`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
