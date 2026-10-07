import { useEffect, useState } from "react";
import { FastForward, ShieldAlert, X } from "lucide-react";
import { formatMXN } from "../../utils/money";
import { toSafeNumber, roundMoney } from "../../utils/numbers";
import { paidInstallments } from "../../utils/expenses";

export default function AdvanceModal({ open, expense, saving, onClose, onConfirm }) {
  const remaining = toSafeNumber(expense?.remainingInstallments, 0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) setError(null);
  }, [open, expense]);

  if (!open || !expense) return null;

  const total = Math.max(1, toSafeNumber(expense.totalInstallments, 1));
  const nextInstallment = Math.min(total, paidInstallments(expense) + 1);
  const amount = roundMoney(toSafeNumber(expense.monthlyPayment, 0));

  async function handleConfirm(event) {
    event.preventDefault();
    try {
      await onConfirm(expense, 1);
    } catch (err) {
      setError(err?.message || "No se pudo adelantar la mensualidad.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <section className="sheet-up relative w-full max-w-md rounded-t-3xl border border-amber-400/25 bg-slate-950 p-4 lg:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-400/15 p-2 text-amber-200">
              <ShieldAlert className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-semibold text-white">Adelanto irreversible</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-800 p-2 text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm leading-relaxed text-slate-200">
          ¿Adelantar mensualidad {nextInstallment} de {total}? Al confirmar, la cuota de {formatMXN(amount)} se
          sumará inmediatamente al pago de este corte y se descontará del saldo futuro. Esta acción es definitiva.
        </p>

        <p className="mt-3 text-xs text-slate-500">
          {expense.title} · quedan {remaining} de {total}
        </p>

        <form onSubmit={handleConfirm} className="mt-5 space-y-3">
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-700 bg-slate-900 py-3 text-sm font-semibold text-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || remaining <= 0}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-emerald-400 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
            >
              <FastForward className="h-4 w-4" />
              {saving ? "Aplicando…" : "Confirmar adelanto"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
