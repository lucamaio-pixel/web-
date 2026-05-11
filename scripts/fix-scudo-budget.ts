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
    where: { key: "scudo" },
    data: {
      monthlyBudget: 0,
      description: "Cuscino emergenze (obiettivo €3.000 = 3 mesi spese essenziali) — alimentato dai €250/mese B&B",
    },
  });

  await prisma.setting.upsert({
    where: { key: "monthly_income_estimate" },
    update: { value: "2300" },
    create: { key: "monthly_income_estimate", value: "2300" },
  });

  console.log("✓ Scudo: budget mensile → €0 (alimentato da B&B)");
  console.log("✓ Reddito mensile stimato aggiornato: €2.300");
  console.log("\n✅ Aggiornato!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
