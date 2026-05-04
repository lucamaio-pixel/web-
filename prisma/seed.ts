import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL ?? "file:./dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
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
    name: "Svago",
    emoji: "🌿",
    color: "#84CC16",
    description: "Ristoranti, gite in famiglia, cinema, sfizi — spese piacevoli PIANIFICATE",
    monthlyBudget: 150,
    order: 7,
  },
  {
    key: "margine",
    name: "Spese Varie",
    emoji: "➕",
    color: "#64748B",
    description: "Vestiti, casa, prelievi contanti, tutto ciò che non rientra negli altri pilastri",
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

// Sottocategorie per pilastro
const SUBCATEGORIES: { pilastroKey: string; key: string; name: string; emoji: string; order: number }[] = [
  // Fondamenta
  { pilastroKey: "fondamenta", key: "rate_debito", name: "Rate debito", emoji: "🏛️", order: 1 },
  { pilastroKey: "fondamenta", key: "luce_gas", name: "Luce/Gas", emoji: "💡", order: 2 },
  { pilastroKey: "fondamenta", key: "internet_telefono", name: "Internet/Telefono", emoji: "📱", order: 3 },
  { pilastroKey: "fondamenta", key: "abbonamenti", name: "Abbonamenti", emoji: "📺", order: 4 },
  { pilastroKey: "fondamenta", key: "condominio", name: "Condominio", emoji: "🏢", order: 5 },
  { pilastroKey: "fondamenta", key: "scuola_danza", name: "Scuola/Danza", emoji: "🎓", order: 6 },
  { pilastroKey: "fondamenta", key: "altro_fondamenta", name: "Altro", emoji: "📋", order: 7 },
  // Quotidiano
  { pilastroKey: "quotidiano", key: "spesa", name: "Spesa", emoji: "🛒", order: 1 },
  { pilastroKey: "quotidiano", key: "benzina", name: "Benzina", emoji: "⛽", order: 2 },
  { pilastroKey: "quotidiano", key: "salute", name: "Salute/Farmacia", emoji: "💊", order: 3 },
  { pilastroKey: "quotidiano", key: "parcheggi", name: "Parcheggi/Trasporti", emoji: "🚗", order: 4 },
  { pilastroKey: "quotidiano", key: "bar_colazione", name: "Bar/Colazione", emoji: "☕", order: 5 },
  { pilastroKey: "quotidiano", key: "altro_quotidiano", name: "Altro", emoji: "📋", order: 6 },
  // Figli
  { pilastroKey: "figli", key: "carlo", name: "Carlo", emoji: "👦", order: 1 },
  { pilastroKey: "figli", key: "dalia", name: "Dalia", emoji: "👧", order: 2 },
  { pilastroKey: "figli", key: "altro_figli", name: "Altro", emoji: "📋", order: 3 },
  // Amway
  { pilastroKey: "amway", key: "prodotti", name: "Prodotti Amway", emoji: "📦", order: 1 },
  { pilastroKey: "amway", key: "network21", name: "Network21", emoji: "🌐", order: 2 },
  { pilastroKey: "amway", key: "altro_amway", name: "Altro business", emoji: "📋", order: 3 },
  // Debiti
  { pilastroKey: "debiti", key: "link_finanziaria", name: "Link Finanziaria", emoji: "🏦", order: 1 },
  { pilastroKey: "debiti", key: "comune_messina", name: "Comune Messina", emoji: "🏛️", order: 2 },
  { pilastroKey: "debiti", key: "agenzia_entrate", name: "Agenzia Entrate", emoji: "📜", order: 3 },
  { pilastroKey: "debiti", key: "banca_ifis", name: "Banca Ifis", emoji: "🏦", order: 4 },
  // Imprevisti
  { pilastroKey: "imprevisti", key: "gite_scolastiche", name: "Gite scolastiche", emoji: "🎒", order: 1 },
  { pilastroKey: "imprevisti", key: "regali", name: "Regali", emoji: "🎁", order: 2 },
  { pilastroKey: "imprevisti", key: "medico_extra", name: "Medico extra", emoji: "🏥", order: 3 },
  { pilastroKey: "imprevisti", key: "altro_imprevisti", name: "Altro imprevisto", emoji: "⚡", order: 4 },
  // Scudo
  { pilastroKey: "scudo", key: "risparmio", name: "Risparmio emergenza", emoji: "🛡️", order: 1 },
  // Respiro
  { pilastroKey: "respiro", key: "ristoranti", name: "Ristoranti/Bar", emoji: "🍽️", order: 1 },
  { pilastroKey: "respiro", key: "viaggi_gite", name: "Viaggi/Gite", emoji: "✈️", order: 2 },
  { pilastroKey: "respiro", key: "svago", name: "Svago/Hobby", emoji: "🎭", order: 3 },
  { pilastroKey: "respiro", key: "shopping_permesso", name: "Shopping permesso", emoji: "🛍️", order: 4 },
  // Margine
  { pilastroKey: "margine", key: "vestiti", name: "Vestiti", emoji: "👗", order: 1 },
  { pilastroKey: "margine", key: "casa_piccole", name: "Casa piccole cose", emoji: "🔧", order: 2 },
  { pilastroKey: "margine", key: "shopping_vario", name: "Shopping vario", emoji: "🛒", order: 3 },
  { pilastroKey: "margine", key: "altro_margine", name: "Altro", emoji: "📋", order: 4 },
  // Arretrati
  { pilastroKey: "arretrati", key: "potatura", name: "Potatura", emoji: "🌳", order: 1 },
  { pilastroKey: "arretrati", key: "bombole", name: "Bombole gas", emoji: "🫙", order: 2 },
  { pilastroKey: "arretrati", key: "altro_arretrati", name: "Altro arretrato", emoji: "⏳", order: 3 },
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

  // Pilastri — upsert per non cancellare le transazioni
  for (const p of PILASTRI) {
    await prisma.pilastro.upsert({
      where: { key: p.key },
      update: {
        name: p.name,
        emoji: p.emoji,
        color: p.color,
        description: p.description,
        monthlyBudget: p.monthlyBudget,
        order: p.order,
        ...(p.goalAmount ? { goalAmount: p.goalAmount } : {}),
      },
      create: p,
    });
  }
  console.log(`  ✓ ${PILASTRI.length} Pilastri aggiornati`);

  // Sottocategorie — upsert per non cancellare le transazioni
  for (const s of SUBCATEGORIES) {
    const pilastro = await prisma.pilastro.findUnique({ where: { key: s.pilastroKey } });
    if (!pilastro) continue;
    await prisma.subcategory.upsert({
      where: { pilastroId_key: { pilastroId: pilastro.id, key: s.key } },
      update: { name: s.name, emoji: s.emoji, order: s.order },
      create: { pilastroId: pilastro.id, key: s.key, name: s.name, emoji: s.emoji, order: s.order },
    });
  }
  console.log(`  ✓ ${SUBCATEGORIES.length} Sottocategorie aggiornate`);

  // Conti — upsert per non cancellare le transazioni
  for (const a of ACCOUNTS) {
    const existing = await prisma.account.findFirst({ where: { name: a.name } });
    if (!existing) {
      await prisma.account.create({ data: a });
    }
  }
  console.log(`  ✓ Conti verificati`);

  // Piano debiti — ricrea solo se non esiste già
  const existingPlan = await prisma.debtPlan.findFirst();
  if (existingPlan) {
    console.log(`  ✓ Piano debiti già presente, skip`);
  } else {
    const debtPlan = await prisma.debtPlan.create({
      data: {
        name: "Sentenza 21/2023 - Tribunale Messina",
        description: "Piano del consumatore: Link Finanziaria + creditori vari. Liberazione fase 1: luglio 2029.",
        startDate: new Date(2024, 6, 1),
      },
    });

    const installments = buildDebtPlan();
    const chunkSize = 100;
    for (let i = 0; i < installments.length; i += chunkSize) {
      const chunk = installments.slice(i, i + chunkSize);
      await prisma.installment.createMany({
        data: chunk.map((inst) => ({ debtPlanId: debtPlan.id, ...inst })),
      });
    }
    console.log(`  ✓ ${installments.length} rate del piano debiti generate`);

    await prisma.goal.createMany({
      data: [
        { name: "Interventi casa", emoji: "🔨", targetAmount: 1500, monthlyContribution: 0, notes: "Da attivare quando lo Scudo sarà al 50%" },
        { name: "Vacanza famiglia", emoji: "✈️", targetAmount: 1200, monthlyContribution: 0, notes: "Pianificare per estate 2027" },
      ],
    });
    console.log(`  ✓ 2 Obiettivi creati`);
  }

  // Settings — upsert
  const settings = [
    { key: "monthly_income_estimate", value: "2647" },
    { key: "scudo_target", value: "3000" },
    { key: "debt_plan_phase1_end", value: "2029-06" },
    { key: "currency", value: "EUR" },
    { key: "locale", value: "it-IT" },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s });
  }

  // Backfill sottocategorie sulle transazioni esistenti senza subcategoryId
  const subcats = await prisma.subcategory.findMany({ include: { pilastro: true } });
  // mappa: pilastroId:subcatKey → subcatId
  const subcatMap = new Map(subcats.map((s) => [`${s.pilastroId}:${s.key}`, s.id]));

  const txsWithoutSubcat = await prisma.transaction.findMany({
    where: { subcategoryId: null, pilastroId: { not: null }, deleted: false },
    select: { id: true, merchant: true, description: true, type: true, pilastroId: true },
  });

  let backfilled = 0;
  for (const tx of txsWithoutSubcat) {
    const { categorize } = await import("../src/lib/categorizer.js");
    const result = categorize(tx.merchant ?? "", tx.description, tx.type);
    if (result.subcategory && tx.pilastroId) {
      const subcatId = subcatMap.get(`${tx.pilastroId}:${result.subcategory}`);
      if (subcatId) {
        await prisma.transaction.update({ where: { id: tx.id }, data: { subcategoryId: subcatId } });
        backfilled++;
      }
    }
  }
  if (backfilled > 0) console.log(`  ✓ ${backfilled} transazioni con sottocategoria assegnata`);

  console.log("\n✨ Seed completato!");
  console.log(`\n📊 Riepilogo:`);
  console.log(`   - Pilastri: ${PILASTRI.length}`);
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
