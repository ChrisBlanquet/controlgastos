import {
  addCalendarDays,
  firstCutoffForPurchase,
  getCardCycle,
  getPaymentDueDate,
  parseLocalDate,
  shiftCutoffDate,
  startOfDay,
} from "./cardDates";
import { formatMonthLabel, paidInstallments, remainingDebt } from "./expenses";
import { roundMoney, toSafeNumber } from "./numbers";
import { cycleMonthFromDate } from "./payments";
import { isExpensePaid } from "./projections";

export function includesCutoffDayInCycle(card) {
  return card?.includeCutoffDayInCycle === true;
}

export function firstStatementCutoff(purchaseDate, cutoffDay, includeCutoffDay = false) {
  return firstCutoffForPurchase(purchaseDate, cutoffDay, includeCutoffDay);
}

function inOpenCycle(purchaseDate, currentCutoff, includeCutoffDay) {
  return includeCutoffDay ? purchaseDate > currentCutoff : purchaseDate >= currentCutoff;
}

export function msiSlotForCutoff(expense, statementCutoff, cutoffDay, includeCutoffDay = false, options = {}) {
  if (!expense.isMsi) return null;
  const scheduledOnly = options.scheduledOnly === true;
  if (!scheduledOnly && isExpensePaid(expense)) return null;

  const purchaseDate = parseLocalDate(expense.purchaseDate);
  if (!purchaseDate) return null;

  const firstCutoff = firstStatementCutoff(purchaseDate, cutoffDay, includeCutoffDay);
  const monthsFromFirst =
    (statementCutoff.getFullYear() - firstCutoff.getFullYear()) * 12 +
    (statementCutoff.getMonth() - firstCutoff.getMonth());

  if (monthsFromFirst < 0) return null;

  const installment = monthsFromFirst + 1;
  const total = Math.max(1, toSafeNumber(expense.totalInstallments, 1));
  const paid = paidInstallments(expense);
  const inPlan = scheduledOnly
    ? installment >= 1 && installment <= total
    : installment > paid && installment <= total;

  if (!inPlan) return null;

  return {
    amount: toSafeNumber(expense.monthlyPayment, 0),
    installment,
    total,
    isLast: installment >= total,
  };
}

export function msiInstallmentForCutoff(expense, statementCutoff, cutoffDay, includeCutoffDay = false) {
  return msiSlotForCutoff(expense, statementCutoff, cutoffDay, includeCutoffDay)?.amount ?? 0;
}

export function expenseOutstanding(expenses = [], accountId) {
  return roundMoney(
    expenses
      .filter((expense) => !accountId || expense.accountId === accountId)
      .reduce((sum, expense) => sum + remainingDebt(expense), 0)
  );
}

/** Saldo visible: movimientos pendientes menos abonos, nunca el currentBalance congelado. */
export function resolveAccountBalance(account, expenses = [], payments = []) {
  const cardExpenses = expenses.filter((expense) => expense.accountId === account.id);
  if (!cardExpenses.length) return roundMoney(toSafeNumber(account.currentBalance, 0));
  const statement = calculateCardBalances(account, expenses);
  const paid = payments
    .filter((payment) => payment.accountId === account.id)
    .reduce((sum, payment) => sum + toSafeNumber(payment.amount, 0), 0);
  return roundMoney(Math.max(0, statement.currentBalance - paid));
}

function lineItem(expense, amount, extra = {}) {
  return {
    id: expense.id,
    title: expense.title || "Movimiento",
    amount: roundMoney(amount),
    purchaseDate: expense.purchaseDate,
    ...extra,
  };
}

/**
 * Totales por ciclo de corte (Nu/Klar): no usa mes calendario ni el saldo
 * guardado en la tarjeta si ya hay movimientos, para no duplicar.
 *
 * Este corte (Nu): contado con previousCutoff <= fecha < día de corte
 * (el día 4 a las 00:00 ya es del ciclo siguiente).
 * Próximo corte: contado >= día de corte + siguiente cuota MSI.
 * Saldo = este corte + MSI a futuro + compras nuevas.
 */
