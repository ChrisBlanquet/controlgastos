import { useMemo, useState } from "react";
import { ChevronDown, Gift, Landmark, PieChart, Sparkles, TrendingUp } from "lucide-react";
import { getCategoryColor, getCategoryIcon } from "../../constants/categories";
import {
  categoryBreakdown,
  consolidatedDebt,
  futureProjection,
  totalCashback,
} from "../../utils/projections";
import {
  buildRecommendations,
  commitmentsInCalendarMonth,
  simulatePaymentPlan,
} from "../../utils/decisionCenter";
import { formatMonthLabel } from "../../utils/expenses";
import { incomeTotal } from "../../utils/income";
import { formatMXN } from "../../utils/money";
import { formatShortDate } from "../../utils/cardDates";
import { toSafeNumber } from "../../utils/numbers";
import IncomeCard from "../incomes/IncomeCard";
import MonthNav from "../ui/MonthNav";
import MonthBreakdown from "./MonthBreakdown";
import MonthBreakdownSheet from "./MonthBreakdownSheet";
import PaymentSimulator from "./PaymentSimulator";

const TONES = {
  violet: "border-violet-400/25 from-violet-400/15 text-violet-100",
  rose: "border-rose-400/25 from-rose-400/15 text-rose-100",
  emerald: "border-emerald-400/25 from-emerald-400/15 text-emerald-100",
};

