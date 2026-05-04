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
    where: { key: "quotidiano" },
    data: { name: "Spese Quotidiane" },
  });
  console.log("✓ Quotidiano → Spese Quotidiane");
  console.log("\n✅ Aggiornato!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
