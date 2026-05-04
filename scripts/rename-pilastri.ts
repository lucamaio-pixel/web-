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
    where: { key: "respiro" },
    data: {
      name: "Svago",
      description: "Ristoranti, gite in famiglia, cinema, sfizi — spese piacevoli PIANIFICATE",
    },
  });
  console.log("✓ Respiro → Svago");

  await prisma.pilastro.update({
    where: { key: "margine" },
    data: {
      name: "Spese Varie",
      description: "Vestiti, casa, prelievi contanti, tutto ciò che non rientra negli altri pilastri",
    },
  });
  console.log("✓ Margine → Spese Varie");

  console.log("\n✅ Pilastri aggiornati!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
