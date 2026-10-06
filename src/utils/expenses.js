import { roundMoney, toSafeNumber } from "./numbers";

export function calcMonthlyPayment(totalAmount, totalInstallments) {
  const total = toSafeNumber(totalAmount, 0);
  const installments = Math.max(1, toSafeNumber(totalInstallments, 1));
  return roundMoney(total / installments);
}

export function remainingDebt(expense) {
  return roundMoney(
    toSafeNumber(expense.remainingInstallments, 0) * toSafeNumber(expense.monthlyPayment, 0)
  );
}

export function paidInstallments(expense) {
  const total = Math.max(1, toSafeNumber(expense.totalInstallments, 1));
  const remaining = Math.max(0, toSafeNumber(expense.remainingInstallments, 0));
  return Math.max(0, total - remaining);
}

export function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function formatExpenseDate(value) {
  if (!value) return "Sin fecha";
  const [year, month, day] = String(value).split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatMonthLabel(value) {
  const [year, month] = String(value).split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, 1);
  const label = new Intl.DateTimeFormat("es-MX", {
    month: "long",
    year: "numeric",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function shiftMonth(value, delta) {
  const [year, month] = String(value || currentMonthValue()).split("-").map(Number);
  const date = new Date(year, (month || 1) - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function matchesMonth(purchaseDate, monthValue) {
  return String(purchaseDate || "").slice(0, 7) === monthValue;
}
