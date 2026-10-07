import { FastForward, Lock, MoreVertical, ReceiptText } from "lucide-react";
import { CategoryAccordionList } from "../expenses/CategoryAccordionItem";
import { formatExpenseDate } from "../../utils/expenses";
import { formatMXN } from "../../utils/money";

export default function StatementItemList({
  items,
  expensesById,
  allocationById,
  settled = false,
  loading,
  emptyText,
  groupMode = "none",
  groups = [],
  categories = [],
  onAdvance,
  onOpenActions,
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-900" />
        <div className="h-24 animate-pulse rounded-2xl bg-slate-900" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-12 text-center">
        <ReceiptText className="mb-3 h-8 w-8 text-slate-500" />
        <p className="text-sm font-semibold text-white">Sin movimientos</p>
        <p className="mt-1 text-xs text-slate-400">{emptyText}</p>
      </div>
    );
  }

  if (groupMode === "category") {
    return (
      <CategoryAccordionList groups={groups} categories={categories}>
        {(group) =>
          group.items.map((item, index) => (
            <StatementRow
              key={`${item.id}-${item.label}-${index}`}
              item={item}
              expense={expensesById[item.id]}
              allocation={item.allocation || allocationById?.[item.id]}
              settled={settled}
              onAdvance={onAdvance}
              onOpenActions={onOpenActions}
            />
          ))
        }
      </CategoryAccordionList>
    );
  }

  return (
    <ul className="space-y-2.5">
      {items.map((item, index) => (
        <StatementRow
          key={`${item.id}-${item.label}-${index}`}
          item={item}
          expense={expensesById[item.id]}
          allocation={item.allocation || allocationById?.[item.id]}
          settled={settled}
          onAdvance={onAdvance}
          onOpenActions={onOpenActions}
        />
      ))}
    </ul>
  );
}

function StatementRow({ item, expense, allocation, settled, onAdvance, onOpenActions }) {
  const locked = settled;
  const paid = locked || allocation?.fullyPaid;
  const partial = allocation?.partial && !paid;
  const canManage = Boolean(expense);

  function openActions(event) {
    event?.stopPropagation?.();
    if (!expense) return;
    onOpenActions?.(expense, item.amount);
  }

  return (
    <li
      className={`list-none rounded-2xl border border-slate-800 bg-slate-900/60 px-3.5 py-3 transition-colors ${
        canManage ? "cursor-pointer hover:bg-slate-800/60" : ""
      }`}
      onClick={canManage ? openActions : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{item.title}</p>
          <p className="truncate text-[11px] text-slate-400">
            {formatExpenseDate(item.purchaseDate)}
            {item.kind === "msi" ? ` · Mes ${item.installment} de ${item.totalInstallments}` : " · Contado"}
          </p>
        </div>
        <div className="flex shrink-0 items-start gap-1">
          <p className="text-sm font-semibold text-white">{formatMXN(item.amount)}</p>
          {canManage ? (
            <button
              type="button"
              onClick={openActions}
              className="rounded-xl p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="Más acciones"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            paid ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-200"
          }`}
        >
          {paid ? <Lock className="h-3 w-3" /> : null}
          {paid ? "Pagado" : "En este corte"}
        </span>
        {partial ? (
          <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
            Parcial: {formatMXN(allocation.applied)} / {formatMXN(allocation.charge)}
          </span>
        ) : null}
        {item.isLast ? (
          <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
            Último pago
          </span>
        ) : null}
        {expense?.isMsi && expense.remainingInstallments > 0 && !locked ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAdvance?.(expense);
            }}
            className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-200"
          >
            <FastForward className="h-3 w-3" />
            Adelantar
          </button>
        ) : null}
      </div>
      {partial ? (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-amber-400 transition-all duration-500"
            style={{ width: `${Math.min(100, (allocation.applied / Math.max(allocation.charge, 0.01)) * 100)}%` }}
          />
        </div>
      ) : null}
    </li>
  );
}
