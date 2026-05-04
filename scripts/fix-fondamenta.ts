import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL ?? "file:./dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.pilastro.update({
    where: { key: "fondamenta" },
    data: {
      name: "Spese Fisse Casa",
      monthlyBudget: 376,
      description: "Bollette, abbonamenti, condominio, telefonia, scuola/danza — spese fisse ricorrenti di casa",
    },
  });
  console.log("✓ Fondamenta → Spese Fisse Casa (€376/mese)");
  console.log("\n✅ Aggiornato!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
