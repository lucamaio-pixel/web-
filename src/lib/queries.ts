import { prisma } from "./prisma";
import { currentMonth, dateToMonth, monthsBetween } from "./utils";

export async function getPilastri() {
  return prisma.pilastro.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    include: {
      subcategories: {
        where: { active: true },
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function getAccounts() {
  return prisma.account.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
}

export async function getAccountBalance(accountId: string) {
  const result = await prisma.transaction.aggregate({
    where: { accountId, deleted: false },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

export async function getAllBalances() {
  const accounts = await getAccounts();
  const balances = await Promise.all(
    accounts.map(async (a) => ({
      ...a,
      balance: await getAccountBalance(a.id),
    }))
  );
  return balances;
}

export async function getMonthlyStats(month: string = currentMonth()) {
  const [y, m] = month.split("-").map(Number);
  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m, 1);

  const txs = await prisma.transaction.findMany({
    where: {
      date: { gte: from, lt: to },
      deleted: false,
      isInternalTransfer: false,
    },
    include: { pilastro: true, subcategory: true },
  });

  type SubcatEntry = { id: string; key: string; name: string; emoji: string; monthlyBudget: number; total: number; count: number; merchants: Record<string, { total: number; count: number }> };
  const byPilastro: Record<string, {
    spent: number;
    count: number;
    pilastroName: string;
    pilastroEmoji: string;
    merchants: Record<string, { total: number; count: number }>;
    subcategories: Record<string, SubcatEntry>;
  }> = {};
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const t of txs) {
    if (t.amount > 0) totalIncome += t.amount;
    else totalExpenses += Math.abs(t.amount);

    if (t.pilastroId && t.pilastro) {
      if (!byPilastro[t.pilastroId]) {
        byPilastro[t.pilastroId] = {
          spent: 0, count: 0,
          pilastroName: t.pilastro.name,
          pilastroEmoji: t.pilastro.emoji,
          merchants: {},
          subcategories: {},
        };
      }
      if (t.amount < 0) {
        const abs = Math.abs(t.amount);
        byPilastro[t.pilastroId].spent += abs;
        const merchantKey = t.merchant || t.description || "Altro";

        if (t.subcategoryId && t.subcategory) {
          const sid = t.subcategoryId;
          if (!byPilastro[t.pilastroId].subcategories[sid]) {
            byPilastro[t.pilastroId].subcategories[sid] = {
              id: sid,
              key: t.subcategory.key,
              name: t.subcategory.name,
              emoji: t.subcategory.emoji,
              monthlyBudget: t.subcategory.monthlyBudget,
              total: 0, count: 0,
              merchants: {},
            };
          }
          byPilastro[t.pilastroId].subcategories[sid].total += abs;
          byPilastro[t.pilastroId].subcategories[sid].count++;
          const sc = byPilastro[t.pilastroId].subcategories[sid].merchants;
          if (!sc[merchantKey]) sc[merchantKey] = { total: 0, count: 0 };
          sc[merchantKey].total += abs;
          sc[merchantKey].count++;
        } else {
          if (!byPilastro[t.pilastroId].merchants[merchantKey]) {
            byPilastro[t.pilastroId].merchants[merchantKey] = { total: 0, count: 0 };
          }
          byPilastro[t.pilastroId].merchants[merchantKey].total += abs;
          byPilastro[t.pilastroId].merchants[merchantKey].count++;
        }
      }
      byPilastro[t.pilastroId].count++;
    }
  }

  return { totalIncome, totalExpenses, byPilastro, txCount: txs.length };
}

export async function getDebtPlanStatus() {
  const plan = await prisma.debtPlan.findFirst({
    where: { active: true },
    include: { installments: { orderBy: { month: "asc" } } },
  });
  if (!plan) return null;

  const now = currentMonth();
  const installments = plan.installments;
  const totalCount = installments.length;
  const totalAmount = installments.reduce((s, i) => s + i.amount, 0);

  const past = installments.filter((i) => i.month < now);
  const current = installments.filter((i) => i.month === now);
  const future = installments.filter((i) => i.month > now);

  const paidAmount = past.reduce((s, i) => s + i.amount, 0);
  const remainingAmount = future.reduce((s, i) => s + i.amount, 0) + current.reduce((s, i) => s + i.amount, 0);

  // Importo medio mensile attuale
  const currentMonthlyTotal = current.reduce((s, i) => s + i.amount, 0);

  // Trova le fasi e date di liberazione
  const monthlyTotals = new Map<string, number>();
  installments.forEach((i) => {
    monthlyTotals.set(i.month, (monthlyTotals.get(i.month) ?? 0) + i.amount);
  });

  const liberations: { month: string; from: number; to: number; saved: number }[] = [];
  let prevTotal = currentMonthlyTotal;
  const sortedMonths = Array.from(monthlyTotals.keys()).sort();
  for (const m of sortedMonths) {
    if (m <= now) continue;
    const total = monthlyTotals.get(m)!;
    if (Math.abs(total - prevTotal) > 0.01) {
      liberations.push({ month: m, from: prevTotal, to: total, saved: prevTotal - total });
      prevTotal = total;
    }
  }
  // Liberazione finale
  liberations.push({ month: sortedMonths[sortedMonths.length - 1], from: prevTotal, to: 0, saved: prevTotal });

  const nextLiberation = liberations[0] ?? null;
  const monthsToNextLiberation = nextLiberation
    ? monthsBetween(now, nextLiberation.month)
    : 0;

  return {
    plan,
    totalCount,
    totalAmount,
    paidCount: past.length,
    paidAmount,
    remainingCount: future.length + current.length,
    remainingAmount,
    currentMonthlyTotal,
    nextLiberation,
    monthsToNextLiberation,
    liberations,
    progressPercent: (paidAmount / totalAmount) * 100,
  };
}

async function getSetting(key: string): Promise<string | null> {
  const s = await prisma.setting.findUnique({ where: { key } });
  return s?.value ?? null;
}

// Conto designato come cuscino: la PostePay
export async function getCushionStatus() {
  const account = await prisma.account.findFirst({
    where: { active: true, OR: [{ type: "postepay" }, { name: "PostePay" }] },
  });
  if (!account) return null;

  const balance = await getAccountBalance(account.id);
  const target = Number(await getSetting("cushion_target")) || 1500;
  const floor = Number(await getSetting("cushion_floor")) || 800;

  return {
    accountId: account.id,
    accountName: account.name,
    balance,
    target,
    floor,
    belowFloor: balance < floor,
    deficit: Math.max(0, target - balance),
    percentToTarget: target > 0 ? (balance / target) * 100 : 0,
  };
}

// Liquidità complessiva e "disponibile senza toccare il cuscino"
export async function getLiquidityStatus() {
  const balances = await getAllBalances();
  const total = balances.reduce((s, b) => s + b.balance, 0);

  const cushion = await getCushionStatus();
  const cushionBalance = cushion?.balance ?? 0;
  // liquidità operativa = tutto ciò che NON è cuscino
  const operational = total - cushionBalance;

  // prossime rate debito conosciute (mese corrente e successivo)
  const now = currentMonth();
  const [ny, nm] = now.split("-").map(Number);
  const next = nm === 12 ? `${ny + 1}-01` : `${ny}-${String(nm + 1).padStart(2, "0")}`;
  const plan = await prisma.debtPlan.findFirst({
    where: { active: true },
    include: { installments: true },
  });
  const sumMonth = (m: string) =>
    (plan?.installments ?? []).filter((i) => i.month === m).reduce((s, i) => s + i.amount, 0);

  return {
    balances,
    total,
    cushionBalance,
    operational,
    cushion,
    debtThisMonth: sumMonth(now),
    debtNextMonth: sumMonth(next),
  };
}

export async function getScudoStatus() {
  const scudo = await prisma.pilastro.findUnique({ where: { key: "scudo" } });
  if (!scudo) return null;
  const target = scudo.goalAmount ?? 3000;
  const current = scudo.currentBalance;
  const percent = (current / target) * 100;
  const monthlyContribution = scudo.monthlyBudget;
  const remaining = target - current;
  const monthsToGoal = monthlyContribution > 0 ? Math.ceil(remaining / monthlyContribution) : 0;
  return { current, target, percent, monthsToGoal, monthlyContribution, remaining };
}

export async function getRecentTransactions(limit = 10) {
  return prisma.transaction.findMany({
    where: { deleted: false },
    orderBy: { date: "desc" },
    take: limit,
    include: { account: true, pilastro: true },
  });
}

export async function getAvailableMonths(): Promise<string[]> {
  const txs = await prisma.transaction.findMany({
    where: { deleted: false },
    select: { date: true },
  });
  const months = new Set<string>();
  for (const t of txs) {
    const d = t.date;
    months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return Array.from(months).sort();
}

export async function getGoals() {
  return prisma.goal.findMany({
    where: { completed: false },
    orderBy: { createdAt: "asc" },
  });
}

export async function getAssets() {
  try {
    return await prisma.asset.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    });
  } catch {
    // Tabella non ancora creata
    return [];
  }
}

export async function getLibertaStatus() {
  const [assets, pilastri, debtStatus] = await Promise.all([
    getAssets(),
    prisma.pilastro.findMany({ where: { active: true } }),
    getDebtPlanStatus(),
  ]);

  const totalAssetIncome = assets.reduce((s, a) => s + a.monthlyIncome, 0);
  const totalAssetValue = assets.reduce((s, a) => s + a.currentValue, 0);
  const monthlyExpenses = pilastri.reduce((s, p) => s + p.monthlyBudget, 0);

  const coveragePercent = monthlyExpenses > 0 ? (totalAssetIncome / monthlyExpenses) * 100 : 0;

  const totalDebt = debtStatus?.totalAmount ?? 0;
  const remainingDebt = debtStatus?.remainingAmount ?? 0;
  const debtPaidPercent = totalDebt > 0 ? ((totalDebt - remainingDebt) / totalDebt) * 100 : 0;

  const netWorth = totalAssetValue - remainingDebt;

  return {
    assets,
    totalAssetIncome,
    totalAssetValue,
    monthlyExpenses,
    coveragePercent,
    totalDebt,
    remainingDebt,
    debtPaidPercent,
    netWorth,
    debtStatus,
  };
}

export async function getDataInfo() {
  const txCount = await prisma.transaction.count({ where: { deleted: false } });
  const lastTx = await prisma.transaction.findFirst({
    where: { deleted: false },
    orderBy: { date: "desc" },
  });
  const firstTx = await prisma.transaction.findFirst({
    where: { deleted: false },
    orderBy: { date: "asc" },
  });
  return {
    txCount,
    firstDate: firstTx?.date ?? null,
    lastDate: lastTx?.date ?? null,
    months: firstTx && lastTx ? monthsBetween(dateToMonth(firstTx.date), dateToMonth(lastTx.date)) + 1 : 0,
  };
}
