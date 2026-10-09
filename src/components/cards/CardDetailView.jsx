import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Pencil, SlidersHorizontal } from "lucide-react";
import { formatDateRange, formatShortDate, shiftCutoffDate, startOfDay } from "../../utils/cardDates";
import { currentMonthValue, formatMonthLabel, matchesMonth } from "../../utils/expenses";
import {
  buildAccountPaymentLedger,
  calculateCardBalances,
  getStatementWindow,
  lastCommitmentCycleIndex,
  statementItemsForCutoff,
} from "../../utils/cardStatement";
import { cycleMonthFromDate, paymentsForAccount } from "../../utils/payments";
import { roundMoney, toSafeNumber } from "../../utils/numbers";
import { haptic } from "../../utils/haptic";
import { persistSortPref, processMovements, readSortPref } from "../../utils/movementSort";
import AddPaymentModal from "./AddPaymentModal";
import CardSpeedDial from "./CardSpeedDial";
import MonthBreakdownModal from "./MonthBreakdownModal";
import PaymentHistoryList from "./PaymentHistoryList";
import PaymentTimeline from "./PaymentTimeline";
import StatementItemList from "./StatementItemList";
import { availableCredit, formatMXN, utilization, utilizationTone } from "../../utils/money";
import ExpenseList from "../expenses/ExpenseList";
import FilterBottomSheet from "../expenses/FilterBottomSheet";
import MonthNav from "../ui/MonthNav";
import CreditCardVisual from "./CreditCardVisual";

const VIEW_KEY = "movement_view_mode";

function readViewMode() {
  try {
    const stored = localStorage.getItem(VIEW_KEY);
    if (stored === "calendar" || stored === "natural") return "calendar";
    if (stored === "cutoff" || stored === "corte") return "cutoff";
  } catch {
    /* ignore */
  }
  return "cutoff";
}

function persistViewMode(mode) {
  try {
    localStorage.setItem(VIEW_KEY, mode === "calendar" ? "natural" : "corte");
  } catch {
    /* ignore */
  }
}

function applyFeedFilter(expense, filter) {
  if (filter === "msi") return Boolean(expense.isMsi);
  if (filter === "pending") return expense.status !== "paid" && expense.remainingInstallments > 0;
  if (filter === "paid") return expense.status === "paid" || expense.remainingInstallments <= 0;
  return true;
}

function applyStatementFilter(item, expense, filter, allocation, settled) {
  if (filter === "msi") return item.kind === "msi";
  const paid = settled || allocation?.fullyPaid || expense?.status === "paid" || expense?.remainingInstallments <= 0;
  if (filter === "pending") return !paid;
  if (filter === "paid") return paid;
  return true;
}

