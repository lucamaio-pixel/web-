import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

// Pilastri definitivi (basati sull'analisi dei CSV reali)
const PILASTRI = [
  {
    key: "fondamenta",
    name: "Fondamenta",
    emoji: "🏠",
    color: "#1E293B",
    description: "Mutuo, bollette, abbonamenti, condominio, telefonia, danza Dalia",
    monthlyBudget: 836,
    order: 1,
  },
  {
    key: "quotidiano",
    name: "Quotidiano",
    emoji: "🍎",
    color: "#10B981",
    description: "Cibo, benzina, salute, parcheggi",
    monthlyBudget: 730,
    order: 2,
  },
  {
    key: "figli",
    name: "Figli",
    emoji: "👨‍👩‍👧‍👦",
    color: "#8B5CF6",
    description: "Carlo, Dalia (extra danza), spese non strutturali",
    monthlyBudget: 100,
    order: 3,
  },
  {
    key: "amway",
    name: "Amway",
    emoji: "🚀",
    color: "#F59E0B",
    description: "Investimento business: Amway Italia + Network21",
    monthlyBudget: 250,
    order: 4,
  },
  {
    key: "scudo",
    name: "Scudo",
    emoji: "🛡️",
    color: "#059669",
    description: "Cuscino emergenze (obiettivo €3.000 = 3 mesi spese essenziali)",
    monthlyBudget: 150,
    goalAmount: 3000,
    order: 5,
  },
  {
    key: "imprevisti",
    name: "Imprevisti",
    emoji: "⚡",
    color: "#EAB308",
    description: "Gite scolastiche, regali, eventi non programmati",
    monthlyBudget: 100,
    order: 6,
  },
  {
    key: "respiro",
    name: "Respiro",
    emoji: "🌿",
    color: "#84CC16",
    description: "Gite famiglia, ristoranti, sfizi - PERMESSI E PIANIFICATI",
    monthlyBudget: 150,
    order: 7,
  },
  {
    key: "margine",
    name: "Margine",
    emoji: "➕",
    color: "#64748B",
    description: "Vestiti, casa piccole cose, buffer per non previsto",
    monthlyBudget: 114,
    order: 8,
  },
  {
    key: "arretrati",
    name: "Arretrati",
    emoji: "⏳",
    color: "#DC2626",
    description: "Potatura €300 + Bombole €50 - liquidare in 3 mesi",
    monthlyBudget: 120,
    order: 9,
  },
  {
    key: "debiti",
    name: "Debiti/Mutuo",
    emoji: "🏛️",
    color: "#7C3AED",
    description: "Sentenza 21/2023 + Link Finanziaria (vedi modulo Piano Debiti)",
    monthlyBudget: 460,
    order: 10,
  },
];

// Conti
const ACCOUNTS = [
  {
    name: "Hype Luca",
    type: "hype",
    iban: "IT20W03268223000EMH00239448",
    ownerName: "Luca",
    color: "#059669",
  },
  {
    name: "Hype Mileidy",
    type: "hype",
    iban: "IT74O03268223000EMH01608878",
    ownerName: "Mileidy",
    color: "#10B981",
  },
  {
    name: "PostePay",
    type: "postepay",
    ownerName: "Luca",
    color: "#FBBF24",
  },
  {
    name: "Contanti",
    type: "cash",
    ownerName: "Luca",
    color: "#94A3B8",
  },
];

