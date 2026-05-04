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
    where: { key: "amway" },
    data: {
      name: "Network21",
      description: "Investimento business: Network21 e Amway Italia",
    },
  });
  console.log("✓ Amway → Network21");
  console.log("\n✅ Aggiornato!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
