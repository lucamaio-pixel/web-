import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { pilastroId, name, emoji } = await req.json() as {
      pilastroId: string;
      name: string;
      emoji: string;
    };

    if (!pilastroId || !name) {
      return NextResponse.json({ error: "pilastroId e name obbligatori" }, { status: 400 });
    }

    const key = name.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const maxOrder = await prisma.subcategory.count({ where: { pilastroId } });

    const sub = await prisma.subcategory.upsert({
      where: { pilastroId_key: { pilastroId, key } },
      update: { name: name.trim(), emoji: emoji || "📋" },
      create: { pilastroId, key, name: name.trim(), emoji: emoji || "📋", order: maxOrder + 1 },
    });

    return NextResponse.json({ ok: true, subcategory: sub });
  } catch (error) {
    console.error("[api/subcategories]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore" },
      { status: 500 }
    );
  }
}