// Piano debiti — generato dal foglio Google
function buildDebtPlan() {
  const installments: { month: string; creditor: string; amount: number }[] = [];
  const startYear = 2024;
  const startMonth = 7; // Luglio 2024

  // Componenti del piano
  // Tutte queste partono da 07/2024
  // Componenti che finiscono a giugno 2029 (fase 1: 60 rate)
  const phase1End = { year: 2029, month: 6 };
  // Componente che finisce a giugno 2034 (fase 2: 120 rate totali)
  const phase2End = { year: 2034, month: 6 };
  // Componente principale (Link Finanziaria base) finisce ~2046 (fase 3: 264 rate)
  const phase3End = { year: 2046, month: 3 };

  function addBetween(from: { year: number; month: number }, to: { year: number; month: number }, creditor: string, amount: number) {
    let y = from.year, m = from.month;
    while (y < to.year || (y === to.year && m <= to.month)) {
      const month = `${y}-${String(m).padStart(2, "0")}`;
      installments.push({ month, creditor, amount });
      m++;
      if (m > 12) { m = 1; y++; }
    }
  }

  // Componente principale Link Finanziaria (€293.21) - lunga durata
  addBetween({ year: startYear, month: startMonth }, phase3End, "Link Finanziaria (mutuo)", 293.21);

  // Componente Link Finanziaria quota intermedia (€21.62) - fino 06/2034
  addBetween({ year: startYear, month: startMonth }, phase2End, "Link Finanziaria (quota 3)", 21.62);

  // Componenti che finiscono 06/2029
  addBetween({ year: startYear, month: startMonth }, phase1End, "Link Finanziaria (quota 2)", 38.59);
  addBetween({ year: startYear, month: startMonth }, phase1End, "Link Finanziaria (quota 4)", 2.13);
  addBetween({ year: startYear, month: startMonth }, phase1End, "Comune di Messina", 75.34);
  addBetween({ year: startYear, month: startMonth }, phase1End, "Agenzia Entrate", 16.56);
  addBetween({ year: startYear, month: startMonth }, phase1End, "Banca Ifis", 12.96);

  return installments;
}

async function main() {
  console.log("🏛️  Seeding Pilastri database...");

  // Pulisci esistenti
  await prisma.installment.deleteMany();
  await prisma.debtPlan.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.pilastro.deleteMany();
  await prisma.account.deleteMany();
  await prisma.categoryRule.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.setting.deleteMany();

  // Pilastri
  for (const p of PILASTRI) {
    await prisma.pilastro.create({ data: p });
  }
  console.log(`  ✓ ${PILASTRI.length} Pilastri creati`);

  // Conti
  for (const a of ACCOUNTS) {
    await prisma.account.create({ data: a });
  }
  console.log(`  ✓ ${ACCOUNTS.length} Conti creati`);

  // Piano debiti
  const debtPlan = await prisma.debtPlan.create({
    data: {
      name: "Sentenza 21/2023 - Tribunale Messina",
      description: "Piano del consumatore: Link Finanziaria + creditori vari. Liberazione fase 1: luglio 2029.",
      startDate: new Date(2024, 6, 1),
    },
  });

  const installments = buildDebtPlan();
  // Crea in chunk per evitare lentezza
  const chunkSize = 100;
  for (let i = 0; i < installments.length; i += chunkSize) {
    const chunk = installments.slice(i, i + chunkSize);
    await prisma.installment.createMany({
      data: chunk.map((inst) => ({
        debtPlanId: debtPlan.id,
        ...inst,
      })),
    });
  }
  console.log(`  ✓ ${installments.length} rate del piano debiti generate`);

  // Obiettivi iniziali
  await prisma.goal.create({
    data: {
      name: "Interventi casa",
      emoji: "🔨",
      targetAmount: 1500,
      monthlyContribution: 0,
      notes: "Da attivare quando lo Scudo sarà al 50%",
    },
  });
  await prisma.goal.create({
    data: {
      name: "Vacanza famiglia",
      emoji: "✈️",
      targetAmount: 1200,
      monthlyContribution: 0,
      notes: "Pianificare per estate 2027",
    },
  });
  console.log(`  ✓ 2 Obiettivi creati`);

  // Settings iniziali
  await prisma.setting.create({ data: { key: "monthly_income_estimate", value: "2647" } });
  await prisma.setting.create({ data: { key: "scudo_target", value: "3000" } });
  await prisma.setting.create({ data: { key: "debt_plan_phase1_end", value: "2029-06" } });
  await prisma.setting.create({ data: { key: "currency", value: "EUR" } });
  await prisma.setting.create({ data: { key: "locale", value: "it-IT" } });

  console.log("\n✨ Seed completato!");
  console.log(`\n📊 Riepilogo:`);
  console.log(`   - Pilastri: ${PILASTRI.length}`);
  console.log(`   - Conti: ${ACCOUNTS.length}`);
  console.log(`   - Rate piano debiti: ${installments.length}`);
  console.log(`   - Liberazione fase 1: luglio 2029 (-€145.58/mese)`);
  console.log(`   - Liberazione fase 2: luglio 2034 (-€21.62/mese)`);
  console.log(`   - Liberazione finale: ~2046 (-€293.21/mese)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
