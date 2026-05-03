import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { transactionId, pilastroId, subcategoryId, saveRule } = await req.json() as {
      transactionId: string;
      pilastroId: string | null;
      subcategoryId: string | null;
      saveRule: boolean;
    };

    if (!transactionId) {
      return NextResponse.json({ error: "transactionId obbligatorio" }, { status: 400 });
    }

    const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!tx) return NextResponse.json({ error: "Transazione non trovata" }, { status: 404 });

    await prisma.transaction.update({
      where: { id: transactionId },
      data: { pilastroId, subcategoryId },
    });

    if (saveRule && pilastroId && tx.merchant) {
      const pattern = tx.merchant.toLowerCase().trim();
      const existing = await prisma.categoryRule.findFirst({ where: { pattern, active: true } });
      if (existing) {
        await prisma.categoryRule.update({
          where: { id: existing.id },
          data: { pilastroId, subcategoryId, priority: 200 },
        });
      } else {
        await prisma.categoryRule.create({
          data: { pattern, matchField: "merchant", pilastroId, subcategoryId, priority: 200 },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/transactions/recategorize]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore" },
      { status: 500 }
    );
  }
}
