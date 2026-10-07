import { Check, FastForward, Lock, MoreVertical, Sparkles } from "lucide-react";
import { getCategoryColor, getCategoryIcon, resolveCategory } from "../../constants/categories";
import { formatExpenseDate, paidInstallments } from "../../utils/expenses";
import { formatMXN } from "../../utils/money";

export default function ExpenseItem({
  expense,
  account,
  categories,
  allocation,
  locked = false,
  onOpenActions,
  onAdvance,
  onToggleStatus,
}) {
  const category = resolveCategory(expense.category, categories);
  const Icon = getCategoryIcon(category.icon);
  const tone = getCategoryColor(category.color);
  const paid = paidInstallments(expense);
  const total = Math.max(1, Number(expense.totalInstallments) || 1);
  const progress = Math.min(100, (paid / total) * 100);
  const isPaid = expense.status === "paid" || expense.remainingInstallments <= 0;
  const cyclePaid = locked || (!expense.isMsi && allocation?.fullyPaid);
  const partial = Boolean(allocation?.partial) && !cyclePaid;

  function openActions(event) {
    event?.stopPropagation?.();
    onOpenActions?.(expense);
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={openActions}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openActions(event);
        }
      }}
      className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur transition-colors hover:bg-slate-800/60"
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${tone.icon}`}>
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{expense.title}</p>
              <p className="truncate text-xs text-slate-400">
                {formatExpenseDate(expense.purchaseDate)}
                {account ? ` · ${account.name}` : ""}
              </p>
            </div>
            <div className="flex items-start gap-1">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{formatMXN(expense.totalAmount)}</p>
                {expense.cashbackEarned > 0 ? (
                  <p className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-400">
                    <Sparkles className="h-3 w-3" />
                    + {formatMXN(expense.cashbackEarned)}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={openActions}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Más acciones"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>

          {expense.isMsi ? (
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="rounded-full bg-indigo-400/15 px-2 py-0.5 font-medium text-indigo-200">
                  {paid} de {total} meses pagados
                </span>
                <span className="text-slate-400">{formatMXN(expense.monthlyPayment)} / mes</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-indigo-400 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-slate-500">Pago de contado</p>
          )}

          {partial ? (
            <div className="mt-3">
              <p className="mb-1 text-[11px] font-semibold text-amber-200">
                Parcial: {formatMXN(allocation.applied)} / {formatMXN(allocation.charge)}
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, (allocation.applied / Math.max(allocation.charge, 0.01)) * 100)}%` }}
                />
              </div>
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                cyclePaid || isPaid ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-200"
              }`}
            >
              {cyclePaid ? <Lock className="h-3 w-3" /> : null}
              {cyclePaid ? "Pagado" : isPaid ? "Pagada" : "Pendiente"}
            </span>
            {expense.isMsi && !isPaid && !locked ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onAdvance(expense);
                }}
                className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-200"
              >
                <FastForward className="h-3 w-3" />
                Adelantar
              </button>
            ) : null}
            {locked ? null : (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleStatus(expense);
                }}
                className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-200"
              >
                <Check className="h-3 w-3" />
                {isPaid ? "Pendiente" : "Pagada"}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
