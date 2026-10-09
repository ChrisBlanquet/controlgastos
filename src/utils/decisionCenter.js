import { getPaymentDueDate } from "./cardDates";
import { buildAccountPaymentLedger } from "./cardStatement";
import { remainingDebt } from "./expenses";
import { formatMXN } from "./money";
import { cycleMonthFromDate } from "./payments";
import { isExpensePaid, loanPaymentInMonth } from "./projections";
import { roundMoney, toSafeNumber } from "./numbers";

export const STRATEGIES = [
  { id: "msi", label: "Optimizar intereses / Salvar MSI", hint: "Recomendado", recommended: true },
  { id: "avalanche", label: "Método Avalancha", hint: "Mayor CAT primero" },
  { id: "snowball", label: "Método Bola de nieve", hint: "Deuda más baja primero" },
];

function itemRemaining(item) {
  if (item.allocation?.remaining != null) return roundMoney(toSafeNumber(item.allocation.remaining, 0));
  return roundMoney(toSafeNumber(item.amount, 0));
}

function cardOutstanding(account, expenses) {
  const fromExpenses = roundMoney(
    expenses
      .filter((expense) => expense.accountId === account.id && !isExpensePaid(expense))
      .reduce((sum, expense) => sum + remainingDebt(expense), 0)
  );
  return fromExpenses > 0 ? fromExpenses : roundMoney(toSafeNumber(account.currentBalance, 0));
}

export function commitmentsInCalendarMonth(accounts = [], expenses = [], payments = [], loans = [], monthValue) {
  const cards = accounts.filter((account) => account.type !== "loan");
  const rows = [];

  cards.forEach((account) => {
    const ledger = buildAccountPaymentLedger(account, expenses, payments);
    ledger.cycles.forEach((cycle) => {
      const remaining = roundMoney(toSafeNumber(cycle.remaining, 0));
      if (remaining <= 0.01) return;
      const paymentDue = getPaymentDueDate(cycle.statementCutoff, account.paymentDueDays);
      if (cycleMonthFromDate(paymentDue) !== monthValue) return;

      const dueItems = (cycle.items || [])
        .map((item) => ({
          ...item,
          remaining: itemRemaining(item),
        }))
        .filter((item) => item.remaining > 0.01);

      const msiRemaining = roundMoney(
        dueItems.filter((item) => item.kind === "msi").reduce((sum, item) => sum + item.remaining, 0)
      );
      const cashRemaining = roundMoney(
        dueItems.filter((item) => item.kind !== "msi").reduce((sum, item) => sum + item.remaining, 0)
      );
      const dueDay = paymentDue.getDate();

      rows.push({
        id: `${account.id}-${cycle.monthKey}`,
        accountId: account.id,
        name: account.name,
        bank: account.bank,
        themeColor: account.themeColor,
        interestRate: toSafeNumber(account.interestRate, 0),
        totalDebt: cardOutstanding(account, expenses),
        monthKey: cycle.monthKey,
        paymentDue,
        dueDay,
        fortnight: dueDay <= 15 ? "first" : "second",
        remaining,
        gross: cycle.gross,
        paidAmount: cycle.paidAmount,
        msiRemaining,
        cashRemaining,
        items: dueItems,
        lastMsi: dueItems.filter((item) => item.kind === "msi" && item.isLast),
      });
    });
  });

  loans.forEach((loan) => {
    const amount = roundMoney(loanPaymentInMonth(loan, monthValue));
    if (amount <= 0.01) return;
    rows.push({
      id: `loan-${loan.id}`,
      accountId: loan.id,
      name: loan.name,
      bank: loan.institution,
      interestRate: toSafeNumber(loan.interestRate, 0),
      totalDebt: roundMoney(toSafeNumber(loan.currentBalance, 0)),
      monthKey: monthValue,
      paymentDue: null,
      dueDay: 28,
      fortnight: "second",
      remaining: amount,
      gross: amount,
      paidAmount: 0,
      msiRemaining: 0,
      cashRemaining: amount,
      items: [
        {
          id: loan.id,
          kind: "loan",
          title: loan.name,
          remaining: amount,
          amount,
          isLast: false,
        },
      ],
      lastMsi: [],
      isLoan: true,
    });
  });

  rows.sort((a, b) => a.dueDay - b.dueDay || b.remaining - a.remaining);

  const total = roundMoney(rows.reduce((sum, row) => sum + row.remaining, 0));
  const first = roundMoney(rows.filter((row) => row.fortnight === "first").reduce((sum, row) => sum + row.remaining, 0));
  const second = roundMoney(rows.filter((row) => row.fortnight === "second").reduce((sum, row) => sum + row.remaining, 0));
  const msiTotal = roundMoney(rows.reduce((sum, row) => sum + row.msiRemaining, 0));
  const cashTotal = roundMoney(rows.reduce((sum, row) => sum + row.cashRemaining, 0));
  const lastMsi = rows.flatMap((row) => row.lastMsi.map((item) => ({ ...item, cardName: row.name, cardId: row.accountId })));

  return {
    month: monthValue,
    rows,
    total,
    first,
    second,
    msiTotal,
    cashTotal,
    lastMsi,
  };
}

