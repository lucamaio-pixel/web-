import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL ?? "file:./dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Cerca transazioni che contengono parole chiave tipiche delle rate
  const keywords = ["link", "finanziaria", "rata", "sentenza", "tribunale", "mutuo", "debito", "ifis", "messina", "entrate"];

  const txs = await prisma.transaction.findMany({
    where: {
      deleted: false,
      OR: keywords.map(k => ({
        OR: [
          { merchant: { contains: k } },
          { description: { contains: k } },
        ]
      }))
    },
    include: { pilastro: true, subcategory: true },
    orderBy: { date: "desc" },
  });

  console.log(`\n🔍 Transazioni trovate con parole chiave rate/debiti: ${txs.length}\n`);
  for (const t of txs) {
    const mese = t.date.toISOString().slice(0, 7);
    console.log(`  ${mese} | ${String(t.amount.toFixed(2)).padStart(10)}€ | ${(t.merchant || t.description).slice(0, 40).padEnd(40)} | ${t.pilastro?.name ?? "—"}`);
  }

  // Cerca anche le transazioni più grandi non categorizzate
  console.log(`\n\n💰 Top 20 uscite più grandi senza pilastro assegnato:\n`);
  const uncategorized = await prisma.transaction.findMany({
    where: { deleted: false, pilastroId: null, amount: { lt: -50 } },
    orderBy: { amount: "asc" },
    take: 20,
  });
  for (const t of uncategorized) {
    const mese = t.date.toISOString().slice(0, 7);
    console.log(`  ${mese} | ${String(t.amount.toFixed(2)).padStart(10)}€ | ${(t.merchant || t.description).slice(0, 50)}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
