import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatShortDate } from "../../utils/cardDates";
import { buildAccountPaymentLedger, projectCardCycles } from "../../utils/cardStatement";
import { formatMXN } from "../../utils/money";
import MonthBreakdownModal from "./MonthBreakdownModal";

const HORIZON_KEY = "gastos_payment_horizon";
const HORIZONS = [
  { id: "active", label: "Solo activos" },
  { id: "3", label: "3 Meses" },
  { id: "6", label: "6 Meses" },
  { id: "12", label: "12 Meses" },
];

function readHorizon() {
  try {
    const stored = localStorage.getItem(HORIZON_KEY);
    if (HORIZONS.some((item) => item.id === stored)) return stored;
  } catch {
    /* ignore */
  }
  return "active";
}

export default function PaymentTimeline({ account, expenses, payments = [], onBreakdownOpenChange }) {
  const scroller = useRef(null);
  const [selected, setSelected] = useState(null);
  const [horizon, setHorizon] = useState(readHorizon);

  useEffect(() => {
    onBreakdownOpenChange?.(Boolean(selected));
    return () => onBreakdownOpenChange?.(false);
  }, [selected, onBreakdownOpenChange]);

  useEffect(() => {
    try {
      localStorage.setItem(HORIZON_KEY, horizon);
    } catch {
      /* ignore */
    }
  }, [horizon]);

  const rawProjections = useMemo(
    () => projectCardCycles(account, expenses, horizon),
    [account, expenses, horizon]
  );
  const ledger = useMemo(
    () => buildAccountPaymentLedger(account, expenses, payments),
    [account, expenses, payments]
  );
  const cycles = useMemo(
    () =>
      rawProjections.map((cycle) => {
        const entry = ledger.byKey[cycle.monthKey];
        if (!entry) return cycle;
        return {
          ...cycle,
          ...entry,
          items: entry.items,
          gross: entry.gross,
          paidAmount: entry.paidAmount,
          total: entry.remaining,
          settled: entry.settled,
        };
      }),
    [rawProjections, ledger]
  );

  useEffect(() => {
    setSelected((current) => {
      if (!current) return current;
      return cycles.find((cycle) => cycle.monthKey === current.monthKey) || null;
    });
  }, [cycles]);

  function scrollByCard(direction) {
    const node = scroller.current;
    if (!node) return;
    node.scrollBy({ left: direction * 220, behavior: "smooth" });
  }

  return (
    <section className="mt-6 mb-2">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-white">Pagos futuros</h2>
          <p className="text-[11px] text-slate-400">Proyección por ciclo de corte</p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-200"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-200"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="no-scrollbar mb-3 flex gap-1.5 overflow-x-auto">
        {HORIZONS.map((option) => {
          const active = horizon === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setHorizon(option.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                active ? "bg-white text-slate-950" : "border border-slate-800 bg-slate-900/70 text-slate-400"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {cycles.length ? (
        <div
          ref={scroller}
          className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1"
        >
          {cycles.map((cycle) => (
            <button
              key={cycle.monthKey}
              type="button"
              onClick={() => setSelected(cycle)}
              className="flex h-[9.25rem] w-[11.5rem] shrink-0 snap-start flex-col rounded-3xl border border-slate-800 bg-slate-900/70 p-3.5 text-left transition hover:border-slate-700"
            >
              <p className="truncate text-sm font-semibold text-white">{cycle.label}</p>
              <span className="mt-1.5 inline-flex w-fit max-w-full truncate rounded-full bg-slate-800/90 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                Corte {formatShortDate(cycle.statementCutoff)} · Paga {formatShortDate(cycle.paymentDue)}
              </span>
              <p className="mt-auto text-xl font-semibold tracking-tight text-white">{formatMXN(cycle.total)}</p>
              {cycle.gross > cycle.total ? (
                <span className="mt-1 text-[10px] font-medium text-slate-500 line-through">{formatMXN(cycle.gross)}</span>
              ) : null}
              <span className={`mt-1.5 text-[11px] font-medium ${cycle.settled ? "text-emerald-300" : "text-emerald-300/90"}`}>
                {cycle.settled ? "Liquidado" : "Ver desglose →"}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-800 px-4 py-6 text-center text-xs text-slate-500">
          No hay pagos proyectados en este rango.
        </p>
      )}

      <MonthBreakdownModal open={Boolean(selected)} cycle={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