export default function MetricsView({
  month,
  onMonthChange,
  expenses,
  accounts,
  categories,
  income,
  onSaveIncome,
  loans = [],
  payments = [],
}) {
  const [horizon, setHorizon] = useState(6);
  const [openMonth, setOpenMonth] = useState(month);
  const [sheetMonth, setSheetMonth] = useState(null);
  const [chartsOpen, setChartsOpen] = useState(false);
  const [strategy, setStrategy] = useState("msi");
  const [simAmount, setSimAmount] = useState("");
  const [periodView, setPeriodView] = useState("month");

  const salary = incomeTotal(income);
  const commitments = useMemo(
    () => commitmentsInCalendarMonth(accounts, expenses, payments, loans, month),
    [accounts, expenses, payments, loans, month]
  );
  const plan = useMemo(
    () => simulatePaymentPlan(commitments, simAmount, strategy),
    [commitments, simAmount, strategy]
  );
  const tips = useMemo(() => buildRecommendations(commitments, salary), [commitments, salary]);

  const projection = useMemo(
    () => futureProjection(expenses, month, horizon, loans, accounts),
    [expenses, month, horizon, loans, accounts]
  );
  const debt = consolidatedDebt(expenses, accounts, loans);
  const cashback = totalCashback(expenses);
  const categoriesMonth = categoryBreakdown(expenses, categories, month);
  const maxBar = Math.max(...projection.map((item) => item.total), 1);
  const sheetPeriod = projection.find((item) => item.month === sheetMonth) ?? null;
  const firstShare = commitments.total > 0 ? Math.round((commitments.first / commitments.total) * 100) : 0;

  const shortcuts = [
    commitments.first > 0 ? { id: "q1", label: "1ª quincena", value: commitments.first } : null,
    commitments.second > 0 ? { id: "q2", label: "2ª quincena", value: commitments.second } : null,
    commitments.total > 0 ? { id: "all", label: "Cubrir el mes", value: commitments.total } : null,
    salary > 0 ? { id: "pay", label: "Sueldo del mes", value: salary } : null,
  ].filter(Boolean);

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
        <h1 className="text-2xl font-semibold text-white">Centro de decisión</h1>
        <p className="text-sm text-slate-400">
          Vencimientos del mes civil, no del corte de cada tarjeta. Empátalos con tu quincena.
        </p>
      </div>

      <MonthNav value={month} onChange={onMonthChange} />

      <div className="flex rounded-2xl border border-slate-800 bg-slate-900/70 p-1">
        {[
          { id: "month", label: "Mensual completo" },
          { id: "fortnight", label: "Por quincenas" },
        ].map((option) => {
          const active = periodView === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setPeriodView(option.id)}
              className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                active ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <section className="rounded-3xl border border-amber-400/25 bg-gradient-to-br from-amber-400/15 via-slate-950 to-slate-900 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-200/80">
          Compromiso total · {formatMonthLabel(month)}
        </p>
        <p className="mt-1 text-3xl font-semibold text-white">{formatMXN(commitments.total)}</p>
        <p className="mt-1 text-xs text-slate-400">
          Suma de pagos exigibles para no generar intereses, según la fecha de pago de cada tarjeta.
        </p>

        {periodView === "month" ? (
          commitments.rows.length ? (
            <ul className="mt-4 space-y-1.5">
              {commitments.rows.map((row) => (
                <CommitmentRow key={row.id} row={row} />
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-400">Nada vence en este mes civil.</p>
          )
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <FortnightCard
              label="1ª quincena · días 1 al 15"
              amount={commitments.first}
              hint="Para empatar con la 1ª quincena"
              share={firstShare}
              tone="violet"
              rows={commitments.rows.filter((row) => row.fortnight === "first")}
            />
            <FortnightCard
              label="2ª quincena · días 16 al fin"
              amount={commitments.second}
              hint="Para empatar con la 2ª quincena"
              share={commitments.total > 0 ? 100 - firstShare : 0}
              tone="emerald"
              rows={commitments.rows.filter((row) => row.fortnight === "second")}
            />
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <PaymentSimulator
          amount={simAmount}
          onAmountChange={setSimAmount}
          strategy={strategy}
          onStrategyChange={setStrategy}
          plan={plan}
          shortcuts={shortcuts}
        />

        <div className="space-y-4">
          <section>
            <h2 className="mb-3 text-base font-semibold text-white">Asistente financiero</h2>
            <div className="space-y-3">
              {tips.map((tip) => (
                <article
                  key={tip.id}
                  className={`rounded-3xl border bg-gradient-to-br to-slate-950 p-4 ${TONES[tip.tone]}`}
                >
                  <p className="text-sm font-semibold text-white">
                    {tip.emoji} {tip.title}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-200">{tip.body}</p>
                </article>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-[11px] uppercase tracking-wider text-violet-200">MSI fijos</p>
              <p className="mt-1 text-lg font-semibold text-white">{formatMXN(commitments.msiTotal)}</p>
              <p className="mt-1 text-[11px] text-slate-500">Meses anteriores</p>
            </article>
            <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-[11px] uppercase tracking-wider text-amber-200">Contado / nuevo</p>
              <p className="mt-1 text-lg font-semibold text-white">{formatMXN(commitments.cashTotal)}</p>
              <p className="mt-1 text-[11px] text-slate-500">Ciclo actual</p>
            </article>
          </div>

          <IncomeCard month={month} income={income} due={commitments.total} onSave={onSaveIncome} />
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60">
        <button
          type="button"
          onClick={() => setChartsOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span>
            <span className="block text-sm font-semibold text-white">Proyección y categorías</span>
            <span className="text-[11px] text-slate-500">Vista secundaria · gráficas y desglose por mes</span>
          </span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition ${chartsOpen ? "rotate-180" : ""}`} />
        </button>

        {chartsOpen ? (
          <div className="space-y-4 border-t border-slate-800 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="mb-2 flex items-center gap-2 text-rose-200">
                  <Landmark className="h-4 w-4" />
                  <p className="text-[11px] uppercase tracking-wider">Deuda consolidada</p>
                </div>
                <p className="text-xl font-semibold text-white">{formatMXN(debt.total)}</p>
                <p className="mt-1 text-xs text-slate-400">
                  MSI {formatMXN(debt.fromMsi)} · Préstamos {formatMXN(debt.fromLoans)}
                </p>
              </article>
              <article className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <div className="mb-2 flex items-center gap-2 text-emerald-200">
                  <Gift className="h-4 w-4" />
                  <p className="text-[11px] uppercase tracking-wider">Cashback acumulado</p>
                </div>
                <p className="text-xl font-semibold text-white">{formatMXN(cashback)}</p>
              </article>
            </div>

            <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="mb-3 flex items-center gap-2">
                <PieChart className="h-4 w-4 text-cyan-300" />
                <h3 className="text-sm font-semibold text-white">Gastos por categoría</h3>
              </div>
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
            </article>

            <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-300" />
                  <h3 className="text-sm font-semibold text-white">Proyección consolidada</h3>
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
                              ? "bg-gradient-to-t from-emerald-400 to-violet-300"
                              : "bg-gradient-to-t from-emerald-500/70 to-violet-400/50"
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
                              {item.lastPaymentCount} último{item.lastPaymentCount === 1 ? "" : "s"} pago
                              {item.lastPaymentCount === 1 ? "" : "s"}
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
            </article>
          </div>
        ) : null}
      </section>

      <MonthBreakdownSheet open={Boolean(sheetPeriod)} period={sheetPeriod} onClose={() => setSheetMonth(null)} />
    </div>
  );
}

function FortnightCard({ label, amount, hint, share, tone, rows = [] }) {
  const bar = tone === "violet" ? "bg-violet-400" : "bg-emerald-400";
  return (
    <article className="rounded-2xl border border-white/5 bg-slate-950/50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{formatMXN(amount)}</p>
      <p className="mt-1 text-[11px] text-slate-500">{hint}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.min(100, toSafeNumber(share, 0))}%` }} />
      </div>
      {rows.length ? (
        <ul className="mt-3 space-y-1.5">
          {rows.map((row) => (
            <CommitmentRow key={row.id} row={row} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[11px] text-slate-500">Sin vencimientos en esta mitad.</p>
      )}
    </article>
  );
}

function CommitmentRow({ row }) {
  return (
    <li className="flex items-center justify-between gap-3 text-xs text-slate-300">
      <span className="min-w-0 truncate">
        {row.name}
        {row.paymentDue ? ` · vence ${formatShortDate(row.paymentDue)}` : ""}
      </span>
      <span className="shrink-0 font-semibold text-white">{formatMXN(row.remaining)}</span>
    </li>
  );
}
