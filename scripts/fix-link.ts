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
  const link = d.subcategories.find((s) => s.key === "link_finanziaria");
  if (link) {
    await prisma.subcategory.update({
      where: { id: link.id },
      data: { monthlyBudget: 355 },
    });
    console.log("✓ Link Finanziaria → €355 (293+39+22+2 = tutte le quote)");
  }
  await prisma.$disconnect();
}

main().catch(console.error);
