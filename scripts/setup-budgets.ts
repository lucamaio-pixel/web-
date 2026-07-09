import "dotenv/config";
import { createClient } from "@libsql/client";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const url = process.env.TURSO_DATABASE_URL!;
const authToken = process.env.TURSO_AUTH_TOKEN;
const rawClient = createClient({ url, authToken });

const adapter = new PrismaLibSql({ url, authToken });
const prisma = new PrismaClient({ adapter });

// === BUDGET PIANIFICATO ===
// Pilastri (chiave → budget mensile)
const PILASTRI_BUDGETS: Record<string, number> = {
  fondamenta: 355,    // Spese Fisse Casa
  quotidiano: 780,    // Spese Quotidiane
  figli: 100,
  amway: 200,         // Network21 €80 + consumo casa €120 (tetto)
  scudo: 0,           // alimentato dai €250/mese B&B
  imprevisti: 80,
  respiro: 120,       // Svago
  margine: 55,        // Spese Varie (vestiario)
  arretrati: 120,     // temporaneo, fino ad agosto
  debiti: 460,
};

// Sottocategorie (pilastroKey:subKey → budget mensile)
const SUBCATEGORIES_BUDGETS: Record<string, number> = {
  // Spese Fisse Casa (€355)
  "fondamenta:luce_gas": 110,            // bombole 60 + corrente 50
  "fondamenta:internet_telefono": 85,    // TIM 45 + SIM 40
  "fondamenta:abbonamenti": 12,          // Prime + vari
  "fondamenta:condominio": 50,
  "fondamenta:scuola_danza": 60,         // Danza Dalia
  "fondamenta:altro_fondamenta": 38,     // Assicurazione auto rateizzata

  // Spese Quotidiane (€780)
  "quotidiano:spesa": 550,
  "quotidiano:benzina": 180,
  "quotidiano:salute": 20,
  "quotidiano:parcheggi": 0,
  "quotidiano:bar_colazione": 30,
  "quotidiano:altro_quotidiano": 0,

  // Figli (€100)
  "figli:carlo": 60,
  "figli:dalia": 30,
  "figli:altro_figli": 10,

  // Amway/Network21 (€200 — tetto)
  "amway:prodotti": 120,                 // consumo casa/personale
  "amway:network21": 80,                 // strumenti business
  "amway:altro_amway": 0,

  // Scudo (€0 — alimentato dal B&B)
  "scudo:risparmio": 0,

  // Imprevisti (€80)
  "imprevisti:gite_scolastiche": 20,
  "imprevisti:regali": 20,
  "imprevisti:medico_extra": 20,
  "imprevisti:altro_imprevisti": 20,

  // Svago (€120)
  "respiro:ristoranti": 40,
  "respiro:viaggi_gite": 40,
  "respiro:svago": 30,
  "respiro:shopping_permesso": 10,

  // Spese Varie (€55)
  "margine:vestiti": 30,
  "margine:casa_piccole": 10,
  "margine:shopping_vario": 15,
  "margine:altro_margine": 0,

  // Arretrati (€120)
  "arretrati:potatura": 100,
  "arretrati:bombole": 20,
  "arretrati:altro_arretrati": 0,

  // Debiti/Mutuo (€460)
  "debiti:link_finanziaria": 293,
  "debiti:comune_messina": 75,
  "debiti:agenzia_entrate": 17,
  "debiti:banca_ifis": 13,
};

async function main() {
  console.log("🔧 1. Aggiungo colonna monthlyBudget a Subcategory...");
  try {
    await rawClient.execute(`ALTER TABLE "Subcategory" ADD COLUMN "monthlyBudget" REAL NOT NULL DEFAULT 0`);
    console.log("   ✓ Colonna aggiunta");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("duplicate column")) console.log("   ⚠️  Colonna già esistente");
    else throw e;
  }

  console.log("\n💰 2. Aggiorno budget Pilastri...");
  for (const [key, budget] of Object.entries(PILASTRI_BUDGETS)) {
    await prisma.pilastro.update({
      where: { key },
      data: { monthlyBudget: budget },
    });
    console.log(`   ✓ ${key.padEnd(15)} → €${budget}/m`);
  }

  console.log("\n📊 3. Aggiorno budget Sottocategorie...");
  const pilastri = await prisma.pilastro.findMany({ include: { subcategories: true } });
  let updated = 0;
  for (const p of pilastri) {
    for (const s of p.subcategories) {
      const compositeKey = `${p.key}:${s.key}`;
      const budget = SUBCATEGORIES_BUDGETS[compositeKey];
      if (budget !== undefined) {
        await prisma.subcategory.update({
          where: { id: s.id },
          data: { monthlyBudget: budget },
        });
        updated++;
      }
    }
  }
  console.log(`   ✓ ${updated} sottocategorie aggiornate`);

  // Verifica somme
  console.log("\n✅ Verifica coerenza:");
  for (const p of await prisma.pilastro.findMany({ include: { subcategories: true }, orderBy: { order: "asc" } })) {
    const subTotal = p.subcategories.reduce((s, sub) => s + sub.monthlyBudget, 0);
    const match = Math.abs(subTotal - p.monthlyBudget) < 1 ? "✓" : "⚠️";
    console.log(`   ${match} ${p.emoji} ${p.name.padEnd(20)} pilastro: €${p.monthlyBudget}, sottocat: €${subTotal.toFixed(0)}`);
  }

  await prisma.$disconnect();
  await rawClient.close();
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
