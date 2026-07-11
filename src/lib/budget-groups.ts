// Struttura "a buste" del budget familiare — rispecchia il quaderno cartaceo.
// Entrate → Spese fisse → Spese variabili → Imprevisti → Buste (accantonamenti) → Cuscino.

export type SectionId = "fisse" | "variabili" | "imprevisti" | "buste" | "cuscino";

// Mappa: chiave pilastro → sezione del budget
export const PILASTRO_GROUP: Record<string, SectionId> = {
  // Spese fisse (ci sono sempre, importo costante)
  debiti: "fisse",
  fondamenta: "fisse",
  // Spese variabili (ogni mese, importo che oscilla)
  quotidiano: "variabili",
  figli: "variabili",
  amway: "variabili",
  respiro: "variabili",
  margine: "variabili",
  // Imprevisti
  imprevisti: "imprevisti",
  // Buste — accantonamenti per spese periodiche (annuali/semestrali)
  assicurazione: "buste",
  bollo: "buste",
  dentista: "buste",
  viaggi: "buste",
  potatura: "buste",
  // Cuscino di emergenza
  scudo: "cuscino",
};

export const SECTIONS: { id: SectionId; label: string; emoji: string; hint: string }[] = [
  { id: "fisse", label: "Spese fisse", emoji: "📌", hint: "Ci sono sempre, importo costante" },
  { id: "variabili", label: "Spese variabili", emoji: "🔄", hint: "Ogni mese, importo che oscilla" },
  { id: "imprevisti", label: "Imprevisti", emoji: "⚡", hint: "Extra non programmati" },
  { id: "buste", label: "Buste — accantonamenti", emoji: "✉️", hint: "Metti da parte ogni mese per le spese annuali" },
  { id: "cuscino", label: "Cuscino", emoji: "🔒", hint: "Riserva d'emergenza, non si tocca" },
];

// Le chiavi dei pilastri che sono "buste" (accantonamenti con saldo, non spesa mensile)
export const BUSTA_KEYS = ["assicurazione", "bollo", "dentista", "viaggi", "potatura"];

export function sectionOf(pilastroKey: string): SectionId {
  return PILASTRO_GROUP[pilastroKey] ?? "variabili";
}
