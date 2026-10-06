export const DEFAULT_HOME_FILTERS = {
  accountId: null,
  paymentMode: "all",
  status: "all",
  categoryId: null,
};

export function countActiveFilters(filters = DEFAULT_HOME_FILTERS) {
  let count = 0;
  if (filters.accountId) count += 1;
  if (filters.paymentMode && filters.paymentMode !== "all") count += 1;
  if (filters.status && filters.status !== "all") count += 1;
  if (filters.categoryId) count += 1;
  return count;
}

export function matchesHomeFilters(expense, filters, categories) {
  if (filters.accountId && expense.accountId !== filters.accountId) return false;

  if (filters.paymentMode === "msi" && !expense.isMsi) return false;
  if (filters.paymentMode === "contado" && expense.isMsi) return false;

  const paid = expense.status === "paid" || expense.remainingInstallments <= 0;
  if (filters.status === "pending" && paid) return false;
  if (filters.status === "paid" && !paid) return false;

  if (filters.categoryId) {
    const selected = categories.find(
      (item) => item.id === filters.categoryId || item.name === filters.categoryId
    );
    if (
      selected &&
      expense.category !== selected.id &&
      expense.category !== selected.name
    ) {
      return false;
    }
  }

  return true;
}