export default function CardDetailView({
  account,
  expenses,
  payments = [],
  accounts,
  categories,
  loading,
  savingPayment,
  onBack,
  onEditCard,
  onAddExpense,
  onAddPayment,
  onDeletePayment,
  onAdvance,
  onToggleStatus,
  onOpenActions,
  overlayOpen = false,
}) {
  const [month, setMonth] = useState(currentMonthValue());
  const [viewMode, setViewMode] = useState(readViewMode);
  const [cycleOffset, setCycleOffset] = useState(0);
  const [filter, setFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailCycle, setDetailCycle] = useState(null);
  const [payOpen, setPayOpen] = useState(false);
  const [dialOpen, setDialOpen] = useState(false);
  const [historyTab, setHistoryTab] = useState("movements");
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [sortPref, setSortPref] = useState(readSortPref);
  const sortBy = sortPref.sortBy;
  const groupBy = sortPref.groupBy;
  const userCycled = useRef(false);
  const settledPulse = useRef(null);

  useEffect(() => {
    persistViewMode(viewMode);
  }, [viewMode]);

  useEffect(() => {
    persistSortPref(sortPref);
  }, [sortPref]);

  useEffect(() => {
    userCycled.current = false;
    settledPulse.current = null;
  }, [account.id]);

  const statement = useMemo(
    () => calculateCardBalances(account, expenses),
    [account, expenses]
  );
  const ledger = useMemo(
    () => buildAccountPaymentLedger(account, expenses, payments),
    [account, expenses, payments]
  );
  const currentKey = statement.cycleMonth;
  const nextKey = cycleMonthFromDate(statement.nextCutoff);
  const currentEntry = ledger.byKey[currentKey];
  const nextEntry = ledger.byKey[nextKey];
  const applied = useMemo(() => {
    const remainingCurrent = currentEntry?.remaining ?? 0;
    return {
      cycleMonth: currentKey,
      cyclePayments: currentEntry?.cyclePayments || [],
      paidAmount: currentEntry?.paidAmount || 0,
      remainingCurrent,
      surplus: currentEntry?.surplus || 0,
      settled: Boolean(currentEntry?.settled),
      allocations: currentEntry?.allocations || [],
      allocationById: currentEntry?.allocationById || {},
      displayBalance: roundMoney(Math.max(0, toSafeNumber(statement.currentBalance, 0) - ledger.allPaid)),
      displayCurrentDue: remainingCurrent,
      displayNextDue: nextEntry?.remaining ?? 0,
    };
  }, [currentEntry, nextEntry, currentKey, statement.currentBalance, ledger.allPaid]);
  const displayBalance = applied.displayBalance;
  const displayAccount = useMemo(
    () => ({ ...account, currentBalance: displayBalance }),
    [account, displayBalance]
  );
  const used = utilization(displayAccount.currentBalance, account.creditLimit);
  const tone = utilizationTone(used);
  const available = availableCredit(displayAccount.currentBalance, account.creditLimit);
  const remainingDue = applied.remainingCurrent;
  const cycleCleared = remainingDue <= 0.01;
  const pastPaymentDue = startOfDay(new Date()) >= startOfDay(statement.paymentDue);
  const preferOpenCycle = cycleCleared || pastPaymentDue;
  const currentItems = currentEntry?.items || statement.currentItems;
  const currentCycle = useMemo(
    () => ({
      label: formatMonthLabel(applied.cycleMonth),
      total: applied.displayCurrentDue,
      items: currentItems,
      settled: applied.settled,
    }),
    [applied, currentItems]
  );
  const nextCycle = useMemo(
    () => ({
      label: formatMonthLabel(nextKey),
      total: applied.displayNextDue,
      items: nextEntry?.items || statement.nextItems,
    }),
    [statement, applied.displayNextDue, nextKey, nextEntry]
  );

  const maxCycleOffset = Math.max(1, lastCommitmentCycleIndex(account, expenses));
  const selectedCutoff = useMemo(
    () => shiftCutoffDate(statement.lastCutoff, account.cutoffDay, cycleOffset),
    [statement.lastCutoff, account.cutoffDay, cycleOffset]
  );
  const selectedStatement = useMemo(
    () => (cycleOffset === 0 ? statement : calculateCardBalances(account, expenses, selectedCutoff)),
    [cycleOffset, statement, account, expenses, selectedCutoff]
  );
  const viewedKey = cycleMonthFromDate(selectedCutoff);
  const selectedApplied = ledger.byKey[viewedKey] || {
    monthKey: viewedKey,
    cycleMonth: viewedKey,
    cyclePayments: [],
    paidAmount: 0,
    remaining: 0,
    settled: false,
    allocations: [],
    allocationById: {},
    items: [],
  };
  const cycleWindow = useMemo(
    () => getStatementWindow(account, selectedCutoff),
    [account, selectedCutoff]
  );
  const expensesById = useMemo(
    () => Object.fromEntries(expenses.map((expense) => [expense.id, expense])),
    [expenses]
  );
  const cycleItems = useMemo(
    () =>
      (selectedApplied.items?.length
        ? selectedApplied.items
        : statementItemsForCutoff(account, expenses, selectedCutoff)
      )
        .map((item) => ({
          ...item,
          allocation:
            item.allocation ||
            selectedApplied.allocations?.find((row) => row.key === `${item.id}-${item.label}`) ||
            selectedApplied.allocationById?.[item.id],
        }))
        .filter((item) =>
          applyStatementFilter(
            item,
            expensesById[item.id],
            filter,
            item.allocation,
            selectedApplied.settled
          )
        ),
    [account, expenses, selectedCutoff, selectedApplied, expensesById, filter]
  );
  const periodTotal = useMemo(
    () => cycleItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [cycleItems]
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
  const processedFeed = useMemo(
    () =>
      processMovements(feed, sortBy, groupBy, {
        getDate: (expense) => expense.purchaseDate,
        getAmount: (expense) => expense.totalAmount,
        getCategory: (expense) => expense.category,
      }),
    [feed, sortBy, groupBy]
  );
  const processedCycle = useMemo(
    () =>
      processMovements(cycleItems, sortBy, groupBy, {
        getDate: (item) => item.purchaseDate,
        getAmount: (item) => item.amount,
        getCategory: (item) => expensesById[item.id]?.category || "Otro",
      }),
    [cycleItems, sortBy, groupBy, expensesById]
  );
  const movementCount = viewMode === "cutoff" ? cycleItems.length : feed.length;
  const cyclePayments = selectedApplied.cyclePayments || [];
  const sheetOpen = overlayOpen || filtersOpen || payOpen || Boolean(detailCycle) || timelineOpen;

  useEffect(() => {
    if (sheetOpen) setDialOpen(false);
  }, [sheetOpen]);

  useEffect(() => {
    if (userCycled.current) return;
    setCycleOffset(preferOpenCycle ? 1 : 0);
  }, [account.id, preferOpenCycle]);

  useEffect(() => {
    if (settledPulse.current === null) {
      settledPulse.current = cycleCleared;
      return;
    }
    if (!settledPulse.current && cycleCleared) haptic(20);
    settledPulse.current = cycleCleared;
  }, [cycleCleared]);

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
        <div className="w-full shrink-0">
          <CreditCardVisual account={displayAccount} selected />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard
            tone={cycleCleared ? "success" : "amber"}
            label="Pago para no generar intereses"
            value={formatMXN(remainingDue)}
            badge={
              cycleCleared
                ? "✅ Corte Liquidado"
                : statement.overdue
                  ? `Venció el ${formatShortDate(statement.paymentDue)}`
                  : `Pagar antes del ${formatShortDate(statement.paymentDue)}`
            }
            hint={
              cycleCleared
                ? "Cubierto al 100% · Sin pagos pendientes"
                : `Pendiente: ${formatMXN(remainingDue)} · Abonado: ${formatMXN(applied.paidAmount)}`
            }
            overdue={statement.overdue && !cycleCleared}
            celebrate={cycleCleared}
            onDetail={() => setDetailCycle(currentCycle)}
          />
          <MetricCard
            tone="cyan"
            featured={cycleCleared}
            label="Acumulado próximo corte"
            value={formatMXN(applied.displayNextDue)}
            badge={
              cycleCleared
                ? `Siguiente compromiso: ${formatShortDate(statement.nextCutoff)}`
                : `Corte el ${formatShortDate(statement.nextCutoff)}`
            }
            hint={
              applied.surplus > 0
                ? `Sobrante aplicado: ${formatMXN(applied.surplus)}`
                : "Compras nuevas + siguiente MSI"
            }
            onDetail={() => setDetailCycle(nextCycle)}
          />
          <MetricCard label="Saldo" value={formatMXN(displayBalance)} hint="Adeudo total tras abonos" />
          <MetricCard
            label="Disponible"
            value={formatMXN(available)}
            hint={`Utilización ${used.toFixed(0)}%`}
            accent
          />
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
          Saldo total: {formatMXN(displayBalance)}
          {statement.futureMsi > 0 ? ` (incluye ${formatMXN(statement.futureMsi)} en MSI a futuro)` : ""}
          . Este corte {formatMXN(applied.displayCurrentDue)} + próximo {formatMXN(applied.displayNextDue)}
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

        <PaymentTimeline
          account={account}
          expenses={expenses}
          payments={payments}
          onBreakdownOpenChange={setTimelineOpen}
        />

        <div className="mt-8 flex rounded-2xl border border-slate-800 bg-slate-900/60 p-1">
          {[
            { id: "movements", label: "Movimientos", count: movementCount },
            { id: "payments", label: "Historial de Abonos", count: cyclePayments.length },
          ].map((tab) => {
            const active = historyTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setHistoryTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold transition duration-200 ${
                  active ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="truncate">{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    active ? "bg-slate-900/10 text-slate-800" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            {viewMode === "cutoff" ? (
              <MonthNav
                label={formatDateRange(cycleWindow.start, cycleWindow.end)}
                onPrev={() => {
                  userCycled.current = true;
                  setCycleOffset((value) => Math.max(-18, value - 1));
                }}
                onNext={() => {
                  userCycled.current = true;
                  setCycleOffset((value) => Math.min(maxCycleOffset, value + 1));
                }}
                prevAria="Ciclo anterior"
                nextAria="Ciclo siguiente"
              />
            ) : (
              <MonthNav value={month} onChange={setMonth} />
            )}
          </div>
          {historyTab === "movements" ? (
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 text-slate-200"
              aria-label="Filtros"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        {viewMode === "cutoff" ? (
          <p className="mt-2 px-1 text-[11px] text-slate-500">
            Ciclo {formatMonthLabel(selectedApplied.cycleMonth)} · corte {formatShortDate(selectedStatement.lastCutoff)}
            {cycleOffset === 0
              ? " · coincide con el pago para no generar intereses"
              : cycleOffset === 1
                ? " · ciclo en curso (acumulado del próximo corte)"
                : ""}
          </p>
        ) : null}

        <div className="mt-5">
          {historyTab === "payments" ? (
            <>
              <div className="mb-3 flex items-end justify-between gap-3">
                <h2 className="text-base font-semibold text-white">Abonos del periodo</h2>
                <p className="text-sm font-semibold text-emerald-300">{formatMXN(selectedApplied.paidAmount)}</p>
              </div>
              <PaymentHistoryList payments={cyclePayments} onDelete={onDeletePayment} />
            </>
          ) : (
            <>
              <div className="mb-3 flex items-end justify-between gap-3">
                <h2 className="text-base font-semibold text-white">Movimientos</h2>
                {viewMode === "cutoff" ? (
                  <p className="text-sm font-semibold text-white">{formatMXN(periodTotal)}</p>
                ) : null}
              </div>
              {viewMode === "cutoff" ? (
                <StatementItemList
                  items={processedCycle.items}
                  groups={processedCycle.groups}
                  groupMode={groupBy === "category" ? "category" : "none"}
                  categories={categories}
                  expensesById={expensesById}
                  allocationById={selectedApplied.allocationById}
                  settled={selectedApplied.settled}
                  loading={loading}
                  emptyText="No hay cargos de este ciclo de corte."
                  onAdvance={onAdvance}
                  onOpenActions={onOpenActions}
                />
              ) : (
                <ExpenseList
                  expenses={processedFeed.items}
                  groups={processedFeed.groups}
                  groupMode={groupBy === "category" ? "category" : "none"}
                  accounts={accounts}
                  categories={categories}
                  loading={loading}
                  emptyText="No hay gastos de esta tarjeta en el mes seleccionado."
                  allocationById={applied.allocationById}
                  settled={applied.settled}
                  onOpenActions={onOpenActions}
                  onAdvance={onAdvance}
                  onToggleStatus={onToggleStatus}
                />
              )}
            </>
          )}
        </div>
      </div>

      {!sheetOpen ? (
        <CardSpeedDial
          open={dialOpen}
          onToggle={() => setDialOpen((open) => !open)}
          onExpense={() => {
            setDialOpen(false);
            onAddExpense();
          }}
          onPay={() => {
            setDialOpen(false);
            setPayOpen(true);
          }}
        />
      ) : null}

      <MonthBreakdownModal open={Boolean(detailCycle)} cycle={detailCycle} onClose={() => setDetailCycle(null)} />
      <AddPaymentModal
        open={payOpen}
        account={account}
        viewedCycle={{
          key: viewedKey,
          rangeLabel: formatDateRange(cycleWindow.start, cycleWindow.end),
          monthLabel: formatMonthLabel(viewedKey),
          remaining: selectedApplied.remaining ?? 0,
          paidAmount: selectedApplied.paidAmount || 0,
        }}
        currentCycle={{
          key: currentKey,
          monthLabel: formatMonthLabel(currentKey),
          remaining: applied.remainingCurrent,
          paidAmount: applied.paidAmount,
        }}
        oldestUnpaid={
          ledger.oldestUnpaid
            ? {
                key: ledger.oldestUnpaid.monthKey,
                monthLabel: ledger.oldestUnpaid.label,
                remaining: ledger.oldestUnpaid.remaining,
              }
            : null
        }
        payments={paymentsForAccount(payments, account.id)}
        saving={savingPayment}
        onClose={() => setPayOpen(false)}
        onSubmit={onAddPayment}
        onDelete={onDeletePayment}
      />
      <FilterBottomSheet
        open={filtersOpen}
        variant="card"
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        cardFilter={filter}
        onCardFilterChange={setFilter}
        sortBy={sortBy}
        groupBy={groupBy}
        onSortChange={(next) => setSortPref((current) => ({ ...current, sortBy: next }))}
        onGroupChange={(next) => setSortPref((current) => ({ ...current, groupBy: next }))}
        onClose={() => setFiltersOpen(false)}
      />
    </div>
  );
}

function MetricCard({ tone, label, value, badge, hint, overdue, accent, featured, celebrate, onDetail }) {
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
    success: {
      card: "border-emerald-400/35 from-emerald-400/15",
      label: "text-emerald-200/90",
      badge: "bg-emerald-400/15 text-emerald-100",
    },
  };
  const skin = tones[tone] ?? {
    card: "border-slate-800 from-slate-900/40",
    label: "text-slate-500",
    badge: "bg-slate-800 text-slate-300",
  };

  return (
    <article
      className={`flex h-auto min-h-0 flex-col rounded-2xl border bg-gradient-to-br to-slate-900 p-3 transition-all duration-500 ${skin.card} ${
        featured ? "ring-1 ring-emerald-500/40 ring-offset-0" : ""
      } ${celebrate ? "settle-flash" : ""}`}
    >
      <p className={`line-clamp-2 text-[10px] font-semibold uppercase leading-tight tracking-wide ${skin.label}`}>
        {label}
      </p>
      <p className={`mt-1.5 text-base font-semibold ${accent || tone === "success" ? "text-emerald-300" : "text-white"}`}>
        {value}
      </p>
      {badge ? (
        <span className={`mt-1.5 inline-flex w-fit max-w-full truncate rounded-full px-2 py-0.5 text-[10px] font-semibold ${skin.badge}`}>
          {badge}
        </span>
      ) : (
        <span className="mt-1.5 h-[1.125rem]" />
      )}
      <p className="mt-auto line-clamp-2 text-[10px] text-slate-400">{hint}</p>
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