export function calculateCardBalances(card, expenses = [], from = new Date()) {
  const includeCutoffDay = includesCutoffDayInCycle(card);
  const cutoffDay = card.cutoffDay;
  const cycle = getCardCycle(cutoffDay, card.paymentDueDays, from);
  const today = startOfDay(from);
  const lastCutoff = cycle.lastCutoff;
  const nextCutoff = cycle.nextCutoff;
  const previousCutoff = shiftCutoffDate(lastCutoff, cutoffDay, -1);
  const periodStart = previousCutoff;
  const paymentDue = cycle.lastPaymentDue;
  const cycleMonth = cycleMonthFromDate(lastCutoff);

  const cardExpenses = expenses.filter((expense) => expense.accountId === card.id);
  const currentItems = [];
  const nextItems = [];

  let billedCash = 0;
  let newPurchases = 0;
  let thisMsi = 0;
  let nextMsi = 0;
  let remainingMsi = 0;

  cardExpenses.forEach((expense) => {
    const purchaseDate = parseLocalDate(expense.purchaseDate);
    if (!purchaseDate) return;

    if (expense.isMsi) {
      if (!isExpensePaid(expense)) remainingMsi += remainingDebt(expense);

      const thisSlot = msiSlotForCutoff(expense, lastCutoff, cutoffDay, includeCutoffDay);
      if (thisSlot) {
        thisMsi += thisSlot.amount;
        currentItems.push(
          lineItem(expense, thisSlot.amount, {
            kind: "msi",
            label: `${expense.title} · Mes ${thisSlot.installment} de ${thisSlot.total}`,
            isLast: thisSlot.isLast,
            installment: thisSlot.installment,
            totalInstallments: thisSlot.total,
          })
        );
      }

      const nextSlot = msiSlotForCutoff(expense, nextCutoff, cutoffDay, includeCutoffDay);
      if (nextSlot) {
        nextMsi += nextSlot.amount;
        nextItems.push(
          lineItem(expense, nextSlot.amount, {
            kind: "msi",
            label: `${expense.title} · Mes ${nextSlot.installment} de ${nextSlot.total}`,
            isLast: nextSlot.isLast,
            installment: nextSlot.installment,
            totalInstallments: nextSlot.total,
          })
        );
      }

      if (expense.advancedCycle === cycleMonth) {
        const extra = roundMoney(toSafeNumber(expense.advancedCount, 0) * toSafeNumber(expense.monthlyPayment, 0));
        if (extra > 0) {
          thisMsi += extra;
          currentItems.push(
            lineItem(expense, extra, {
              kind: "msi",
              label: `${expense.title} · Adelanto MSI`,
              isLast: false,
              installment: paidInstallments(expense),
              totalInstallments: expense.totalInstallments,
            })
          );
        }
      }
      return;
    }

    if (isExpensePaid(expense)) return;

    const amount = toSafeNumber(expense.totalAmount, 0);
    if (cashInStatementWindow(purchaseDate, previousCutoff, lastCutoff, includeCutoffDay)) {
      billedCash += amount;
      currentItems.push(
        lineItem(expense, amount, {
          kind: "cash",
          label: `${expense.title} · Contado`,
        })
      );
    } else if (inOpenCycle(purchaseDate, lastCutoff, includeCutoffDay)) {
      newPurchases += amount;
      nextItems.push(
        lineItem(expense, amount, {
          kind: "cash",
          label: `${expense.title} · Contado`,
        })
      );
    }
  });

  billedCash = roundMoney(billedCash);
  newPurchases = roundMoney(newPurchases);
  thisMsi = roundMoney(thisMsi);
  nextMsi = roundMoney(nextMsi);
  remainingMsi = roundMoney(remainingMsi);

  const currentDue = roundMoney(billedCash + thisMsi);
  const nextDue = roundMoney(newPurchases + nextMsi);
  const futureMsi = roundMoney(Math.max(0, remainingMsi - thisMsi));
  const hasLedger = cardExpenses.length > 0;
  const currentBalance = hasLedger
    ? roundMoney(currentDue + futureMsi + newPurchases)
    : roundMoney(toSafeNumber(card.currentBalance, 0));

  currentItems.sort((a, b) => b.amount - a.amount);
  nextItems.sort((a, b) => b.amount - a.amount);

  return {
    cycle,
    lastCutoff,
    nextCutoff,
    previousCutoff,
    periodStart,
    paymentDue,
    overdue: today > paymentDue,
    cycleMonth,
    currentBalance,
    currentDue,
    currentCash: billedCash,
    currentMsi: thisMsi,
    currentItems,
    nextDue,
    nextCash: newPurchases,
    nextMsi,
    nextItems,
    remainingMsi,
    futureMsi,
    unexplained: 0,
  };
}