function fillBuckets(budget, buckets) {
  let left = roundMoney(toSafeNumber(budget, 0));
  const assigned = {};
  buckets.forEach((bucket) => {
    const take = roundMoney(Math.min(left, bucket.amount));
    assigned[bucket.id] = take;
    left = roundMoney(left - take);
  });
  return { assigned, leftover: left };
}

function bucketsForStrategy(commitments, strategy) {
  if (strategy === "avalanche") {
    return [...commitments.rows]
      .sort((a, b) => b.interestRate - a.interestRate || b.remaining - a.remaining)
      .map((row) => ({ id: row.id, amount: row.remaining, row }));
  }

  if (strategy === "snowball") {
    return [...commitments.rows]
      .sort((a, b) => a.totalDebt - b.totalDebt || a.remaining - b.remaining)
      .map((row) => ({ id: row.id, amount: row.remaining, row }));
  }

  const last = [];
  const msi = [];
  const cash = [];
  commitments.rows.forEach((row) => {
    row.items.forEach((item, index) => {
      const bucket = {
        id: `${row.id}-${item.id}-${item.label || index}`,
        amount: item.remaining,
        row,
        item,
      };
      if (item.kind === "msi" && item.isLast) last.push(bucket);
      else if (item.kind === "msi") msi.push(bucket);
      else cash.push(bucket);
    });
  });

  last.sort((a, b) => a.amount - b.amount);
  msi.sort((a, b) => a.amount - b.amount);
  cash.sort((a, b) => (b.row.interestRate || 0) - (a.row.interestRate || 0) || b.amount - a.amount);
  return [...last, ...msi, ...cash];
}

