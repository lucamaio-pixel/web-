import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const d = await prisma.pilastro.findUnique({
    where: { key: "debiti" },
    include: { subcategories: true },
  });
  if (!d) return;
  console.log(`Debiti pilastro: €${d.monthlyBudget}`);
  let tot = 0;
  for (const s of d.subcategories) {
    console.log(`  ${s.name}: €${s.monthlyBudget}`);
    tot += s.monthlyBudget;
  }
  console.log(`  TOTAL: €${tot}`);
  await prisma.$disconnect();
}

main().catch(console.error);