export function getCardStatementSummary(account, expenses = [], from = new Date()) {
  return calculateCardBalances(account, expenses, from);
}

export function cashInStatementWindow(purchaseDate, previousCutoff, statementCutoff, includeCutoffDay) {
  if (includeCutoffDay) {
    return purchaseDate > previousCutoff && purchaseDate <= statementCutoff;
  }
  return purchaseDate >= previousCutoff && purchaseDate < statementCutoff;
}

export function statementItemsForCutoff(card, expenses = [], statementCutoff) {
  const includeCutoffDay = includesCutoffDayInCycle(card);
  const cutoffDay = card.cutoffDay;
  const previousCutoff = shiftCutoffDate(statementCutoff, cutoffDay, -1);
  const monthKey = `${statementCutoff.getFullYear()}-${String(statementCutoff.getMonth() + 1).padStart(2, "0")}`;
  const items = [];

  expenses
    .filter((expense) => expense.accountId === card.id)
    .forEach((expense) => {
      const purchaseDate = parseLocalDate(expense.purchaseDate);
      if (!purchaseDate) return;

      if (expense.isMsi) {
        const slot = msiSlotForCutoff(expense, statementCutoff, cutoffDay, includeCutoffDay, {
          scheduledOnly: true,
        });
        if (slot) {
          items.push(
            lineItem(expense, slot.amount, {
              kind: "msi",
              label: `${expense.title} · Mes ${slot.installment} de ${slot.total}`,
              isLast: slot.isLast,
              installment: slot.installment,
              totalInstallments: slot.total,
            })
          );
        }
        if (expense.advancedCycle === monthKey) {
          const extra = roundMoney(toSafeNumber(expense.advancedCount, 0) * toSafeNumber(expense.monthlyPayment, 0));
          if (extra > 0) {
            items.push(
              lineItem(expense, extra, {
                kind: "msi",
                label: `${expense.title} · Adelanto MSI`,
                isLast: false,
                installment: paidInstallments(expense),
                totalInstallments: expense.totalInstallments,
              })
            );
          }
        }
        return;
      }

      if (!cashInStatementWindow(purchaseDate, previousCutoff, statementCutoff, includeCutoffDay)) return;

      items.push(
        lineItem(expense, toSafeNumber(expense.totalAmount, 0), {
          kind: "cash",
          label: `${expense.title} · Contado`,
        })
      );
    });

  return items;
}

export function getStatementWindow(card, statementCutoff) {
  const includeCutoffDay = includesCutoffDayInCycle(card);
  const previousCutoff = shiftCutoffDate(statementCutoff, card.cutoffDay, -1);
  if (includeCutoffDay) {
    return {
      previousCutoff,
      start: addCalendarDays(previousCutoff, 1),
      end: statementCutoff,
    };
  }
  return {
    previousCutoff,
    start: previousCutoff,
    end: addCalendarDays(statementCutoff, -1),
  };
}

function monthsBetweenCutoffs(fromCutoff, toCutoff) {
  return (
    (toCutoff.getFullYear() - fromCutoff.getFullYear()) * 12 +
    (toCutoff.getMonth() - fromCutoff.getMonth())
  );
}

