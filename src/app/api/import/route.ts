import { NextRequest, NextResponse } from "next/server";
import { parseHypeCsv, statsFromTransactions } from "@/lib/hype-parser";
import { categorize } from "@/lib/categorizer";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

interface ImportPayload {
  csvContent: string;
  accountId: string;
  preview?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ImportPayload;
    const { csvContent, accountId, preview = false } = body;

    if (!csvContent || !accountId) {
      return NextResponse.json(
        { error: "csvContent e accountId obbligatori" },
        { status: 400 }
      );
    }

    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) {
      return NextResponse.json({ error: "Conto non trovato" }, { status: 404 });
    }

    const parsed = parseHypeCsv(csvContent);
    const stats = statsFromTransactions(parsed);

    // Mappa Pilastri per chiave
    const pilastri = await prisma.pilastro.findMany();
    const pilastriByKey = new Map(pilastri.map((p) => [p.key, p]));

    // Categorizza
    const enriched = parsed.map((t) => {
      const cat = categorize(t.merchant, t.description, t.type);
      const pilastro = pilastriByKey.get(cat.pilastro);
      return {
        ...t,
        suggestedPilastro: cat.pilastro,
        pilastroId: pilastro?.id ?? null,
        pilastroName: pilastro?.name ?? "Non assegnato",
        pilastroEmoji: pilastro?.emoji ?? "❓",
        ruleNote: cat.rule?.note,
      };
    });

    if (preview) {
      const previewItems = enriched.slice(0, 50).map((t) => ({
        date: t.date,
        merchant: t.merchant,
        description: t.description,
        amount: t.amount,
        type: t.type,
        suggestedPilastro: t.suggestedPilastro,
        pilastroName: t.pilastroName,
        pilastroEmoji: t.pilastroEmoji,
        isInternalTransfer: t.isInternalTransfer,
        isDebtPayment: t.isDebtPayment,
      }));
      return NextResponse.json({
        ok: true,
        stats,
        previewItems,
        totalCount: enriched.length,
      });
    }

    // Importa per davvero (skip duplicati via hashId)
    let imported = 0;
    let skipped = 0;

    for (const t of enriched) {
      try {
        await prisma.transaction.create({
          data: {
            accountId: account.id,
            pilastroId: t.suggestedPilastro === "ignora" ? null : t.pilastroId,
            date: t.date,
            bookedDate: t.bookedDate,
            type: t.type,
            merchant: t.merchant,
            description: t.description,
            amount: t.amount,
            rawData: t.rawData,
            hashId: t.hashId,
            isInternalTransfer: t.isInternalTransfer,
            isDebtPayment: t.isDebtPayment,
          },
        });
        imported++;
      } catch (e: unknown) {
        // unique constraint = duplicato
        const err = e as { code?: string };
        if (err.code === "P2002") skipped++;
        else throw e;
      }
    }

    return NextResponse.json({
      ok: true,
      imported,
      skipped,
      total: enriched.length,
      stats,
    });
  } catch (error) {
    console.error("[api/import]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore sconosciuto" },
      { status: 500 }
    );
  }
}
