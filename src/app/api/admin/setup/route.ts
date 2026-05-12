import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

export async function POST() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    return NextResponse.json({ error: "TURSO_DATABASE_URL non configurato" }, { status: 500 });
  }

  const client = createClient({ url, authToken });

  try {
    // Crea tabella Asset se non esiste
    await client.execute(`
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

    const ASSETS = [
      { name: "B&B", category: "immobile", emoji: "🏠", monthlyIncome: 250, currentValue: 0, notes: "Reddito mensile costante da affitto B&B", order: 1 },
      { name: "Network21", category: "business", emoji: "🚀", monthlyIncome: 0, currentValue: 0, notes: "Business in costruzione — obiettivo: royalties residuali", order: 2 },
      { name: "Interactive Brokers", category: "investimento", emoji: "📈", monthlyIncome: 0, currentValue: 0, notes: "Conto investimento — da popolare progressivamente", order: 3 },
    ];

    const results: string[] = [];
    for (const a of ASSETS) {
      const existing = await client.execute({
        sql: `SELECT id FROM "Asset" WHERE name = ?`,
        args: [a.name],
      });
      if (existing.rows.length === 0) {
        const id = crypto.randomUUID();
        await client.execute({
          sql: `INSERT INTO "Asset" (id, name, category, emoji, monthlyIncome, currentValue, notes, "order", active, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          args: [id, a.name, a.category, a.emoji, a.monthlyIncome, a.currentValue, a.notes ?? null, a.order],
        });
        results.push(`creato: ${a.emoji} ${a.name}`);
      } else {
        results.push(`già presente: ${a.emoji} ${a.name}`);
      }
    }

    await client.close();
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    await client.close();
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
