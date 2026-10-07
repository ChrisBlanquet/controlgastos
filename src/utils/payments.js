import { roundMoney, toSafeNumber } from "./numbers";

export function cycleMonthFromDate(date) {
  if (!date) return "";
  const value = date instanceof Date ? date : new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

export function paymentsForCycle(payments, accountId, cycleMonth) {
  return payments
    .filter((payment) => payment.accountId === accountId && payment.cycleMonth === cycleMonth)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export function applyPaymentsToStatement(statement, payments = [], accountId) {
  const cycleMonth = cycleMonthFromDate(statement.lastCutoff);
  const cyclePayments = paymentsForCycle(payments, accountId, cycleMonth);
  const paidAmount = roundMoney(cyclePayments.reduce((sum, item) => sum + toSafeNumber(item.amount, 0), 0));
  const currentDue = roundMoney(toSafeNumber(statement.currentDue, 0));
  const nextDue = roundMoney(toSafeNumber(statement.nextDue, 0));
  const appliedToCurrent = roundMoney(Math.min(paidAmount, currentDue));
  const remainingCurrent = roundMoney(Math.max(0, currentDue - paidAmount));
  const surplus = roundMoney(Math.max(0, paidAmount - currentDue));
  const remainingNext = roundMoney(Math.max(0, nextDue - surplus));
  const allPaid = roundMoney(
    payments
      .filter((payment) => payment.accountId === accountId)
      .reduce((sum, item) => sum + toSafeNumber(item.amount, 0), 0)
  );

  const items = [...(statement.currentItems || [])].sort((a, b) =>
    String(a.purchaseDate || "").localeCompare(String(b.purchaseDate || ""))
  );

  let pool = appliedToCurrent;
  const allocations = items.map((item, index) => {
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
  const settled = remainingCurrent <= 0.01;

  return {
    cycleMonth,
    cyclePayments,
    paidAmount,
    appliedToCurrent,
    remainingCurrent,
    surplus,
    remainingNext,
    settled,
    allocations,
    allocationById,
    displayBalance: roundMoney(Math.max(0, toSafeNumber(statement.currentBalance, 0) - allPaid)),
    displayCurrentDue: remainingCurrent,
    displayNextDue: remainingNext,
  };
}

/** Aplica abonos por ciclo y cascada el sobrante a los cortes siguientes. */
export function applyPaymentsToProjections(cycles = [], payments = [], accountId) {
  let carry = 0;

  return cycles.map((cycle) => {
    const tagged = paymentsForCycle(payments, accountId, cycle.monthKey);
    const taggedAmount = roundMoney(tagged.reduce((sum, item) => sum + toSafeNumber(item.amount, 0), 0));
    const available = roundMoney(taggedAmount + carry);
    const gross = roundMoney(toSafeNumber(cycle.total, 0));
    const applied = roundMoney(Math.min(gross, available));
    const remaining = roundMoney(Math.max(0, gross - available));
    carry = roundMoney(Math.max(0, available - gross));
    const settled = gross > 0 && remaining <= 0.01;

    const items = [...(cycle.items || [])].sort((a, b) =>
      String(a.purchaseDate || "").localeCompare(String(b.purchaseDate || ""))
    );
    let pool = applied;
    const allocatedItems = items.map((item, index) => {
      const charge = roundMoney(toSafeNumber(item.amount, 0));
      const paid = roundMoney(Math.min(charge, Math.max(0, pool)));
      pool = roundMoney(pool - paid);
      const fullyPaid = charge > 0 && paid >= charge - 0.009;
      return {
        ...item,
        allocation: {
          key: `${item.id}-${item.label || index}`,
          charge,
          applied: paid,
          remaining: roundMoney(Math.max(0, charge - paid)),
          fullyPaid,
          partial: paid > 0.009 && !fullyPaid,
        },
      };
    });

    return {
      ...cycle,
      items: allocatedItems,
      gross,
      paidAmount: applied,
      carryIn: roundMoney(available - taggedAmount),
      surplus: carry,
      total: remaining,
      settled,
    };
  });
}
