import { Plus, SlidersHorizontal, Wallet } from "lucide-react";
import CardList from "../components/cards/CardList";
import DesktopFilterBar from "../components/expenses/DesktopFilterBar";
import ExpenseList from "../components/expenses/ExpenseList";
import IncomeCard from "../components/incomes/IncomeCard";
import MonthNav from "../components/ui/MonthNav";
import { formatMXN } from "../utils/money";

export default function HomeView({
  month,
  onMonthChange,
  metrics,
  income,
  due,
  onSaveIncome,
  accounts,
  accountsLoading,
  accountsError,
  onAddCard,
  onSelectCard,
  categories,
  filters,
  onFiltersChange,
  activeFilterCount,
  onOpenFilters,
  expenses,
  expensesLoading,
  expensesError,
  expenseActions,
  onResetFilters,
  onAddExpense,
}) {
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-6xl gap-6 xl:grid-cols-[36%_64%]">
      <section className="min-w-0">
        <div className="grid grid-cols-2 gap-3">
          <article className="rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/15 to-slate-900 p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-rose-200/80">Deuda total en tarjetas</p>
            <p className="mt-1 text-lg font-semibold text-white">{formatMXN(metrics.totalDebt)}</p>
          </article>
          <article className="rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/15 to-slate-900 p-3.5">
            <div className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-emerald-200/80">
              <Wallet className="h-3 w-3" />
              Límite disponible
            </div>
            <p className="mt-1 text-lg font-semibold text-white">{formatMXN(metrics.totalAvailable)}</p>
          </article>
        </div>

        <div className="mt-4">
          <IncomeCard month={month} income={income} due={due} onSave={onSaveIncome} />
        </div>

        <div className="mt-5 mb-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-white">Tus tarjetas</h2>
            <p className="truncate text-xs text-slate-400">Toca una para ver su detalle</p>
          </div>
          <button
            type="button"
            onClick={onAddCard}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-300"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar
          </button>
        </div>

        {accountsLoading ? (
          <div className="h-44 animate-pulse rounded-3xl bg-slate-900" />
        ) : (
          <CardList accounts={accounts} onSelect={onSelectCard} />
        )}
        {accountsError ? <p className="mt-3 text-sm text-rose-300">{accountsError}</p> : null}
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur md:p-5">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Movimientos</h2>
            <p className="text-xs text-slate-400">Actividad reciente de todas tus tarjetas</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenFilters}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-100 md:hidden"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {activeFilterCount ? `Filtros (${activeFilterCount})` : "Filtros"}
              {activeFilterCount ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> : null}
            </button>
            <button
              type="button"
              onClick={onAddExpense}
              className="hidden rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-950 md:inline-flex"
            >
              Registrar
            </button>
          </div>
        </div>

        <div className="mb-4">
          <MonthNav value={month} onChange={onMonthChange} />
        </div>

        <div className="mb-4">
          <DesktopFilterBar
            accounts={accounts}
            categories={categories}
            filters={filters}
            onChange={onFiltersChange}
          />
        </div>

        {expensesError ? <p className="mb-3 text-sm text-rose-300">{expensesError}</p> : null}

        <ExpenseList
          expenses={expenses}
          accounts={accounts}
          categories={categories}
          loading={expensesLoading}
          emptyText={
            activeFilterCount
              ? "No se encontraron movimientos con estos filtros"
              : "No hay movimientos en este mes."
          }
          emptyAction={
            activeFilterCount
              ? { label: "Quitar filtros", onClick: onResetFilters }
              : undefined
          }
          {...expenseActions}
        />
      </section>
    </div>
  );
}
