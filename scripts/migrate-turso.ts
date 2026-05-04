import "dotenv/config";
import { createClient } from "@libsql/client";
import fs from "fs";
import path from "path";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("❌ TURSO_DATABASE_URL non impostato");
  process.exit(1);
}

const client = createClient({ url, authToken });

// Legge e divide il file SQL in singoli statement
function splitSql(sql: string): string[] {
  return sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));
}

async function applyMigration(filePath: string, name: string) {
  console.log(`\n📦 Applico migrazione: ${name}`);
  const sql = fs.readFileSync(filePath, "utf-8");
  try {
    await client.executeMultiple(sql);
    console.log(`  ✓ ${name} applicata`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // Ignora errori "già esiste" — idempotente
    if (
      msg.includes("already exists") ||
      msg.includes("duplicate column")
    ) {
      console.log(`  ⚠️  Skip (già esiste): ${name}`);
    } else {
      throw new Error(`Errore in ${name}:\n${msg}`);
    }
  }
}

async function main() {
  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  const dirs = fs
    .readdirSync(migrationsDir)
    .filter((d) => fs.statSync(path.join(migrationsDir, d)).isDirectory())
    .sort(); // ordine cronologico per nome cartella

  console.log(`🚀 Migrazione Turso: ${url}`);
  console.log(`   ${dirs.length} migrazioni trovate`);

  for (const dir of dirs) {
    const sqlFile = path.join(migrationsDir, dir, "migration.sql");
    if (fs.existsSync(sqlFile)) {
      await applyMigration(sqlFile, dir);
    }
  }

  console.log("\n✅ Tutte le migrazioni applicate!");
  await client.close();
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
