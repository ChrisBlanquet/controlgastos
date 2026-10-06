import { ReceiptText } from "lucide-react";
import { formatExpenseDate } from "../../utils/expenses";
import ExpenseItem from "./ExpenseItem";

export default function ExpenseList({
  expenses,
  accounts,
  categories,
  loading,
  emptyText = "Registra un gasto, MSI o adelanto para verlo en este feed.",
  emptyAction,
  onEdit,
  onAdvance,
  onToggleStatus,
  onDelete,
}) {
  const grouped = expenses.reduce((groups, expense) => {
    const key = expense.purchaseDate || "sin-fecha";
    groups[key] = groups[key] || [];
    groups[key].push(expense);
    return groups;
  }, {});

  const accountMap = Object.fromEntries(accounts.map((account) => [account.id, account]));

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-900" />
        <div className="h-24 animate-pulse rounded-2xl bg-slate-900" />
      </div>
    );
  }

  if (!expenses.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-12 text-center">
        <ReceiptText className="mb-3 h-8 w-8 text-slate-500" />
        <p className="text-sm font-semibold text-white">Sin movimientos</p>
        <p className="mt-1 text-xs text-slate-400">{emptyText}</p>
        {emptyAction ? (
          <button
            type="button"
            onClick={emptyAction.onClick}
            className="mt-4 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-950"
          >
            {emptyAction.label}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([date, items]) => (
        <section key={date}>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            {date === "sin-fecha" ? "Sin fecha" : formatExpenseDate(date)}
          </p>
          <div className="space-y-2.5">
            {items.map((expense) => (
              <ExpenseItem
                key={expense.id}
                    expense={expense}
                    account={accountMap[expense.accountId]}
                    categories={categories}
                onEdit={onEdit}
                onAdvance={onAdvance}
                onToggleStatus={onToggleStatus}
                onDelete={onDelete}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
