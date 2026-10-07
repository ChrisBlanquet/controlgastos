import { Banknote, Trash2 } from "lucide-react";
import { formatExpenseDate } from "../../utils/expenses";
import { formatMXN } from "../../utils/money";

export default function PaymentHistoryList({ payments, onDelete }) {
  if (!payments.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-12 text-center">
        <Banknote className="mb-3 h-8 w-8 text-slate-500" />
        <p className="text-sm font-semibold text-white">Sin abonos</p>
        <p className="mt-1 text-xs text-slate-400">Los pagos a esta tarjeta en el periodo aparecerán aquí.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2.5">
      {payments.map((payment) => (
        <li
          key={payment.id}
          className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 px-3.5 py-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">{formatMXN(payment.amount)}</p>
            <p className="truncate text-[11px] text-slate-400">
              {formatExpenseDate(payment.date)}
              {payment.notes ? ` · ${payment.notes}` : ""}
            </p>
          </div>
          {onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(payment.id)}
              className="rounded-xl p-2 text-rose-300 hover:bg-rose-400/10"
              aria-label="Eliminar abono"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
