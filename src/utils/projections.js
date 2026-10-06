import { formatMonthLabel, remainingDebt, shiftMonth } from "./expenses";
import { roundMoney, toSafeNumber } from "./numbers";
import { resolveCategory } from "../constants/categories";

export function monthToIndex(value) {
  const [year, month] = String(value).split("-").map(Number);
  return year * 12 + ((month || 1) - 1);
}

export function isExpensePaid(expense) {
  return expense.status === "paid" || toSafeNumber(expense.remainingInstallments, 0) <= 0;
}

export function msiPaymentInMonth(expense, monthValue) {
  if (!expense.isMsi || isExpensePaid(expense)) return 0;

  const purchaseMonth = String(expense.purchaseDate || "").slice(0, 7);
  if (!purchaseMonth) return 0;

  const remaining = toSafeNumber(expense.remainingInstallments, 0);
  const total = Math.max(1, toSafeNumber(expense.totalInstallments, 1));
  const paid = Math.max(0, total - remaining);
  const start = monthToIndex(purchaseMonth) + paid;
  const current = monthToIndex(monthValue);

  if (current >= start && current < start + remaining) {
    return toSafeNumber(expense.monthlyPayment, 0);
  }

  return 0;
}

export function cashChargeInMonth(expense, monthValue) {
  if (expense.isMsi) return 0;
  if (String(expense.purchaseDate || "").slice(0, 7) !== monthValue) return 0;
  return toSafeNumber(expense.totalAmount, 0);
}

