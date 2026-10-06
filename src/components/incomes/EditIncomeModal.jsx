import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { NUMBER_INPUT } from "../../constants/ui";
import { formatMonthLabel } from "../../utils/expenses";
import { incomeTotal } from "../../utils/income";
import { formatMXN } from "../../utils/money";
import { toSafeNumber } from "../../utils/numbers";

export default function EditIncomeModal({ open, month, income, saving, onClose, onSubmit }) {
  const [baseSalary, setBaseSalary] = useState("");
  const [extraIncome, setExtraIncome] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setBaseSalary(income?.baseSalary ?? income?.amount ?? "");
    setExtraIncome(income?.extraIncome ?? "");
    setError(null);
  }, [open, income]);

  if (!open) return null;

  const preview = toSafeNumber(baseSalary, 0) + toSafeNumber(extraIncome, 0);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await onSubmit({
        baseSalary: toSafeNumber(baseSalary, 0),
        extraIncome: toSafeNumber(extraIncome, 0),
      });
      onClose();
    } catch (err) {
      setError(err?.message || "No se pudo guardar el sueldo.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <section className="sheet-up relative w-full max-w-md rounded-t-3xl border border-slate-800 bg-slate-950 p-5 lg:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Ingreso de {formatMonthLabel(month)}</h2>
            <p className="text-xs text-slate-400">Sueldo base + extras del mes</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-800 p-2 text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">Sueldo base</span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <input
                type="number"
                inputMode="decimal"
                value={baseSalary}
                onChange={(event) => setBaseSalary(event.target.value)}
                className={`${NUMBER_INPUT} pl-8`}
                placeholder="24500"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">Extras / comisiones</span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <input
                type="number"
                inputMode="decimal"
                value={extraIncome}
                onChange={(event) => setExtraIncome(event.target.value)}
                className={`${NUMBER_INPUT} pl-8`}
                placeholder="0"
              />
            </div>
          </label>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-sm text-slate-200">
            Total del mes: <span className="font-semibold text-white">{formatMXN(preview)}</span>
            {income ? (
              <span className="ml-2 text-xs text-slate-500">antes {formatMXN(incomeTotal(income))}</span>
            ) : null}
          </div>

          {error ? (
            <p className="flex items-start gap-2 text-sm text-rose-300">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-white py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar ingreso"}
          </button>
        </form>
      </section>
    </div>
  );
}
