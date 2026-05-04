import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL ?? "file:./dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const INCOME = 2647;

  const pilastri = await prisma.pilastro.findMany({
    include: { subcategories: true },
    orderBy: { order: "asc" },
  });

  const txs = await prisma.transaction.findMany({
    where: { deleted: false, amount: { lt: 0 }, isInternalTransfer: false },
    include: { pilastro: true, subcategory: true },
    orderBy: { date: "asc" },
  });

  // Mesi distinti
  const months = [...new Set(txs.map(t => t.date.toISOString().slice(0, 7)))].sort();
  const nMonths = months.length;

  console.log(`\n📊 ANALISI BUDGET — ${nMonths} mesi (${months[0]} → ${months[months.length-1]})`);
  console.log(`💰 Reddito mensile stimato: €${INCOME}`);
  console.log(`${"─".repeat(80)}\n`);

  let totalBudgetAttuale = 0;
  let totalSpesaMedia = 0;

  for (const p of pilastri) {
    const pTxs = txs.filter(t => t.pilastroId === p.id);
    const pTotal = Math.abs(pTxs.reduce((s, t) => s + t.amount, 0));
    const pMedia = pTotal / nMonths;

    console.log(`${p.emoji} ${p.name.toUpperCase()} — Budget: €${p.monthlyBudget}/m | Media reale: €${pMedia.toFixed(0)}/m`);
    totalBudgetAttuale += p.monthlyBudget;
    totalSpesaMedia += pMedia;

    // Per sottocategoria
    for (const sub of p.subcategories.sort((a, b) => a.order - b.order)) {
      const sTxs = pTxs.filter(t => t.subcategoryId === sub.id);
      if (sTxs.length === 0) continue;
      const sTotal = Math.abs(sTxs.reduce((s, t) => s + t.amount, 0));
      const sMedia = sTotal / nMonths;
      const pct = pMedia > 0 ? (sMedia / pMedia * 100).toFixed(0) : "0";
      console.log(`   ${sub.emoji} ${sub.name.padEnd(25)} media: €${sMedia.toFixed(0).padStart(5)}/m  (${pct}% del pilastro)`);
    }

    // Non categorizzati nel pilastro
    const noSubTxs = pTxs.filter(t => !t.subcategoryId);
    if (noSubTxs.length > 0) {
      const nsTotal = Math.abs(noSubTxs.reduce((s, t) => s + t.amount, 0));
      console.log(`   ❓ ${"Senza sottocategoria".padEnd(25)} media: €${(nsTotal/nMonths).toFixed(0).padStart(5)}/m`);
    }
    console.log();
  }

  // Transazioni senza pilastro
  const noPilTxs = txs.filter(t => !t.pilastroId);
  const noPilTotal = Math.abs(noPilTxs.reduce((s, t) => s + t.amount, 0));
  if (noPilTxs.length > 0) {
    console.log(`❓ NON CATEGORIZZATI — media: €${(noPilTotal/nMonths).toFixed(0)}/m (${noPilTxs.length} transazioni)`);
  }

  console.log(`${"─".repeat(80)}`);
  console.log(`📋 RIEPILOGO GLOBALE`);
  console.log(`   Budget totale dichiarato:  €${totalBudgetAttuale.toFixed(0)}/m`);
  console.log(`   Spesa media reale:         €${totalSpesaMedia.toFixed(0)}/m`);
  console.log(`   Reddito stimato:           €${INCOME}/m`);
  console.log(`   Saldo medio:               €${(INCOME - totalSpesaMedia).toFixed(0)}/m`);
  console.log(`   Budget vs Reddito:         ${((totalBudgetAttuale/INCOME)*100).toFixed(0)}% del reddito`);
  console.log(`   Spesa reale vs Reddito:    ${((totalSpesaMedia/INCOME)*100).toFixed(0)}% del reddito`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
