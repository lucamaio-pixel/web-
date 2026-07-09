import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Piano di spesa mensile concordato (29/06).
// Entrate operative €2.300 (stipendio+assegni+Mileidy); B&B €250 → cuscino (a parte).
const PILASTRI_BUDGETS: Record<string, number> = {
  fondamenta: 355,
  quotidiano: 780,
  figli: 100,
  amway: 200, // €80 business + €120 consumo casa (tetto)
  scudo: 0, // alimentato dal B&B
  imprevisti: 80,
  respiro: 120,
  margine: 55,
  arretrati: 120, // temporaneo, fino ad agosto
  debiti: 460,
};

const SUBCATEGORIES_BUDGETS: Record<string, number> = {
  "fondamenta:luce_gas": 110,
  "fondamenta:internet_telefono": 85,
  "fondamenta:abbonamenti": 12,
  "fondamenta:condominio": 50,
  "fondamenta:scuola_danza": 60,
  "fondamenta:altro_fondamenta": 38,
  "quotidiano:spesa": 550,
  "quotidiano:benzina": 180,
  "quotidiano:salute": 20,
  "quotidiano:parcheggi": 0,
  "quotidiano:bar_colazione": 30,
  "quotidiano:altro_quotidiano": 0,
  "figli:carlo": 60,
  "figli:dalia": 30,
  "figli:altro_figli": 10,
  "amway:prodotti": 120,
  "amway:network21": 80,
  "amway:altro_amway": 0,
  "scudo:risparmio": 0,
  "imprevisti:gite_scolastiche": 20,
  "imprevisti:regali": 20,
  "imprevisti:medico_extra": 20,
  "imprevisti:altro_imprevisti": 20,
  "respiro:ristoranti": 40,
  "respiro:viaggi_gite": 40,
  "respiro:svago": 30,
  "respiro:shopping_permesso": 10,
  "margine:vestiti": 30,
  "margine:casa_piccole": 10,
  "margine:shopping_vario": 15,
  "margine:altro_margine": 0,
};

export async function POST() {
  try {
    const results: string[] = [];

    // Pilastri
    for (const [key, budget] of Object.entries(PILASTRI_BUDGETS)) {
      const updated = await prisma.pilastro.updateMany({
        where: { key },
        data: { monthlyBudget: budget },
      });
      if (updated.count > 0) results.push(`pilastro ${key} → €${budget}`);
    }

    // Sottocategorie
    const pilastri = await prisma.pilastro.findMany({ select: { id: true, key: true } });
    const pilastroIdByKey = new Map(pilastri.map((p) => [p.key, p.id]));
    let subUpdated = 0;
    for (const [composite, budget] of Object.entries(SUBCATEGORIES_BUDGETS)) {
      const [pKey, sKey] = composite.split(":");
      const pilastroId = pilastroIdByKey.get(pKey);
      if (!pilastroId) continue;
      const res = await prisma.subcategory.updateMany({
        where: { pilastroId, key: sKey },
        data: { monthlyBudget: budget },
      });
      subUpdated += res.count;
    }
    results.push(`${subUpdated} sottocategorie aggiornate`);

    const totalUscite = Object.values(PILASTRI_BUDGETS).reduce((s, v) => s + v, 0);
    return NextResponse.json({ ok: true, totalUscite, results });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
