import { roundMoney, toSafeNumber } from "./numbers";

export const AUTO_CYCLE_KEY = "auto";

export function cycleMonthFromDate(date) {
  if (!date) return "";
  const value = date instanceof Date ? date : new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

export function resolvePaymentCycleKey(payment) {
  const raw = String(payment?.cycleKey || payment?.cycleMonth || "").trim();
  if (!raw || raw === AUTO_CYCLE_KEY) return AUTO_CYCLE_KEY;
  return raw.slice(0, 7);
}

export function paymentsForAccount(payments, accountId) {
  return (payments || []).filter((payment) => payment.accountId === accountId);
}

export function paymentsForCycle(payments, accountId, cycleMonth) {
  if (!cycleMonth || cycleMonth === AUTO_CYCLE_KEY) {
    return paymentsForAccount(payments, accountId).filter(
      (payment) => resolvePaymentCycleKey(payment) === AUTO_CYCLE_KEY
    );
  }
  return paymentsForAccount(payments, accountId)
    .filter((payment) => resolvePaymentCycleKey(payment) === cycleMonth)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function sortPaymentsAsc(payments) {
  return [...payments].sort((a, b) => {
    const byDate = String(a.date || "").localeCompare(String(b.date || ""));
    if (byDate) return byDate;
    return String(a.id || "").localeCompare(String(b.id || ""));
  });
}

export function allocatePaymentPool(items = [], appliedAmount) {
  const rows = [...items].sort((a, b) =>
    String(a.purchaseDate || "").localeCompare(String(b.purchaseDate || ""))
  );
  let pool = roundMoney(toSafeNumber(appliedAmount, 0));
  const allocations = rows.map((item, index) => {
    const charge = roundMoney(toSafeNumber(item.amount, 0));
    const applied = roundMoney(Math.min(charge, Math.max(0, pool)));
    pool = roundMoney(pool - applied);
    const fullyPaid = charge > 0 && applied >= charge - 0.009;
    const partial = applied > 0.009 && !fullyPaid;
    return {
      key: `${item.id}-${item.label || index}`,
      expenseId: item.id,
      charge,
      applied,
      remaining: roundMoney(Math.max(0, charge - applied)),
      fullyPaid,
      partial,
    };
  });

  const allocationById = {};
  allocations.forEach((row) => {
    const prev = allocationById[row.expenseId];
    if (!prev) {
      allocationById[row.expenseId] = { ...row };
      return;
    }
    const charge = roundMoney(prev.charge + row.charge);
    const applied = roundMoney(prev.applied + row.applied);
    const fullyPaid = charge > 0 && applied >= charge - 0.009;
    allocationById[row.expenseId] = {
      ...prev,
      charge,
      applied,
      remaining: roundMoney(Math.max(0, charge - applied)),
      fullyPaid,
      partial: applied > 0.009 && !fullyPaid,
    };
  });

  const allocatedItems = rows.map((item, index) => ({
    ...item,
    allocation: allocations[index],
  }));

  return { allocations, allocationById, allocatedItems };
}

function takeFromQueue(queue, amount) {
  const landed = [];
  let need = roundMoney(toSafeNumber(amount, 0));
  queue.forEach((slot) => {
    if (need <= 0.009) return;
    const take = roundMoney(Math.min(slot.left, need));
    if (take <= 0.009) return;
    slot.left = roundMoney(slot.left - take);
    need = roundMoney(need - take);
    landed.push({ ...slot.payment, appliedHere: take });
  });
  return landed;
}

/**
 * FIFO: abonos automáticos cubren primero el corte más antiguo.
 * Los abonos con ciclo explícito se aplican a ese corte; el sobrante sigue hacia adelante.
 */
export function applyPaymentsToLedger(cycles = [], payments = [], accountId) {
  const accountPayments = paymentsForAccount(payments, accountId);
  const tagged = {};
  const taggedPayments = {};
  const autoPayments = [];

  accountPayments.forEach((payment) => {
    const key = resolvePaymentCycleKey(payment);
    const amount = roundMoney(toSafeNumber(payment.amount, 0));
    if (key === AUTO_CYCLE_KEY) {
      autoPayments.push(payment);
      return;
    }
    tagged[key] = roundMoney((tagged[key] || 0) + amount);
    taggedPayments[key] = taggedPayments[key] || [];
    taggedPayments[key].push(payment);
  });

  const autoQueue = sortPaymentsAsc(autoPayments).map((payment) => ({
    payment,
    left: roundMoney(toSafeNumber(payment.amount, 0)),
  }));
  let pool = roundMoney(autoQueue.reduce((sum, slot) => sum + slot.left, 0));
  const allPaid = roundMoney(accountPayments.reduce((sum, payment) => sum + toSafeNumber(payment.amount, 0), 0));

  const appliedCycles = cycles.map((cycle) => {
    const monthKey = cycle.monthKey;
    const gross = roundMoney(toSafeNumber(cycle.gross ?? cycle.total, 0));
    const taggedAmount = roundMoney(tagged[monthKey] || 0);
    const taggedList = [...(taggedPayments[monthKey] || [])].sort((a, b) =>
      String(b.date || "").localeCompare(String(a.date || ""))
    );

    pool = roundMoney(pool + taggedAmount);
    const paidAmount = roundMoney(Math.min(gross, pool));
    const remaining = roundMoney(Math.max(0, gross - pool));
    const surplus = roundMoney(Math.max(0, pool - gross));
    const fromTagged = roundMoney(Math.min(taggedAmount, paidAmount));
    const autoLeft = roundMoney(autoQueue.reduce((sum, slot) => sum + slot.left, 0));
    const fromAuto = roundMoney(Math.min(Math.max(0, paidAmount - fromTagged), autoLeft));
    const autoLanded = takeFromQueue(autoQueue, fromAuto);
    pool = surplus;

    const { allocations, allocationById, allocatedItems } = allocatePaymentPool(cycle.items || [], paidAmount);
    const settled = remaining <= 0.01;

    return {
      ...cycle,
      monthKey,
      cycleMonth: monthKey,
      gross,
      paidAmount,
      remaining,
      surplus,
      settled,
      fromTagged,
      fromAuto,
      allocations,
      allocationById,
      items: allocatedItems,
      cyclePayments: [...taggedList, ...autoLanded],
      total: remaining,
    };
  });

  const byKey = Object.fromEntries(appliedCycles.map((cycle) => [cycle.monthKey, cycle]));
  const oldestUnpaid = appliedCycles.find((cycle) => cycle.remaining > 0.01) || null;

  return { cycles: appliedCycles, byKey, allPaid, oldestUnpaid };
}

export function applyPaymentsToStatement(statement, payments = [], accountId) {
  const current = {
    monthKey: cycleMonthFromDate(statement.lastCutoff),
    items: statement.currentItems || [],
    gross: statement.currentDue,
  };
  const next = {
    monthKey: cycleMonthFromDate(statement.nextCutoff),
    items: statement.nextItems || [],
    gross: statement.nextDue,
  };
  const ledger = applyPaymentsToLedger([current, next], payments, accountId);
  const currentEntry = ledger.byKey[current.monthKey];
  const nextEntry = ledger.byKey[next.monthKey];

  return {
    cycleMonth: current.monthKey,
    cyclePayments: currentEntry?.cyclePayments || [],
    paidAmount: currentEntry?.paidAmount || 0,
    appliedToCurrent: currentEntry?.paidAmount || 0,
    remainingCurrent: currentEntry?.remaining || 0,
    surplus: currentEntry?.surplus || 0,
    remainingNext: nextEntry?.remaining || 0,
    settled: Boolean(currentEntry?.settled),
    allocations: currentEntry?.allocations || [],
    allocationById: currentEntry?.allocationById || {},
    displayBalance: roundMoney(Math.max(0, toSafeNumber(statement.currentBalance, 0) - ledger.allPaid)),
    displayCurrentDue: currentEntry?.remaining || 0,
    displayNextDue: nextEntry?.remaining || 0,
  };
}

/** Aplica abonos por ciclo y cascada FIFO el sobrante / automático a los cortes siguientes. */
export function applyPaymentsToProjections(cycles = [], payments = [], accountId) {
  const ledger = applyPaymentsToLedger(
    cycles.map((cycle) => ({
      ...cycle,
      monthKey: cycle.monthKey,
      items: cycle.items || [],
      gross: cycle.gross ?? cycle.total,
    })),
    payments,
    accountId
  );

  return cycles.map((cycle) => {
    const entry = ledger.byKey[cycle.monthKey];
    if (!entry) return cycle;
    return {
      ...cycle,
      ...entry,
      items: entry.items,
      gross: entry.gross,
      paidAmount: entry.paidAmount,
      surplus: entry.surplus,
      total: entry.remaining,
      settled: entry.settled,
    };
  });
}
