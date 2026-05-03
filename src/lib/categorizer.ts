// Categorizzazione automatica delle transazioni nei Pilastri
// Basato sui dati reali dei CSV Hype Luca + Mileidy

export type PilastroKey =
  | "fondamenta"
  | "quotidiano"
  | "figli"
  | "amway"
  | "scudo"
  | "imprevisti"
  | "respiro"
  | "margine"
  | "arretrati"
  | "debiti"
  | "entrate"
  | "ignora";

interface Rule {
  patterns: string[];
  pilastro: PilastroKey;
  subcategory?: string;
  matchField?: "merchant" | "description" | "both";
  priority: number;
  note?: string;
}

const RULES: Rule[] = [
  // === DEBITI (priorità massima) ===
  {
    patterns: ["link finanziaria", "ndg 305089856", "sentenza 212023", "sentenza 21/2023"],
    pilastro: "debiti", subcategory: "link_finanziaria",
    matchField: "both", priority: 100,
  },
  {
    patterns: ["banca ifis"],
    pilastro: "debiti", subcategory: "banca_ifis",
    matchField: "both", priority: 95,
  },
  {
    patterns: ["agenzia delle entrate"],
    pilastro: "debiti", subcategory: "agenzia_entrate",
    matchField: "both", priority: 95,
  },
  {
    patterns: ["comune di messina"],
    pilastro: "debiti", subcategory: "comune_messina",
    matchField: "both", priority: 95,
  },

  // === FONDAMENTA (spese fisse strutturali) ===
  {
    patterns: ["a2a energia", "a2a", "enel"],
    pilastro: "fondamenta", subcategory: "luce_gas",
    matchField: "both", priority: 90,
  },
  {
    patterns: ["tim spa", "tim "],
    pilastro: "fondamenta", subcategory: "internet_telefono",
    matchField: "both", priority: 90,
  },
  {
    patterns: ["iliad", "ho-mobile", "ho mobile", "vodafoneita", "vodafone"],
    pilastro: "fondamenta", subcategory: "internet_telefono",
    matchField: "both", priority: 85,
  },
  {
    patterns: ["accademia danza", "danza teatro"],
    pilastro: "fondamenta", subcategory: "scuola_danza",
    matchField: "both", priority: 90,
  },
  {
    patterns: ["amazon prime", "prime video", "apple.com/bill", "apple.com", "canone hype"],
    pilastro: "fondamenta", subcategory: "abbonamenti",
    matchField: "both", priority: 80,
  },
  {
    patterns: ["condominio timpazzi", "condominio"],
    pilastro: "fondamenta", subcategory: "condominio",
    matchField: "both", priority: 90,
  },
  {
    patterns: ["valerio di giovine", "bombole maio"],
    pilastro: "fondamenta", subcategory: "altro_fondamenta",
    matchField: "both", priority: 85,
  },

  // === AMWAY ===
  {
    patterns: ["amwayitaly", "amway italia"],
    pilastro: "amway", subcategory: "prodotti",
    matchField: "both", priority: 95,
  },
  {
    patterns: ["network21"],
    pilastro: "amway", subcategory: "network21",
    matchField: "both", priority: 95,
  },

  // === FIGLI ===
  {
    patterns: ["carlo maio"],
    pilastro: "figli", subcategory: "carlo",
    matchField: "merchant", priority: 80,
  },

  // === QUOTIDIANO (cibo, benzina, salute) ===
  {
    patterns: [
      "decò", "deco", "despar", "interspar", "ard discount", "ard messina",
      "f.lli arena", "panda market", "conad", "iper conad", "coop",
      "bernava", "paghipoco", "camarda 1952", "alborea",
    ],
    pilastro: "quotidiano", subcategory: "spesa",
    matchField: "both", priority: 70,
  },
  {
    patterns: [
      "eni 09", "eni ", "esso", "ip messina", "stazione ip",
      "eg italia", "saccne rete", "bn petroli", "stazione di rif",
      "stazione servizio", "di benedetto carburanti", "stazione di servizio",
    ],
    pilastro: "quotidiano", subcategory: "benzina",
    matchField: "both", priority: 70,
  },
  {
    patterns: ["farmacia", "studio der.ma", "der.ma"],
    pilastro: "quotidiano", subcategory: "salute",
    matchField: "both", priority: 75,
  },
  {
    patterns: ["cas stazione villafra", "cas stazione milazzo", "cas stazione"],
    pilastro: "quotidiano", subcategory: "parcheggi",
    matchField: "both", priority: 60,
  },
  {
    patterns: ["mycicero", "easypark"],
    pilastro: "quotidiano", subcategory: "parcheggi",
    matchField: "both", priority: 60,
  },

  // === RESPIRO (svago, ristoranti, gite) ===
  {
    patterns: [
      "irish pub", "old wild west", "mcdonald", "buda bar",
      "la cantina di bacco", "la tradizione", "bottega del gelato",
      "gelateria", "paradiso srls", "aurora in citta", "autogrill", "buffet salerno",
    ],
    pilastro: "respiro", subcategory: "ristoranti",
    matchField: "both", priority: 70,
  },
  {
    patterns: [
      "trenitalia", "trainline", "hotel europa", "hotel nizza", "hotel ",
      "blu jet", "ipsa montecatini",
    ],
    pilastro: "respiro", subcategory: "viaggi_gite",
    matchField: "both", priority: 70,
  },
  {
    patterns: [
      "edicola giornali", "la bottega dello svapo", "taber man",
      "all'antico vinaio", "la carraia", "red light",
    ],
    pilastro: "respiro", subcategory: "svago",
    matchField: "both", priority: 70,
  },
  {
    patterns: ["wycon", "firenze calzaiuoli"],
    pilastro: "respiro", subcategory: "shopping_permesso",
    matchField: "both", priority: 70,
  },

  // === ENTRATE ===
  {
    patterns: ["fmobility", "stipendio"],
    pilastro: "entrate",
    matchField: "both", priority: 100,
  },
  {
    patterns: ["assegno unico", "inps"],
    pilastro: "entrate",
    matchField: "both", priority: 100,
  },
  {
    patterns: ["amway italia", "bonus payment"],
    pilastro: "entrate",
    matchField: "description", priority: 90,
  },

  // === MARGINE (default per shopping vario) ===
  {
    patterns: ["shein", "temu", "alipay", "one store", "chinatown"],
    pilastro: "margine", subcategory: "shopping_vario",
    matchField: "both", priority: 40,
  },
  {
    patterns: ["zalando", "amazon", "amzn", "unieuro", "gumroad", "doralice libreria"],
    pilastro: "margine", subcategory: "shopping_vario",
    matchField: "both", priority: 40,
  },
  {
    patterns: ["sisal"],
    pilastro: "margine", subcategory: "shopping_vario",
    matchField: "both", priority: 50,
    note: "ATTENZIONE: Sisal/lotterie - verificare con utente",
  },
  {
    patterns: ["western union", "pineda castillo"],
    pilastro: "margine", subcategory: "altro_margine",
    matchField: "both", priority: 40,
    note: "Trasferimenti famiglia",
  },

  // === IGNORA (movimenti interni / risparmi) ===
  {
    patterns: ["risparmi"],
    pilastro: "ignora",
    matchField: "both",
    priority: 30,
    note: "Salvadanaio Hype interno",
  },
];

export interface CategorizeResult {
  pilastro: PilastroKey;
  subcategory?: string;
  rule?: Rule;
  matched: boolean;
}

export function categorize(merchant: string, description: string, type: string): CategorizeResult {
  const m = (merchant || "").toLowerCase();
  const d = (description || "").toLowerCase();

  // I "Risparmi" interni di Hype non sono spese reali
  if (type === "risparmi") {
    return { pilastro: "ignora", matched: true };
  }

  // Bollo Hype lo ignoriamo (trascurabile)
  if (type === "bollo") {
    return { pilastro: "fondamenta", matched: true };
  }

  // Trova la regola con priorità più alta che matcha
  let best: Rule | null = null;
  for (const rule of RULES) {
    const matchTexts =
      rule.matchField === "merchant" ? [m] :
      rule.matchField === "description" ? [d] :
      [m, d];
    const hit = rule.patterns.some((p) =>
      matchTexts.some((t) => t.includes(p.toLowerCase()))
    );
    if (hit && (!best || rule.priority > best.priority)) {
      best = rule;
    }
  }

  if (best) {
    return { pilastro: best.pilastro, subcategory: best.subcategory, rule: best, matched: true };
  }

  return { pilastro: "margine", matched: false };
}
