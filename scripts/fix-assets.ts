import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL ?? "file:./dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

const ASSETS = [
  {
    name: "B&B",
    category: "immobile",
    emoji: "🏠",
    monthlyIncome: 250,
    currentValue: 0,
    notes: "Reddito mensile costante da affitto B&B",
    order: 1,
  },
  {
    name: "Network21",
    category: "business",
    emoji: "🚀",
    monthlyIncome: 0,
    currentValue: 0,
    notes: "Business in costruzione — obiettivo: royalties residuali",
    order: 2,
  },
  {
    name: "Interactive Brokers",
    category: "investimento",
    emoji: "📈",
    monthlyIncome: 0,
    currentValue: 0,
    notes: "Conto investimento — da popolare progressivamente",
    order: 3,
  },
];

async function main() {
  // Crea tabella Asset se non esiste (migrazione manuale per Turso)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Asset" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "emoji" TEXT NOT NULL DEFAULT '💰',
      "monthlyIncome" REAL NOT NULL DEFAULT 0,
      "currentValue" REAL NOT NULL DEFAULT 0,
      "notes" TEXT,
      "active" INTEGER NOT NULL DEFAULT 1,
      "order" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("✓ Tabella Asset verificata");

  for (const a of ASSETS) {
    const existing = await prisma.asset.findFirst({ where: { name: a.name } });
    if (!existing) {
      await prisma.asset.create({
        data: { ...a, updatedAt: new Date() } as Parameters<typeof prisma.asset.create>[0]["data"],
      });
      console.log(`✓ Asset creato: ${a.emoji} ${a.name}`);
    } else {
      console.log(`  (già presente: ${a.emoji} ${a.name})`);
    }
  }

  console.log("\n✅ Asset iniziali configurati!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
