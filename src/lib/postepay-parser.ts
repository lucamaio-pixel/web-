import Papa from "papaparse";
import {
  ParsedTransaction,
  parseAmount,
  parseDateIt,
  makeHash,
  isInternal,
  isDebt,
} from "./hype-parser";

// Estratto conto PostePay / BancoPosta.
// Colonne attese (l'export può avere righe di intestazione prima della tabella):
//   Data Contabile | Data Valuta | Importo (euro) | Descrizione operazioni

interface PostePayRow {
  [key: string]: string;
}

function pick(row: PostePayRow, ...candidates: string[]): string {
  for (const c of candidates) {
    for (const key of Object.keys(row)) {
      if (key.trim().toLowerCase() === c.toLowerCase()) return row[key] ?? "";
    }
  }
  // match parziale (es. "Importo (euro)" vs "Importo")
  for (const c of candidates) {
    for (const key of Object.keys(row)) {
      if (key.trim().toLowerCase().includes(c.toLowerCase())) return row[key] ?? "";
    }
  }
  return "";
}

function normalizeType(desc: string): string {
  const t = desc.toLowerCase();
  if (t.includes("prelievo")) return "prelievo";
  if (t.includes("ricarica")) return "ricarica";
  if (t.includes("postagiro")) return "bonifico_ordinario";
  if (t.includes("bonifico")) return "bonifico_ordinario";
  if (t.includes("commissioni") || t.includes("commissione")) return "commissione";
  if (t.includes("p2p")) return "denaro_ricevuto";
  if (t.includes("e-commerce")) return "pagamento";
  if (t.includes("apple pay") || t.includes("pagamento")) return "pagamento";
  return "pagamento";
}

// Ricava un "merchant" leggibile dalla descrizione PostePay
function extractMerchant(desc: string): string {
  let s = desc.trim();

  // Bonifici / giroconti: prendi il nominativo dopo "A " o "Da "
  const after = s.match(/\b(?:A|Da)\s+([A-Za-zÀ-ÿ'’.\s]+?)(?:\s+(?:PER|TRN|Op\.)\b|$)/);
  if (/bonifico|postagiro|ricarica|p2p/i.test(s) && after) {
    return after[1].replace(/\s+/g, " ").trim();
  }

  // Prelievo
  if (/prelievo/i.test(s)) return "Prelievo contanti";

  // Pagamenti: togli i prefissi noti
  s = s.replace(/^Pagamento\s+(Apple Pay|E-Commerce|POS)\s+/i, "");
  s = s.replace(/^Pagamento\s+/i, "");
  // taglia alla data (gg/mm/aaaa) se presente
  const dateIdx = s.search(/\b\d{2}\/\d{2}\/\d{4}\b/);
  if (dateIdx > 0) s = s.slice(0, dateIdx);
  // rimuovi eventuale "Op. NNN" residuo
  s = s.replace(/Op\.\s*\d+.*$/i, "");
  return s.replace(/\s+/g, " ").trim();
}

// Trova la riga di intestazione e scarta eventuale preambolo
function stripPreamble(content: string): string {
  const lines = content.split(/\r?\n/);
  const headerIdx = lines.findIndex(
    (l) => /descrizione/i.test(l) && /importo/i.test(l)
  );
  return headerIdx > 0 ? lines.slice(headerIdx).join("\n") : content;
}

export function parsePostePayCsv(content: string): ParsedTransaction[] {
  const cleaned = stripPreamble(content);
  const result = Papa.parse<PostePayRow>(cleaned, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (result.errors.length > 0) {
    console.warn("[postepay-parser] CSV parse errors:", result.errors.slice(0, 3));
  }

  const transactions: ParsedTransaction[] = [];

  for (const row of result.data) {
    const dataValuta = pick(row, "Data Valuta", "Data valuta");
    const dataContabile = pick(row, "Data Contabile", "Data contabile");
    const importoRaw = pick(row, "Importo (euro)", "Importo");
    const descrizione = pick(row, "Descrizione operazioni", "Descrizione", "Causale").trim();

    const dateStr = dataValuta || dataContabile;
    const date = parseDateIt(dateStr);
    if (!date) continue;

    const amount = parseAmount(importoRaw);
    if (!descrizione && amount === 0) continue;

    const merchant = extractMerchant(descrizione);
    const type = normalizeType(descrizione);
    const hashId = makeHash(dateStr, importoRaw || "", merchant, descrizione);

    transactions.push({
      date,
      bookedDate: parseDateIt(dataContabile),
      iban: "",
      type,
      merchant,
      description: descrizione,
      amount,
      rawData: JSON.stringify(row),
      hashId,
      isInternalTransfer: isInternal(merchant, descrizione),
      isDebtPayment: isDebt(merchant, descrizione),
    });
  }

  return transactions;
}