export function loanStartMonth(loan) {
  const created = loan.createdAt?.toDate?.() || (loan.createdAt ? new Date(loan.createdAt) : null);
  if (created && !Number.isNaN(created.getTime())) {
    return `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
  }
  return null;
}

export function loanPaymentInMonth(loan, monthValue) {
  if (loan.status === "paid" || toSafeNumber(loan.remainingInstallments, 0) <= 0) return 0;

  const remaining = toSafeNumber(loan.remainingInstallments, 0);
  const total = Math.max(1, toSafeNumber(loan.totalInstallments, remaining));
  const paid = Math.max(0, total - remaining);
  const startMonth = loanStartMonth(loan) || monthValue;
  const start = monthToIndex(startMonth) + paid;
  const current = monthToIndex(monthValue);

  if (current >= start && current < start + remaining) {
    return toSafeNumber(loan.monthlyPayment, 0);
  }

  return 0;
}

export function dueInMonth(expenses, monthValue, loans = []) {
  const fromCards = expenses.reduce(
    (sum, expense) =>
      sum + cashChargeInMonth(expense, monthValue) + msiPaymentInMonth(expense, monthValue),
    0
  );
  const fromLoans = loans.reduce((sum, loan) => sum + loanPaymentInMonth(loan, monthValue), 0);
  return roundMoney(fromCards + fromLoans);
}

export function paymentsByAccount(expenses, accounts, monthValue) {
  return accounts
    .map((account) => {
      const items = expenses.filter((expense) => expense.accountId === account.id);
      const cash = roundMoney(
        items.reduce((sum, expense) => sum + cashChargeInMonth(expense, monthValue), 0)
      );
      const msi = roundMoney(
        items.reduce((sum, expense) => sum + msiPaymentInMonth(expense, monthValue), 0)
      );
      return {
        account,
        cash,
        msi,
        total: roundMoney(cash + msi),
      };
    })
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);
}

export function msiChargeDetail(expense, monthValue) {
  const amount = msiPaymentInMonth(expense, monthValue);
  if (!amount) return null;

  const remaining = toSafeNumber(expense.remainingInstallments, 0);
  const total = Math.max(1, toSafeNumber(expense.totalInstallments, 1));
  const paid = Math.max(0, total - remaining);
  const purchaseMonth = String(expense.purchaseDate || "").slice(0, 7);
  const start = monthToIndex(purchaseMonth) + paid;
  const current = monthToIndex(monthValue);
  const installment = paid + (current - start) + 1;
  const isLast = installment >= total || current === start + remaining - 1;

  return {
    id: expense.id,
    kind: "msi",
    title: expense.title || "Compra MSI",
    amount,
    installment,
    total,
    isLast,
    label: `${expense.title || "Compra MSI"} - Mes ${installment} de ${total}`,
  };
}

export function cashChargeDetail(expense, monthValue) {
  const amount = cashChargeInMonth(expense, monthValue);
  if (!amount) return null;

  return {
    id: expense.id,
    kind: "cash",
    title: expense.title || "Contado",
    amount,
    installment: 1,
    total: 1,
    isLast: false,
    label: `${expense.title || "Contado"} · Contado`,
  };
}

export function loanChargeDetail(loan, monthValue) {
  const amount = loanPaymentInMonth(loan, monthValue);
  if (!amount) return null;

  const remaining = toSafeNumber(loan.remainingInstallments, 0);
  const total = Math.max(1, toSafeNumber(loan.totalInstallments, remaining));
  const paid = Math.max(0, total - remaining);
  const startMonth = loanStartMonth(loan) || monthValue;
  const start = monthToIndex(startMonth) + paid;
  const current = monthToIndex(monthValue);
  const installment = paid + (current - start) + 1;
  const isLast = installment >= total || current === start + remaining - 1;

  return {
    id: loan.id,
    kind: "loan",
    title: loan.name,
    amount,
    installment,
    total,
    isLast,
    label: `${loan.name} - Mes ${installment} de ${total}`,
  };
}

export function monthBreakdown(expenses, accounts, loans, monthValue) {
  const groups = [];

  accounts.forEach((account) => {
    const items = expenses
      .filter((expense) => expense.accountId === account.id)
      .flatMap((expense) => {
        const rows = [];
        const msi = msiChargeDetail(expense, monthValue);
        const cash = cashChargeDetail(expense, monthValue);
        if (msi) rows.push(msi);
        if (cash) rows.push(cash);
        return rows;
      });

    if (!items.length) return;
    groups.push({
      id: account.id,
      type: "card",
      name: account.name,
      subtitle: account.bank === "otro" ? account.customBank || account.name : account.bank,
      themeColor: account.themeColor,
      bank: account.bank,
      customBank: account.customBank,
      items,
      total: roundMoney(items.reduce((sum, item) => sum + item.amount, 0)),
    });
  });

  const knownIds = new Set(accounts.map((account) => account.id));
  const orphans = expenses
    .filter((expense) => !knownIds.has(expense.accountId))
    .flatMap((expense) => {
      const rows = [];
      const msi = msiChargeDetail(expense, monthValue);
      const cash = cashChargeDetail(expense, monthValue);
      if (msi) rows.push(msi);
      if (cash) rows.push(cash);
      return rows;
    });

  if (orphans.length) {
    groups.push({
      id: "sin-cuenta",
      type: "card",
      name: "Sin tarjeta",
      subtitle: "Sin cuenta",
      items: orphans,
      total: roundMoney(orphans.reduce((sum, item) => sum + item.amount, 0)),
    });
  }

  loans.forEach((loan) => {
    const item = loanChargeDetail(loan, monthValue);
    if (!item) return;
    groups.push({
      id: loan.id,
      type: "loan",
      name: loan.name,
      subtitle: loan.institution,
      items: [item],
      total: item.amount,
    });
  });

  groups.sort((a, b) => b.total - a.total);

  return {
    month: monthValue,
    label: formatMonthLabel(monthValue),
    shortLabel: formatMonthLabel(monthValue).slice(0, 3),
    total: roundMoney(groups.reduce((sum, group) => sum + group.total, 0)),
    groups,
    lastPaymentCount: groups.reduce(
      (count, group) => count + group.items.filter((item) => item.isLast).length,
      0
    ),
  };
}

export function futureProjection(expenses, fromMonth, months = 6, loans = [], accounts = []) {
  return Array.from({ length: months }, (_, index) =>
    monthBreakdown(expenses, accounts, loans, shiftMonth(fromMonth, index))
  );
}

export function totalCashback(expenses) {
  return roundMoney(expenses.reduce((sum, expense) => sum + toSafeNumber(expense.cashbackEarned, 0), 0));
}

export function consolidatedDebt(expenses, accounts, loans = []) {
  const fromMsi = roundMoney(
    expenses
      .filter((expense) => expense.isMsi && !isExpensePaid(expense))
      .reduce((sum, expense) => sum + remainingDebt(expense), 0)
  );
  const fromExpenses = roundMoney(expenses.reduce((sum, expense) => sum + remainingDebt(expense), 0));
  const fromAccounts = roundMoney(
    accounts.reduce((sum, account) => sum + toSafeNumber(account.currentBalance, 0), 0)
  );
  const fromLoans = roundMoney(loans.reduce((sum, loan) => sum + toSafeNumber(loan.currentBalance, 0), 0));
  return {
    fromMsi,
    fromExpenses,
    fromAccounts,
    fromLoans,
    total: roundMoney(fromMsi + fromLoans),
  };
}

export function categoryBreakdown(expenses, categories, monthValue) {
  const totals = new Map();

  expenses
    .filter((expense) => String(expense.purchaseDate || "").slice(0, 7) === monthValue)
    .forEach((expense) => {
      const category = resolveCategory(expense.category, categories);
      const current = totals.get(category.id) || { ...category, amount: 0 };
      current.amount = roundMoney(current.amount + toSafeNumber(expense.totalAmount, 0));
      totals.set(category.id, current);
    });

  const rows = [...totals.values()].sort((a, b) => b.amount - a.amount);
  const total = roundMoney(rows.reduce((sum, row) => sum + row.amount, 0));

  return {
    total,
    rows: rows.map((row) => ({
      ...row,
      percent: total > 0 ? Math.round((row.amount / total) * 100) : 0,
    })),
  };
}

export function msiPayoffMonth(expenses, fromMonth) {
  const maxRemaining = expenses
    .filter((expense) => expense.isMsi && !isExpensePaid(expense))
    .reduce((max, expense) => Math.max(max, toSafeNumber(expense.remainingInstallments, 0)), 0);

  if (maxRemaining <= 0) return null;
  return shiftMonth(fromMonth, maxRemaining - 1);
}
