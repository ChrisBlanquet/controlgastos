import { useState } from "react";
import { Check, FastForward, MoreHorizontal, Pencil, Sparkles, Trash2 } from "lucide-react";
import { getCategoryColor, getCategoryIcon, resolveCategory } from "../../constants/categories";
import { formatExpenseDate, paidInstallments } from "../../utils/expenses";
import { formatMXN } from "../../utils/money";

export default function ExpenseItem({
  expense,
  account,
  categories,
  onEdit,
  onAdvance,
  onToggleStatus,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const category = resolveCategory(expense.category, categories);
  const Icon = getCategoryIcon(category.icon);
  const tone = getCategoryColor(category.color);
  const paid = paidInstallments(expense);
  const total = Math.max(1, Number(expense.totalInstallments) || 1);
  const progress = Math.min(100, (paid / total) * 100);
  const isPaid = expense.status === "paid" || expense.remainingInstallments <= 0;

  return (
    <article className="relative rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur">
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
            <div className="text-right">
              <p className="text-sm font-semibold text-white">{formatMXN(expense.totalAmount)}</p>
              {expense.cashbackEarned > 0 ? (
                <p className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-400">
                  <Sparkles className="h-3 w-3" />
                  + {formatMXN(expense.cashbackEarned)}
                </p>
              ) : null}
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

          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                isPaid ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-200"
              }`}
            >
              {isPaid ? "Pagada" : "Pendiente"}
            </span>
            {expense.isMsi && !isPaid ? (
              <button
                type="button"
                onClick={() => onAdvance(expense)}
                className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-200"
              >
                <FastForward className="h-3 w-3" />
                Adelantar
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onToggleStatus(expense)}
              className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-200"
            >
              <Check className="h-3 w-3" />
              {isPaid ? "Pendiente" : "Pagada"}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-xl p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          aria-label="Acciones"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {menuOpen ? (
        <div className="absolute right-3 top-12 z-10 w-40 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
          <MenuButton icon={Pencil} label="Editar" onClick={() => { setMenuOpen(false); onEdit(expense); }} />
          {expense.isMsi && !isPaid ? (
            <MenuButton icon={FastForward} label="Adelantar" onClick={() => { setMenuOpen(false); onAdvance(expense); }} />
          ) : null}
          <MenuButton
            icon={Trash2}
            label="Eliminar"
            danger
            onClick={() => { setMenuOpen(false); onDelete(expense); }}
          />
        </div>
      ) : null}
    </article>
  );
}

function MenuButton({ icon: Icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm ${
        danger ? "text-rose-400" : "text-slate-200"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
