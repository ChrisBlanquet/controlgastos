import { useEffect, useState } from "react";
import { FastForward, X } from "lucide-react";
import { NUMBER_INPUT } from "../../constants/ui";
import { formatMXN } from "../../utils/money";
import { toSafeNumber, roundMoney } from "../../utils/numbers";

export default function AdvanceModal({ open, expense, saving, onClose, onConfirm }) {
  const remaining = toSafeNumber(expense?.remainingInstallments, 0);
  const [count, setCount] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setCount(1);
      setError(null);
    }
  }, [open, expense]);

  if (!open || !expense) return null;

  const amount = roundMoney(count * toSafeNumber(expense.monthlyPayment, 0));

  async function handleConfirm(event) {
    event.preventDefault();
    const steps = Math.min(remaining, Math.max(1, toSafeNumber(count, 1)));
    try {
      await onConfirm(expense, steps);
    } catch (err) {
      setError(err?.message || "No se pudo adelantar la mensualidad.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <section className="sheet-up relative w-full max-w-md rounded-t-3xl border border-slate-800 bg-slate-950 p-4 lg:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Adelantar mensualidad</h2>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-800 p-2 text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-slate-400">
          {expense.title} · quedan {remaining} de {expense.totalInstallments}
        </p>

        <form onSubmit={handleConfirm} className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">Mensualidades a adelantar</span>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max={remaining}
              value={count}
              onChange={(event) => setCount(event.target.value)}
              className={NUMBER_INPUT}
            />
          </label>

          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-3 text-sm text-emerald-200">
            Se descontarán {formatMXN(amount)} del saldo de la tarjeta.
          </div>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            <FastForward className="h-4 w-4" />
            {saving ? "Aplicando…" : "Adelantar"}
          </button>
        </form>
      </section>
    </div>
  );
}
