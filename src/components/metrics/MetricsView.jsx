import { useMemo, useState } from "react";
import { ChevronDown, Gift, Landmark, Lightbulb, PieChart, Sparkles, TrendingUp } from "lucide-react";
import { getCategoryColor, getCategoryIcon } from "../../constants/categories";
import {
  categoryBreakdown,
  consolidatedDebt,
  dueInMonth,
  futureProjection,
  msiPayoffMonth,
  totalCashback,
} from "../../utils/projections";
import { formatMonthLabel } from "../../utils/expenses";
import { formatMXN } from "../../utils/money";
import IncomeCard from "../incomes/IncomeCard";
import MonthNav from "../ui/MonthNav";
import MonthBreakdown from "./MonthBreakdown";
import MonthBreakdownSheet from "./MonthBreakdownSheet";

export default function MetricsView({
  month,
  onMonthChange,
  expenses,
  accounts,
  categories,
  income,
  onSaveIncome,
  loans = [],
}) {
  const [horizon, setHorizon] = useState(6);
  const [openMonth, setOpenMonth] = useState(month);
  const [sheetMonth, setSheetMonth] = useState(null);

  const due = dueInMonth(expenses, month, loans);
  const projection = useMemo(
    () => futureProjection(expenses, month, horizon, loans, accounts),
    [expenses, month, horizon, loans, accounts]
  );
  const debt = consolidatedDebt(expenses, accounts, loans);
  const cashback = totalCashback(expenses);
  const categoriesMonth = categoryBreakdown(expenses, categories, month);
  const payoff = msiPayoffMonth(expenses, month);
  const topCategory = categoriesMonth.rows[0];
  const maxBar = Math.max(...projection.map((item) => item.total), 1);
  const sheetPeriod = projection.find((item) => item.month === sheetMonth) ?? null;

  function toggleMonth(monthValue) {
    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
    if (isMobile) {
      setSheetMonth(monthValue);
      setOpenMonth(monthValue);
      return;
    }
    setOpenMonth((current) => (current === monthValue ? null : monthValue));
  }

  return (
    <div className="view-slide mx-auto w-full max-w-6xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">Métricas y proyecciones</h1>
        <p className="text-sm text-slate-400">Pagos futuros, MSI y en qué se va el dinero</p>
      </div>

      <MonthNav value={month} onChange={onMonthChange} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="min-w-0 space-y-4">
          <IncomeCard month={month} income={income} due={due} onSave={onSaveIncome} />

          <section className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
              <div className="mb-2 flex items-center gap-2 text-rose-200">
                <Landmark className="h-4 w-4" />
                <p className="text-[11px] uppercase tracking-wider">Deuda global consolidada</p>
              </div>
              <p className="text-2xl font-semibold text-white">{formatMXN(debt.total)}</p>
              <p className="mt-1 text-xs text-slate-400">
                MSI {formatMXN(debt.fromMsi)} · Préstamos {formatMXN(debt.fromLoans)}
              </p>
            </article>
            <article className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4">
              <div className="mb-2 flex items-center gap-2 text-emerald-200">
                <Gift className="h-4 w-4" />
                <p className="text-[11px] uppercase tracking-wider">Cashback acumulado</p>
              </div>
              <p className="text-2xl font-semibold text-white">{formatMXN(cashback)}</p>
              <p className="mt-1 text-xs text-emerald-200/80">Dinero devuelto por tus compras</p>
            </article>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
            <div className="mb-3 flex items-center gap-2">
              <PieChart className="h-4 w-4 text-cyan-300" />
              <h2 className="text-base font-semibold text-white">Gastos por categoría</h2>
            </div>
            <p className="mb-3 text-xs text-slate-400">{formatMonthLabel(month)}</p>
            {categoriesMonth.rows.length ? (
              <div className="space-y-3">
                {categoriesMonth.rows.map((row) => {
                  const Icon = getCategoryIcon(row.icon);
                  const tone = getCategoryColor(row.color);
                  return (
                    <div key={row.id}>
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="inline-flex min-w-0 items-center gap-2 text-sm text-white">
                          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="truncate">{row.name}</span>
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-slate-300">
                          {row.percent}% · {formatMXN(row.amount)}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full rounded-full bg-emerald-400/80" style={{ width: `${row.percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Aún no hay gastos categorizados este mes.</p>
            )}
          </section>

          <section className="rounded-3xl border border-indigo-400/20 bg-indigo-400/10 p-4">
            <div className="mb-2 flex items-center gap-2 text-indigo-200">
              <Lightbulb className="h-4 w-4" />
              <h2 className="text-sm font-semibold">Sugerencias de pago</h2>
            </div>
            <ul className="space-y-2 text-sm text-slate-200">
              <li>
                {payoff
                  ? `Si mantienes este ritmo, liquidas tus MSI en ${formatMonthLabel(payoff)}.`
                  : "No tienes MSI pendientes. Buen ritmo."}
              </li>
              <li>
                {topCategory
                  ? `El ${topCategory.percent}% de tus gastos este mes fue en ${topCategory.name}.`
                  : "Cuando registres gastos, te diremos en qué categoría te estás yendo más."}
              </li>
            </ul>
          </section>
        </div>

        <section className="min-w-0 rounded-3xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-300" />
              <h2 className="text-base font-semibold text-white">Proyección consolidada</h2>
            </div>
            <div className="flex rounded-full bg-slate-950 p-1">
              {[6, 12].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setHorizon(value)}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                    horizon === value ? "bg-white text-slate-950" : "text-slate-400"
                  }`}
                >
                  {value} meses
                </button>
              ))}
            </div>
          </div>

          <div className={`mb-4 flex items-end gap-1.5 ${horizon === 12 ? "h-36" : "h-40"}`}>
            {projection.map((item) => {
              const active = openMonth === item.month || sheetMonth === item.month;
              return (
                <button
                  key={`bar-${item.month}`}
                  type="button"
                  onClick={() => toggleMonth(item.month)}
                  className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
                >
                  <p className="w-full truncate text-center text-[9px] font-medium text-slate-400 sm:text-[10px]">
                    {formatMXN(item.total)}
                  </p>
                  <div className="flex h-24 w-full items-end rounded-xl bg-slate-950/80">
                    <div
                      className={`w-full rounded-xl transition-all duration-500 ${
                        active
                          ? "bg-gradient-to-t from-emerald-400 to-cyan-200"
                          : "bg-gradient-to-t from-emerald-500/70 to-cyan-300/70"
                      }`}
                      style={{ height: `${Math.max(8, (item.total / maxBar) * 100)}%` }}
                    />
                  </div>
                  <p className={`text-[9px] font-semibold uppercase sm:text-[10px] ${active ? "text-emerald-300" : "text-slate-500"}`}>
                    {item.shortLabel}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            {projection.map((item) => {
              const open = openMonth === item.month;
              const used = maxBar > 0 ? Math.min(100, (item.total / maxBar) * 100) : 0;
              return (
                <article key={item.month} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
                  <button
                    type="button"
                    onClick={() => toggleMonth(item.month)}
                    className="flex w-full items-center gap-3 px-3 py-3 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-white">{item.label}</p>
                        <p className="shrink-0 text-sm font-semibold text-white">{formatMXN(item.total)}</p>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full rounded-full bg-emerald-400/80 transition-all duration-500" style={{ width: `${used}%` }} />
                      </div>
                      {item.lastPaymentCount ? (
                        <p className="mt-1 text-[11px] text-emerald-300">
                          <Sparkles className="mr-1 inline h-3 w-3" />
                          {item.lastPaymentCount} último{item.lastPaymentCount === 1 ? "" : "s"} pago{item.lastPaymentCount === 1 ? "" : "s"}
                        </p>
                      ) : null}
                    </div>
                    <ChevronDown className={`hidden h-4 w-4 shrink-0 text-slate-500 transition md:block ${open ? "rotate-180" : ""}`} />
                  </button>
                  <div className={`accordion-grid hidden md:grid ${open ? "open" : ""}`}>
                    <div className="min-h-0 overflow-hidden">
                      <div className="border-t border-slate-800 px-3 py-3">
                        <MonthBreakdown groups={item.groups} />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <MonthBreakdownSheet open={Boolean(sheetPeriod)} period={sheetPeriod} onClose={() => setSheetMonth(null)} />
    </div>
  );
}