export function lastCommitmentCycleIndex(card, expenses = [], from = new Date()) {
  const cutoffDay = card.cutoffDay;
  const includeCutoffDay = includesCutoffDayInCycle(card);
  const baseCutoff = getCardCycle(cutoffDay, card.paymentDueDays, from).lastCutoff;
  let lastIndex = -1;

  expenses
    .filter((expense) => expense.accountId === card.id && !isExpensePaid(expense))
    .forEach((expense) => {
      const purchaseDate = parseLocalDate(expense.purchaseDate);
      if (!purchaseDate) return;

      if (expense.isMsi) {
        const remaining = toSafeNumber(expense.remainingInstallments, 0);
        if (remaining <= 0) return;
        const firstCutoff = firstStatementCutoff(purchaseDate, cutoffDay, includeCutoffDay);
        const total = Math.max(1, toSafeNumber(expense.totalInstallments, 1));
        const lastInstallmentCutoff = shiftCutoffDate(firstCutoff, cutoffDay, total - 1);
        lastIndex = Math.max(lastIndex, monthsBetweenCutoffs(baseCutoff, lastInstallmentCutoff));
        return;
      }

      const statementCutoff = firstStatementCutoff(purchaseDate, cutoffDay, includeCutoffDay);
      lastIndex = Math.max(lastIndex, monthsBetweenCutoffs(baseCutoff, statementCutoff));
    });

  return lastIndex;
}

export function projectCardCycles(card, expenses = [], horizon = "active", from = new Date()) {
  const cutoffDay = card.cutoffDay;
  const includeCutoffDay = includesCutoffDayInCycle(card);
  const cycle = getCardCycle(cutoffDay, card.paymentDueDays, from);
  const cardExpenses = expenses.filter((expense) => expense.accountId === card.id);
  const lastIndex = lastCommitmentCycleIndex(card, expenses, from);
  const requested = horizon === "active" ? lastIndex + 1 : Math.max(1, Number(horizon) || 3);
  const months = Math.max(0, Math.min(requested, lastIndex + 1));

  const rows = Array.from({ length: months }, (_, index) => {
    const statementCutoff = shiftCutoffDate(cycle.lastCutoff, cutoffDay, index);
    const previousCutoff = shiftCutoffDate(statementCutoff, cutoffDay, -1);
    const paymentDue = getPaymentDueDate(statementCutoff, card.paymentDueDays);
    const items = [];

    cardExpenses.forEach((expense) => {
      const purchaseDate = parseLocalDate(expense.purchaseDate);
      if (!purchaseDate) return;

      if (expense.isMsi) {
        const slot = msiSlotForCutoff(expense, statementCutoff, cutoffDay, includeCutoffDay);
        if (slot) {
          items.push(
            lineItem(expense, slot.amount, {
              kind: "msi",
              label: `${expense.title} · Mes ${slot.installment} de ${slot.total}`,
              isLast: slot.isLast,
              installment: slot.installment,
              totalInstallments: slot.total,
            })
          );
        }
        const monthKey = `${statementCutoff.getFullYear()}-${String(statementCutoff.getMonth() + 1).padStart(2, "0")}`;
        if (expense.advancedCycle === monthKey) {
          const extra = roundMoney(toSafeNumber(expense.advancedCount, 0) * toSafeNumber(expense.monthlyPayment, 0));
          if (extra > 0) {
            items.push(
              lineItem(expense, extra, {
                kind: "msi",
                label: `${expense.title} · Adelanto MSI`,
                isLast: false,
                installment: paidInstallments(expense),
                totalInstallments: expense.totalInstallments,
              })
            );
          }
        }
        return;
      }

      if (isExpensePaid(expense)) return;
      if (!cashInStatementWindow(purchaseDate, previousCutoff, statementCutoff, includeCutoffDay)) return;

      items.push(
        lineItem(expense, toSafeNumber(expense.totalAmount, 0), {
          kind: "cash",
          label: `${expense.title} · Contado`,
        })
      );
    });

    items.sort((a, b) => b.amount - a.amount);
    const total = roundMoney(items.reduce((sum, item) => sum + item.amount, 0));
    const monthKey = `${statementCutoff.getFullYear()}-${String(statementCutoff.getMonth() + 1).padStart(2, "0")}`;

    return {
      index,
      statementCutoff,
      previousCutoff,
      paymentDue,
      monthKey,
      label: formatMonthLabel(monthKey),
      total,
      items,
      lastPaymentCount: items.filter((item) => item.isLast).length,
    };
  });

  if (horizon === "active") return rows.filter((row) => row.total > 0);
  return rows;
}
