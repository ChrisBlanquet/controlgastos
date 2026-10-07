import { useEffect, useMemo, useState } from "react";
import { Banknote, Trash2, X } from "lucide-react";
import { NUMBER_INPUT } from "../../constants/ui";
import { todayISO } from "../../utils/expenses";
import { formatMXN } from "../../utils/money";
import { roundMoney, toSafeNumber } from "../../utils/numbers";

const SHORTCUTS = [500, 1000];

export default function AddPaymentModal({
  open,
  account,
  cycleMonth,
  currentDue,
  remainingCurrent,
  paidAmount,
  payments,
  saving,
  onClose,
  onSubmit,
  onDelete,
}) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [custom, setCustom] = useState(false);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const due = roundMoney(toSafeNumber(currentDue, 0));
  const remaining = roundMoney(toSafeNumber(remainingCurrent, 0));

  useEffect(() => {
    if (!open) return;
    setAmount(remaining > 0 ? String(remaining) : "");
    setNotes("");
    setCustom(false);
    setError(null);
  }, [open, remaining]);

  const history = useMemo(
    () => [...(payments || [])].sort((a, b) => String(b.date).localeCompare(String(a.date))),
    [payments]
  );

  if (!open || !account) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    const value = roundMoney(toSafeNumber(amount, 0));
    if (!(value > 0)) {
      setError("Captura un monto mayor a cero.");
      return;
    }
    setError(null);
    try {
      await onSubmit({
        accountId: account.id,
        amount: value,
        date: todayISO(),
        notes,
        cycleMonth,
      });
      setNotes("");
    } catch (err) {
      setError(err?.message || "No se pudo registrar el abono.");
    }
  }

  async function handleDelete(payment) {
    setBusyId(payment.id);
    try {
      await onDelete(payment.id);
    } catch (err) {
      setError(err?.message || "No se pudo eliminar el abono.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center lg:items-center">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="Cerrar" />
      <section className="sheet-up relative flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-slate-800 bg-slate-950 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:rounded-3xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/80">Abono a tarjeta</p>
            <h2 className="text-lg font-semibold text-white">Registrar abono / pagar</h2>
            <p className="mt-1 text-xs text-slate-400">
              {account.name} · ciclo {cycleMonth}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-800 p-2 text-slate-300" aria-label="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/80">Pendiente</p>
            <p className="mt-1 text-sm font-semibold text-white">{formatMXN(remaining)}</p>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-200/80">Abonado</p>
            <p className="mt-1 text-sm font-semibold text-white">{formatMXN(paidAmount)}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          <div className="flex flex-wrap gap-2">
            <Shortcut
              active={!custom && roundMoney(toSafeNumber(amount, 0)) === due && due > 0}
              onClick={() => {
                setCustom(false);
                setAmount(String(due));
              }}
              disabled={!(due > 0)}
            >
              Pagar total del corte
            </Shortcut>
            {SHORTCUTS.map((value) => (
              <Shortcut
                key={value}
                active={!custom && roundMoney(toSafeNumber(amount, 0)) === value}
                onClick={() => {
                  setCustom(false);
                  setAmount(String(value));
                }}
              >
                {formatMXN(value)}
              </Shortcut>
            ))}
            <Shortcut
              active={custom}
              onClick={() => {
                setCustom(true);
                setAmount("");
              }}
            >
              Otro monto
            </Shortcut>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">Monto abonado</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => {
                setCustom(true);
                setAmount(event.target.value);
              }}
              className={NUMBER_INPUT}
              placeholder="0.00"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">Nota (opcional)</span>
            <input
              type="text"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
              placeholder='Ej. "Abono quincena"'
            />
          </label>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            <Banknote className="h-4 w-4" />
            {saving ? "Registrando…" : "Confirmar abono"}
          </button>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Abonos de este ciclo</p>
            {history.length ? (
              <ul className="space-y-2">
                {history.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{formatMXN(payment.amount)}</p>
                      <p className="truncate text-[11px] text-slate-400">
                        {payment.date}
                        {payment.notes ? ` · ${payment.notes}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(payment)}
                      disabled={busyId === payment.id}
                      className="rounded-xl p-2 text-rose-300 hover:bg-rose-400/10 disabled:opacity-50"
                      aria-label="Eliminar abono"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-800 px-3 py-6 text-center text-xs text-slate-500">
                Aún no hay abonos en este ciclo.
              </p>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}

function Shortcut({ active, onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
        active
          ? "bg-emerald-400 text-slate-950"
          : "border border-slate-700 bg-slate-900 text-slate-200 hover:border-emerald-400/40"
      } disabled:opacity-40`}
    >
      {children}
    </button>
  );
}
