import { NextRequest, NextResponse } from "next/server";
import { parseHypeCsv, statsFromTransactions } from "@/lib/hype-parser";
import { parsePostePayCsv } from "@/lib/postepay-parser";
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
      return NextResponse.json({ error: "csvContent e accountId obbligatori" }, { status: 400 });
    }

    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) return NextResponse.json({ error: "Conto non trovato" }, { status: 404 });

    // PostePay/BancoPosta usano un formato diverso da Hype
    const parsed =
      account.type === "postepay"
        ? parsePostePayCsv(csvContent)
        : parseHypeCsv(csvContent);
    const stats = statsFromTransactions(parsed);

    // Mappa pilastri e sottocategorie
    const pilastri = await prisma.pilastro.findMany({ include: { subcategories: true } });
    const pilastriByKey = new Map(pilastri.map((p) => [p.key, p]));
    const pilastriById = new Map(pilastri.map((p) => [p.id, p]));

    // Mappa sottocategorie: pilastroId+key → id
    const subcatMap = new Map<string, string>();
    for (const p of pilastri) {
      for (const s of p.subcategories) {
        subcatMap.set(`${p.id}:${s.key}`, s.id);
      }
    }

    // Regole apprese dal DB
    const dbRules = await prisma.categoryRule.findMany({ where: { active: true } });

    function applyDbRules(merchant: string, description: string): { pilastroId: string; subcategoryId?: string } | null {
      const m = merchant.toLowerCase();
      const d = description.toLowerCase();
      let best: { pilastroId: string; subcategoryId?: string; priority: number } | null = null;
      for (const rule of dbRules) {
        const pat = rule.pattern.toLowerCase();
        const hit =
          rule.matchField === "merchant" ? m.includes(pat) :
          rule.matchField === "description" ? d.includes(pat) :
          m.includes(pat) || d.includes(pat);
        if (hit && (!best || rule.priority > best.priority)) {
          best = {
            pilastroId: rule.pilastroId,
            subcategoryId: rule.subcategoryId ?? undefined,
            priority: rule.priority,
          };
        }
      }
      return best ? { pilastroId: best.pilastroId, subcategoryId: best.subcategoryId } : null;
    }

    // Categorizza
    const enriched = parsed.map((t) => {
      const dbMatch = applyDbRules(t.merchant, t.description);
      const dbPilastro = dbMatch ? pilastriById.get(dbMatch.pilastroId) : null;
      const cat = dbPilastro ? null : categorize(t.merchant, t.description, t.type);
      const pilastro = dbPilastro ?? pilastriByKey.get(cat!.pilastro);

      const subcategoryKey = dbMatch?.subcategoryId
        ? undefined // già un ID diretto
        : cat?.subcategory;
      const subcategoryId = dbMatch?.subcategoryId
        ?? (pilastro && subcategoryKey ? subcatMap.get(`${pilastro.id}:${subcategoryKey}`) : undefined);

      return {
        ...t,
        suggestedPilastro: dbPilastro ? dbPilastro.key : (cat?.pilastro ?? "margine"),
        pilastroId: pilastro?.id ?? null,
        subcategoryId: subcategoryId ?? null,
        pilastroName: pilastro?.name ?? "Non assegnato",
        pilastroEmoji: pilastro?.emoji ?? "❓",
        subcategoryName: subcategoryKey ?? null,
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
        subcategoryName: t.subcategoryName,
        isInternalTransfer: t.isInternalTransfer,
        isDebtPayment: t.isDebtPayment,
      }));
      return NextResponse.json({ ok: true, stats, previewItems, totalCount: enriched.length });
    }

    let imported = 0;
    let skipped = 0;

    for (const t of enriched) {
      try {
        await prisma.transaction.create({
          data: {
            accountId: account.id,
            pilastroId: t.suggestedPilastro === "ignora" ? null : t.pilastroId,
            subcategoryId: t.suggestedPilastro === "ignora" ? null : t.subcategoryId,
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
        const err = e as { code?: string; message?: string };
        const isDuplicate =
          err.code === "P2002" ||
          (typeof err.message === "string" && err.message.includes("UNIQUE constraint failed"));
        if (isDuplicate) skipped++;
        else throw e;
      }
    }

    return NextResponse.json({ ok: true, imported, skipped, total: enriched.length, stats });
  } catch (error) {
    console.error("[api/import]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore sconosciuto" },
      { status: 500 }
    );
  }
}