export function simulatePaymentPlan(commitments, budget, strategy = "msi") {
  const amount = roundMoney(Math.max(0, toSafeNumber(budget, 0)));
  const buckets = bucketsForStrategy(commitments, strategy);
  const { assigned, leftover } = fillBuckets(amount, buckets);
  const byRow = {};

  buckets.forEach((bucket) => {
    const take = assigned[bucket.id] || 0;
    const current = byRow[bucket.row.id] || { assigned: 0, msiAssigned: 0, lastMsiSaved: 0 };
    current.assigned = roundMoney(current.assigned + take);
    if (bucket.item?.kind === "msi") {
      current.msiAssigned = roundMoney(current.msiAssigned + take);
      if (bucket.item.isLast && take >= bucket.amount - 0.009) current.lastMsiSaved += 1;
    }
    byRow[bucket.row.id] = current;
  });

  const distribution = commitments.rows.map((row) => {
    const stats = byRow[row.id] || { assigned: 0, msiAssigned: 0, lastMsiSaved: 0 };
    const assignedAmount = roundMoney(stats.assigned);
    const shortfall = roundMoney(Math.max(0, row.remaining - assignedAmount));
    const covered = shortfall <= 0.01 && row.remaining > 0;
    return {
      ...row,
      assigned: assignedAmount,
      shortfall,
      covered,
      partial: assignedAmount > 0.01 && shortfall > 0.01,
      msiAssigned: stats.msiAssigned,
      lastMsiSaved: stats.lastMsiSaved,
    };
  });

  const msiDue = commitments.msiTotal;
  const msiFunded = roundMoney(distribution.reduce((sum, row) => sum + row.msiAssigned, 0));
  const lastSaved = distribution.reduce((sum, row) => sum + row.lastMsiSaved, 0);
  const msiInstallmentsCovered = buckets.filter(
    (bucket) => bucket.item?.kind === "msi" && (assigned[bucket.id] || 0) >= bucket.amount - 0.009
  ).length;
  const allCovered = distribution.every((row) => row.covered || row.remaining <= 0.01);
  const interestAvoided = allCovered && amount > 0;
  const savedLabel = lastSaved || msiInstallmentsCovered;

  let impact = "Escribe un monto para ver cómo conviene repartirlo este mes.";
  if (amount > 0 && commitments.total <= 0.01) {
    impact = "No hay pagos exigibles en este mes civil. Puedes usar el dinero para adelantar MSI o ahorrar.";
  } else if (amount > 0 && interestAvoided) {
    impact =
      savedLabel > 0
        ? `Con este abono reduces tus intereses a $0 y salvas ${savedLabel} mensualidad${savedLabel === 1 ? "" : "es"} sin intereses.`
        : "Con este abono reduces tus intereses a $0 en este mes.";
  } else if (amount > 0 && msiDue > 0 && msiFunded >= msiDue - 0.01) {
    const cashGap = roundMoney(Math.max(0, commitments.cashTotal - (amount - msiFunded)));
    impact =
      cashGap > 0.01
        ? `Salvas las MSI de este mes. Te faltarían ${formatMXN(cashGap)} en compras de contado para no generar intereses.`
        : "Cubres los MSI de este mes y evitas perder las promociones.";
  } else if (amount > 0 && msiDue > 0) {
    const msiGap = roundMoney(Math.max(0, msiDue - msiFunded));
    impact = `Priorizamos MSI por vencer; aún faltarían ${formatMXN(msiGap)} para no perder promociones.`;
  } else if (amount > 0) {
    const gap = roundMoney(Math.max(0, commitments.total - amount));
    impact =
      gap > 0.01
        ? `Este abono baja la deuda inmediata. Te faltarían ${formatMXN(gap)} para cubrir todo el mes.`
        : "Con este abono cubres los compromisos exigibles del mes.";
  }

  if (lastSaved > 0 && !impact.includes("salvas")) {
    impact += ` Liberas ${lastSaved} compra${lastSaved === 1 ? "" : "s"} MSI al terminar su última mensualidad.`;
  }

  return {
    amount,
    leftover,
    strategy,
    distribution,
    msiFunded,
    lastSaved,
    allCovered,
    impact,
  };
}

export function buildRecommendations(commitments, incomeAmount) {
  const cards = [];
  const income = roundMoney(toSafeNumber(incomeAmount, 0));

  commitments.lastMsi.forEach((item) => {
    cards.push({
      id: `last-${item.id}`,
      tone: "violet",
      title: "Último empujón",
      body: `Terminas de pagar ${item.title || "esta compra MSI"} este mes y liberarás ${formatMXN(item.remaining)} mensuales para tu bolsillo.`,
      emoji: "🎯",
    });
  });

  if (income > 0 && commitments.total > income + 0.01) {
    const deficit = roundMoney(commitments.total - income);
    cards.push({
      id: "capacity",
      tone: "rose",
      title: "Alerta de capacidad",
      body: `El sueldo registrado no cubre los vencimientos de este mes. El déficit exacto es ${formatMXN(deficit)}.`,
      emoji: "⚠️",
    });
  } else if (!income && commitments.total > 0.01) {
    cards.push({
      id: "capacity-empty",
      tone: "rose",
      title: "Sin sueldo registrado",
      body: `Hay ${formatMXN(commitments.total)} exigibles y aún no hay ingreso del mes para comparar capacidad.`,
      emoji: "⚠️",
    });
  }

  if (commitments.total > 0.01) {
    cards.push({
      id: "mix",
      tone: "emerald",
      title: "MSI vs contado",
      body: `${formatMXN(commitments.msiTotal)} son compromisos fijos de meses anteriores (MSI) y ${formatMXN(commitments.cashTotal)} son compras de contado o crédito nuevo de este ciclo.`,
      emoji: "📊",
    });
  }

  if (!cards.length) {
    cards.push({
      id: "clear",
      tone: "emerald",
      title: "Mes despejado",
      body: "No hay vencimientos exigibles en este mes civil. Es un buen momento para adelantar MSI o reforzar el colchón.",
      emoji: "✨",
    });
  }

  return cards;
}
