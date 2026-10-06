import { useMemo, useState } from "react";
import { ArrowLeft, Pencil, Plus, SlidersHorizontal } from "lucide-react";
import { formatShortDate } from "../../utils/cardDates";
import { currentMonthValue, formatMonthLabel, matchesMonth } from "../../utils/expenses";
import { calculateCardBalances } from "../../utils/cardStatement";
import MonthBreakdownModal from "./MonthBreakdownModal";
import PaymentTimeline from "./PaymentTimeline";
import { availableCredit, formatMXN, utilization, utilizationTone } from "../../utils/money";
import ExpenseList from "../expenses/ExpenseList";
import FilterSheet from "../ui/FilterSheet";
import MonthNav from "../ui/MonthNav";
import CreditCardVisual from "./CreditCardVisual";

function applyFeedFilter(expense, filter) {
  if (filter === "msi") return Boolean(expense.isMsi);
  if (filter === "pending") return expense.status !== "paid" && expense.remainingInstallments > 0;
  if (filter === "paid") return expense.status === "paid" || expense.remainingInstallments <= 0;
  return true;
}

export default function CardDetailView({
  account,
  expenses,
  accounts,
  categories,
  loading,
  onBack,
  onEditCard,
  onAddExpense,
  onEditExpense,
  onAdvance,
  onToggleStatus,
  onDelete,
}) {
  const [month, setMonth] = useState(currentMonthValue());
  const [filter, setFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailCycle, setDetailCycle] = useState(null);

  const statement = useMemo(
    () => calculateCardBalances(account, expenses),
    [account, expenses]
  );
  const displayAccount = useMemo(
    () => ({ ...account, currentBalance: statement.currentBalance }),
    [account, statement.currentBalance]
  );
  const used = utilization(displayAccount.currentBalance, account.creditLimit);
  const tone = utilizationTone(used);
  const available = availableCredit(displayAccount.currentBalance, account.creditLimit);
  const currentCycle = useMemo(
    () => ({
      label: formatMonthLabel(
        `${statement.lastCutoff.getFullYear()}-${String(statement.lastCutoff.getMonth() + 1).padStart(2, "0")}`
      ),
      total: statement.currentDue,
      items: statement.currentItems,
    }),
    [statement]
  );
  const nextCycle = useMemo(
    () => ({
      label: formatMonthLabel(
        `${statement.nextCutoff.getFullYear()}-${String(statement.nextCutoff.getMonth() + 1).padStart(2, "0")}`
      ),
      total: statement.nextDue,
      items: statement.nextItems,
    }),
    [statement]
  );

  const feed = useMemo(
    () =>
      expenses.filter(
        (expense) =>
          expense.accountId === account.id &&
          matchesMonth(expense.purchaseDate, month) &&
          applyFeedFilter(expense, filter)
      ),
    [expenses, account.id, month, filter]
  );

  return (
    <div className="view-slide flex min-h-dvh flex-col bg-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-2.5 py-2 text-sm font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{account.name}</p>
            <p className="text-xs text-slate-400">Detalle de la tarjeta</p>
          </div>
          <button
            type="button"
            onClick={onEditCard}
            className="rounded-xl bg-slate-800 p-2 text-slate-200"
            aria-label="Editar tarjeta"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-28 pt-5 lg:max-w-3xl">
        <CreditCardVisual account={displayAccount} selected />

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard
            tone="amber"
            label="Pago para no generar intereses"
            value={formatMXN(statement.currentDue)}
            badge={
              statement.overdue
                ? `Venció el ${formatShortDate(statement.paymentDue)}`
                : `Pagar antes del ${formatShortDate(statement.paymentDue)}`
            }
            hint="Contado + MSI de este corte"
            overdue={statement.overdue}
            onDetail={() => setDetailCycle(currentCycle)}
          />
          <MetricCard
            tone="cyan"
            label="Acumulado próximo corte"
            value={formatMXN(statement.nextDue)}
            badge={`Corte el ${formatShortDate(statement.nextCutoff)}`}
            hint="Compras nuevas + siguiente MSI"
            onDetail={() => setDetailCycle(nextCycle)}
          />
          <MetricCard label="Saldo" value={formatMXN(statement.currentBalance)} hint="Adeudo total calculado" />
          <MetricCard
            label="Disponible"
            value={formatMXN(available)}
            hint={`Utilización ${used.toFixed(0)}%`}
            accent
          />
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
          Saldo total: {formatMXN(statement.currentBalance)}
          {statement.futureMsi > 0 ? ` (incluye ${formatMXN(statement.futureMsi)} en MSI a futuro)` : ""}
          . Este corte {formatMXN(statement.currentDue)} + próximo {formatMXN(statement.nextDue)}
          {statement.futureMsi - statement.nextMsi > 0
            ? ` + MSI posterior ${formatMXN(statement.futureMsi - statement.nextMsi)}`
            : ""}
          .
        </p>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-slate-400">Utilización</span>
            <span className={`font-semibold ${tone.text}`}>{used.toFixed(0)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-700 ${tone.bar}`}
              style={{ width: `${used}%` }}
            />
          </div>
        </div>

        <PaymentTimeline account={account} expenses={expenses} />

        <div className="mt-8 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <MonthNav value={month} onChange={setMonth} />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 text-slate-200"
            aria-label="Filtros"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5">
          <h2 className="mb-3 text-base font-semibold text-white">Movimientos</h2>
          <ExpenseList
            expenses={feed}
            accounts={accounts}
            categories={categories}
            loading={loading}
            emptyText="No hay gastos de esta tarjeta en el mes seleccionado."
            onEdit={onEditExpense}
            onAdvance={onAdvance}
            onToggleStatus={onToggleStatus}
            onDelete={onDelete}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onAddExpense}
        className="fab fixed bottom-6 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/30 lg:right-[calc((100vw-48rem)/2+1.25rem)]"
        aria-label="Nuevo gasto"
      >
        <Plus className="h-7 w-7" />
      </button>

      <MonthBreakdownModal open={Boolean(detailCycle)} cycle={detailCycle} onClose={() => setDetailCycle(null)} />
      <FilterSheet
        open={filtersOpen}
        value={filter}
        onChange={setFilter}
        onClose={() => setFiltersOpen(false)}
      />
    </div>
  );
}

function MetricCard({ tone, label, value, badge, hint, overdue, accent, onDetail }) {
  const tones = {
    amber: {
      card: "border-amber-400/25 from-amber-400/15",
      label: "text-amber-200/90",
      badge: overdue ? "bg-rose-400/15 text-rose-300" : "bg-amber-400/15 text-amber-100",
    },
    cyan: {
      card: "border-cyan-400/20 from-cyan-400/10",
      label: "text-cyan-200/90",
      badge: "bg-cyan-400/15 text-cyan-100",
    },
  };
  const skin = tones[tone] ?? {
    card: "border-slate-800 from-slate-900/40",
    label: "text-slate-500",
    badge: "bg-slate-800 text-slate-300",
  };

  return (
    <article className={`flex h-[8.75rem] flex-col rounded-2xl border bg-gradient-to-br to-slate-900 p-3 ${skin.card}`}>
      <p className={`line-clamp-2 text-[10px] font-semibold uppercase leading-tight tracking-wide ${skin.label}`}>
        {label}
      </p>
      <p className={`mt-1.5 text-base font-semibold ${accent ? "text-emerald-300" : "text-white"}`}>{value}</p>
      {badge ? (
        <span className={`mt-1.5 inline-flex w-fit max-w-full truncate rounded-full px-2 py-0.5 text-[10px] font-semibold ${skin.badge}`}>
          {badge}
        </span>
      ) : (
        <span className="mt-1.5 h-[1.125rem]" />
      )}
      <p className="mt-auto truncate text-[10px] text-slate-400">{hint}</p>
      {onDetail ? (
        <button
          type="button"
          onClick={onDetail}
          className="mt-1 w-fit text-[10px] font-semibold text-emerald-300/90"
        >
          Ver detalle
        </button>
      ) : (
        <span className="mt-1 h-4" />
      )}
    </article>
  );
}
