import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Buste = accantonamenti mensili per spese periodiche (annuali/semestrali).
// Modellate come pilastri: monthlyBudget = accantonamento/mese, goalAmount = spesa annuale attesa,
// currentBalance = saldo accumulato nella busta.
const BUSTE = [
  { key: "assicurazione", name: "Assicurazione auto", emoji: "🚗", color: "#0EA5E9", monthlyBudget: 35, goalAmount: 400, order: 101 },
  { key: "bollo", name: "Bollo auto + moto", emoji: "🧾", color: "#6366F1", monthlyBudget: 17, goalAmount: 200, order: 102 },
  { key: "dentista", name: "Salute / Dentista", emoji: "🦷", color: "#14B8A6", monthlyBudget: 40, goalAmount: 480, order: 103 },
  { key: "viaggi", name: "Viaggi / Vacanze", emoji: "✈️", color: "#F97316", monthlyBudget: 50, goalAmount: 600, order: 104 },
  { key: "potatura", name: "Potatura", emoji: "🌳", color: "#84CC16", monthlyBudget: 50, goalAmount: 300, order: 105 },
];

export async function POST() {
  try {
    const results: string[] = [];

    for (const b of BUSTE) {
      const existing = await prisma.pilastro.findUnique({ where: { key: b.key } });
      if (existing) {
        await prisma.pilastro.update({
          where: { key: b.key },
          data: { name: b.name, emoji: b.emoji, color: b.color, monthlyBudget: b.monthlyBudget, goalAmount: b.goalAmount, order: b.order, active: true },
        });
        results.push(`busta aggiornata: ${b.emoji} ${b.name}`);
      } else {
        await prisma.pilastro.create({
          data: { key: b.key, name: b.name, emoji: b.emoji, color: b.color, description: "Accantonamento mensile", monthlyBudget: b.monthlyBudget, goalAmount: b.goalAmount, order: b.order },
        });
        results.push(`busta creata: ${b.emoji} ${b.name}`);
      }
    }

    // Arretrati: bombole pagate, potatura ora è una busta → disattiva il pilastro arretrati
    const arretrati = await prisma.pilastro.updateMany({ where: { key: "arretrati" }, data: { active: false } });
    if (arretrati.count > 0) results.push("pilastro arretrati disattivato");

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
