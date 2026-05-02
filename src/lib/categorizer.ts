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
  matchField?: "merchant" | "description" | "both";
  priority: number;
  note?: string;
}

const RULES: Rule[] = [
  // === DEBITI (priorità massima) ===
  {
    patterns: ["link finanziaria", "ndg 305089856", "sentenza 212023", "sentenza 21/2023"],
    pilastro: "debiti",
    matchField: "both",
    priority: 100,
  },
  {
    patterns: ["banca ifis", "agenzia delle entrate", "comune di messina"],
    pilastro: "debiti",
    matchField: "both",
    priority: 95,
    note: "Verificare se è parte sentenza tribunale",
  },

  // === FONDAMENTA (spese fisse strutturali) ===
  {
    patterns: ["a2a energia", "a2a", "enel"],
    pilastro: "fondamenta",
    matchField: "both",
    priority: 90,
    note: "Luce",
  },
  {
    patterns: ["tim spa", "tim "],
    pilastro: "fondamenta",
    matchField: "both",
    priority: 90,
    note: "Linea casa",
  },
  {
    patterns: ["iliad", "ho-mobile", "ho mobile", "vodafoneita", "vodafone"],
    pilastro: "fondamenta",
    matchField: "both",
    priority: 85,
    note: "SIM telefoniche",
  },
  {
    patterns: ["accademia danza", "danza teatro"],
    pilastro: "fondamenta",
    matchField: "both",
    priority: 90,
    note: "Danza Dalia",
  },
  {
    patterns: ["amazon prime", "prime video"],
    pilastro: "fondamenta",
    matchField: "both",
    priority: 80,
  },
  {
    patterns: ["apple.com/bill", "apple.com"],
    pilastro: "fondamenta",
    matchField: "both",
    priority: 75,
  },
  {
    patterns: ["canone hype"],
    pilastro: "fondamenta",
    matchField: "both",
    priority: 80,
  },
  {
    patterns: ["condominio timpazzi", "condominio"],
    pilastro: "fondamenta",
    matchField: "both",
    priority: 90,
  },
  {
    patterns: ["valerio di giovine", "bombole maio"],
    pilastro: "fondamenta",
    matchField: "both",
    priority: 85,
    note: "Bombole gas",
  },

  // === AMWAY ===
  {
    patterns: ["amwayitaly", "amway italia", "network21"],
    pilastro: "amway",
    matchField: "both",
    priority: 95,
  },

  // === FIGLI ===
  {
    patterns: ["carlo maio"],
    pilastro: "figli",
    matchField: "merchant",
    priority: 80,
  },

  // === QUOTIDIANO (cibo, benzina, salute) ===
  {
    patterns: [
      "decò", "deco", "despar", "interspar", "ard discount", "ard messina",
      "f.lli arena", "panda market", "conad", "iper conad", "coop",
      "bernava", "paghipoco", "camarda 1952", "alborea",
    ],
    pilastro: "quotidiano",
    matchField: "both",
    priority: 70,
    note: "Spesa alimentare",
  },
  {
    patterns: [
      "eni 09", "eni ", "esso", "ip messina", "stazione ip",
      "eg italia", "saccne rete", "bn petroli", "stazione di rif",
      "stazione servizio", "di benedetto carburanti", "stazione di servizio",
    ],
    pilastro: "quotidiano",
    matchField: "both",
    priority: 70,
    note: "Benzina",
  },
  {
    patterns: ["farmacia", "studio der.ma", "der.ma"],
    pilastro: "quotidiano",
    matchField: "both",
    priority: 75,
    note: "Salute",
  },
  {
    patterns: ["cas stazione villafra", "cas stazione milazzo", "cas stazione"],
    pilastro: "quotidiano",
    matchField: "both",
    priority: 60,
  },
  {
    patterns: ["mycicero", "easypark"],
    pilastro: "quotidiano",
    matchField: "both",
    priority: 60,
    note: "Parcheggi",
  },

  // === RESPIRO (svago, ristoranti, gite) ===
  {
    patterns: [
      "trenitalia", "trainline", "autogrill", "buffet salerno",
      "hotel europa", "hotel nizza", "hotel ",
      "all'antico vinaio", "la carraia", "red light",
      "irish pub", "old wild west", "mcdonald", "buda bar",
      "la cantina di bacco", "la tradizione", "bottega del gelato",
      "gelateria", "paradiso srls", "aurora in citta",
      "edicola giornali", "wycon", "firenze calzaiuoli",
      "la bottega dello svapo", "taber man",
      "blu jet", "ipsa montecatini",
    ],
    pilastro: "respiro",
    matchField: "both",
    priority: 70,
  },

  // === IMPREVISTI ===
  {
    patterns: ["agenzia delle entrate"],
    pilastro: "imprevisti",
    matchField: "both",
    priority: 50,
  },

  // === ENTRATE ===
  {
    patterns: ["fmobility", "stipendio"],
    pilastro: "entrate",
    matchField: "both",
    priority: 100,
    note: "Stipendio",
  },
  {
    patterns: ["assegno unico", "inps"],
    pilastro: "entrate",
    matchField: "both",
    priority: 100,
    note: "Assegni familiari",
  },
  {
    patterns: ["amway italia", "bonus payment"],
    pilastro: "entrate",
    matchField: "description",
    priority: 90,
    note: "Bonus Amway",
  },

  // === MARGINE (default per shopping vario) ===
  {
    patterns: [
      "shein", "temu", "zalando", "amazon", "amzn", "alipay",
      "one store", "chinatown", "doralice libreria",
      "unieuro", "gumroad",
    ],
    pilastro: "margine",
    matchField: "both",
    priority: 40,
  },
  {
    patterns: ["sisal"],
    pilastro: "margine",
    matchField: "both",
    priority: 50,
    note: "ATTENZIONE: Sisal/lotterie - verificare con utente",
  },
  {
    patterns: ["western union", "pineda castillo"],
    pilastro: "margine",
    matchField: "both",
    priority: 40,
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
    return { pilastro: best.pilastro, rule: best, matched: true };
  }

  return { pilastro: "margine", matched: false };
}
