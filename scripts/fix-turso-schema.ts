import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function exec(sql: string, label: string) {
  try {
    await client.execute(sql);
    console.log(`  ✓ ${label}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("already exists") || msg.includes("duplicate column") || msg.includes("no such table")) {
      console.log(`  ⚠️  Skip (${msg.slice(0, 60)}): ${label}`);
    } else {
      throw new Error(`${label}:\n${msg}`);
    }
  }
}

async function main() {
  console.log("🔧 Fix schema Turso...\n");

  // 1. Rimuovi new_Transaction se rimasta da migrazione fallita
  await exec(`DROP TABLE IF EXISTS "new_Transaction"`, "Drop new_Transaction residuo");

  // 2. Aggiungi subcategoryId a CategoryRule se manca
  await exec(
    `ALTER TABLE "CategoryRule" ADD COLUMN "subcategoryId" TEXT`,
    "CategoryRule.subcategoryId"
  );

  // 3. Assicura che Subcategory esista
  await exec(
    `CREATE TABLE IF NOT EXISTS "Subcategory" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "pilastroId" TEXT NOT NULL,
      "key" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "emoji" TEXT NOT NULL DEFAULT '',
      "order" INTEGER NOT NULL DEFAULT 0,
      "active" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Subcategory_pilastroId_fkey" FOREIGN KEY ("pilastroId") REFERENCES "Pilastro" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )`,
    "CREATE TABLE Subcategory"
  );

  // 4. Crea unique index su Subcategory
  await exec(
    `CREATE UNIQUE INDEX IF NOT EXISTS "Subcategory_pilastroId_key_key" ON "Subcategory"("pilastroId", "key")`,
    "UNIQUE INDEX Subcategory(pilastroId, key)"
  );

  // 5. Aggiungi subcategoryId a Transaction se manca
  await exec(
    `ALTER TABLE "Transaction" ADD COLUMN "subcategoryId" TEXT REFERENCES "Subcategory"("id")`,
    "Transaction.subcategoryId"
  );

  console.log("\n✅ Schema corretto!");
  await client.close();
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
