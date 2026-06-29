import Papa from "papaparse";
import crypto from "crypto";

export interface HypeCsvRow {
  "Data operazione": string;
  "Data contabile": string;
  Iban: string;
  Tipologia: string;
  Nome: string;
  Descrizione: string;
  "Importo ( € )": string;
}

export interface ParsedTransaction {
  date: Date;
  bookedDate: Date | null;
  iban: string;
  type: string;
  merchant: string;
  description: string;
  amount: number;
  rawData: string;
  hashId: string;
  isInternalTransfer: boolean;
  isDebtPayment: boolean;
}

const KNOWN_INTERNAL_PEERS = [
  "luca maio",
  "maio luca",
  "mileidy pineda castillo",
  "mileidy pineda",
];

const DEBT_KEYWORDS = [
  "link finanziaria",
  "ndg 305089856",
  "sentenza 212023",
  "sentenza 21/2023",
  "comune di messina",
  "banca ifis",
  "agenzia delle entrate",
];

export function parseDateIt(s: string): Date | null {
  if (!s || !s.trim()) return null;
  const m = s.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
}

export function parseAmount(s: string): number {
  if (!s) return 0;
  const trimmed = s.trim();
  const hasComma = trimmed.includes(",");
  const hasDot = trimmed.includes(".");
  let cleaned: string;
  if (hasComma && hasDot) {
    // Formato 1.234,56 — l'ultimo separatore è il decimale
    const lastComma = trimmed.lastIndexOf(",");
    const lastDot = trimmed.lastIndexOf(".");
    if (lastComma > lastDot) {
      cleaned = trimmed.replace(/\./g, "").replace(",", ".");
    } else {
      cleaned = trimmed.replace(/,/g, "");
    }
  } else if (hasComma) {
    cleaned = trimmed.replace(",", ".");
  } else {
    cleaned = trimmed;
  }
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function normalizeType(tipologia: string): string {
  const t = tipologia.toLowerCase().trim();
  if (t.includes("denaro inviato")) return "denaro_inviato";
  if (t.includes("denaro ricevuto")) return "denaro_ricevuto";
  if (t.includes("bonifico istantaneo")) return "bonifico_istantaneo";
  if (t.includes("bonifico")) return "bonifico_ordinario";
  if (t.includes("prelievo")) return "prelievo";
  if (t.includes("risparmi")) return "risparmi";
  if (t.includes("bollo")) return "bollo";
  if (t.includes("rimborso")) return "rimborso";
  if (t.includes("pagamento")) return "pagamento";
  return t.replace(/\s+/g, "_");
}

export function isInternal(nome: string, descrizione: string): boolean {
  const txt = `${nome} ${descrizione}`.toLowerCase();
  return KNOWN_INTERNAL_PEERS.some((p) => txt.includes(p));
}

export function isDebt(nome: string, descrizione: string): boolean {
  const txt = `${nome} ${descrizione}`.toLowerCase();
  return DEBT_KEYWORDS.some((k) => txt.includes(k));
}

export function makeHash(date: string, amount: string, merchant: string, description: string): string {
  const key = `${date}|${amount}|${merchant.toLowerCase()}|${description.toLowerCase().slice(0, 40)}`;
  return crypto.createHash("sha1").update(key).digest("hex").slice(0, 16);
}

export function parseHypeCsv(content: string): ParsedTransaction[] {
  const result = Papa.parse<HypeCsvRow>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (result.errors.length > 0) {
    console.warn("[hype-parser] CSV parse errors:", result.errors.slice(0, 3));
  }

  const transactions: ParsedTransaction[] = [];

  for (const row of result.data) {
    const dataOp = row["Data operazione"];
    if (!dataOp) continue;

    const date = parseDateIt(dataOp);
    if (!date) continue;

    const bookedDate = parseDateIt(row["Data contabile"]);
    const amount = parseAmount(row["Importo ( € )"]);
    const merchant = (row.Nome || "").trim();
    const description = (row.Descrizione || "").trim();
    const type = normalizeType(row.Tipologia || "");

    const hashId = makeHash(dataOp, row["Importo ( € )"] || "", merchant, description);

    transactions.push({
      date,
      bookedDate,
      iban: (row.Iban || "").trim(),
      type,
      merchant,
      description,
      amount,
      rawData: JSON.stringify(row),
      hashId,
      isInternalTransfer: isInternal(merchant, description),
      isDebtPayment: isDebt(merchant, description),
    });
  }

  return transactions;
}

export interface ParseStats {
  total: number;
  income: number;
  expenses: number;
  internal: number;
  debt: number;
  netFlow: number;
  byMonth: Record<string, { income: number; expenses: number; count: number }>;
}

export function statsFromTransactions(txs: ParsedTransaction[]): ParseStats {
  const stats: ParseStats = {
    total: txs.length,
    income: 0,
    expenses: 0,
    internal: 0,
    debt: 0,
    netFlow: 0,
    byMonth: {},
  };

  for (const t of txs) {
    if (t.isInternalTransfer) stats.internal++;
    if (t.isDebtPayment) stats.debt++;

    if (t.amount > 0) stats.income += t.amount;
    else stats.expenses += Math.abs(t.amount);
    stats.netFlow += t.amount;

    const m = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
    if (!stats.byMonth[m]) stats.byMonth[m] = { income: 0, expenses: 0, count: 0 };
    stats.byMonth[m].count++;
    if (t.amount > 0) stats.byMonth[m].income += t.amount;
    else stats.byMonth[m].expenses += Math.abs(t.amount);
  }

  return stats;
}
