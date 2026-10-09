import { useEffect, useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { formatExpenseDate } from "../../utils/expenses";
import { haptic } from "../../utils/haptic";
import { formatMXN } from "../../utils/money";

export default function MovementActionSheet({ open, expense, amount, saving, onClose, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) setConfirming(false);
  }, [open, expense?.id]);

  if (!open || !expense) return null;

  const displayAmount = amount ?? expense.totalAmount;
  const isMsi = Boolean(expense.isMsi);

  async function handleDelete() {
    try {
      haptic(15);
      await onDelete(expense);
      setConfirming(false);
      onClose();
    } catch {
      /* keep the confirmation open so the user can retry */
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center lg:items-center">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="Cerrar" />
      <section className="sheet-up relative w-full max-w-md rounded-t-3xl border border-slate-800 bg-slate-950 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:rounded-3xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Gestionar movimiento</p>
            <h2 className="text-base font-semibold leading-snug text-white">
              {expense.title} · {formatExpenseDate(expense.purchaseDate)} · {formatMXN(displayAmount)}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-800 p-2 text-slate-300" aria-label="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </div>

        {confirming ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-slate-200">
              ¿Eliminar este gasto de {formatMXN(expense.totalAmount)}? Se recalcularán de inmediato tu saldo y tu corte
              actual.
            </p>
            {isMsi ? (
              <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-3 py-2.5 text-xs text-rose-100">
                Se eliminarán también las cuotas futuras proyectadas asociadas a esta compra.
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-2xl border border-slate-700 bg-slate-900 py-3 text-sm font-semibold text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleDelete}
                className="rounded-2xl bg-rose-500 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Eliminando…" : "Eliminar definitivamente"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                onEdit(expense);
                onClose();
              }}
              className="flex w-full items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Pencil className="h-4 w-4 text-emerald-300" />
              Editar movimiento
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="flex w-full items-center gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-left text-sm font-semibold text-rose-200 transition hover:bg-rose-400/15"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar movimiento
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl py-3 text-sm font-semibold text-slate-400"
            >
              Cancelar
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
