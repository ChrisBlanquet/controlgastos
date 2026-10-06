import { toSafeNumber } from "./numbers";

export function incomeDocId(monthYear) {
  return `inc_${String(monthYear).replace("-", "_")}`;
}

export function incomeTotal(income) {
  if (!income) return 0;
  const total = toSafeNumber(income.totalIncome, 0);
  if (total > 0) return total;
  const combined = toSafeNumber(income.baseSalary, 0) + toSafeNumber(income.extraIncome, 0);
  if (combined > 0) return combined;
  return toSafeNumber(income.amount, 0);
}

export function incomeHealth(totalIncome, commitments) {
  const income = toSafeNumber(totalIncome, 0);
  const due = toSafeNumber(commitments, 0);
  const remaining = income - due;
  const used = income > 0 ? due / income : due > 0 ? 2 : 0;

  if (!income && due > 0) {
    return { tone: "red", remaining, used, label: "Sin sueldo registrado y ya hay compromisos" };
  }

  if (due > income && income > 0) {
    return { tone: "red", remaining, used, label: "Los compromisos superan el sueldo del mes" };
  }

  if (used >= 0.75) {
    return { tone: "yellow", remaining, used, label: "Los pagos ya se comen casi todo el sueldo" };
  }

  return { tone: "green", remaining, used, label: "Queda más del 25% libre para vivir o ahorrar" };
}
