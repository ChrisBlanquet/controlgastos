import { Landmark, Percent } from "lucide-react";
import { formatMXN } from "../../utils/money";
import { toSafeNumber } from "../../utils/numbers";

export default function LoanCardVisual({ loan, onPay, onEdit }) {
  const initial = toSafeNumber(loan.initialPrincipal, 0);
  const current = toSafeNumber(loan.currentBalance, 0);
  const paid = Math.max(0, initial - current);
  const percent = initial > 0 ? Math.min(100, Math.round((paid / initial) * 100)) : 0;
  const remaining = toSafeNumber(loan.remainingInstallments, 0);
  const paidOff = loan.status === "paid" || remaining <= 0;

  return (
    <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-400/10 text-indigo-300">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{loan.name}</p>
            <p className="text-xs text-slate-400">{loan.institution}</p>
          </div>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            paidOff ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-200"
          }`}
        >
          {paidOff ? "Liquidado" : "Activo"}
        </span>
      </div>

      <p className="text-xs text-slate-400">
        Has liquidado el {percent}% ({formatMXN(paid)} de {formatMXN(initial)})
      </p>
      <div className="mt-2 mb-3 h-2 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-indigo-400 transition-all duration-700" style={{ width: `${percent}%` }} />
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2 text-center">
        <Stat label="Saldo" value={formatMXN(current)} />
        <Stat label="Cuota" value={formatMXN(loan.monthlyPayment)} />
        <Stat label="Restan" value={`${remaining} pagos`} />
      </div>

      {(loan.breakdown?.capital || loan.breakdown?.interest || loan.breakdown?.vat) ? (
        <p className="mb-3 inline-flex items-center gap-1 text-[11px] text-slate-400">
          <Percent className="h-3 w-3" />
          Capital {formatMXN(loan.breakdown.capital)} · Interés {formatMXN(loan.breakdown.interest)} · IVA{" "}
          {formatMXN(loan.breakdown.vat)}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPay(loan)}
          disabled={paidOff}
          className="flex-1 rounded-2xl bg-white py-2.5 text-xs font-semibold text-slate-950 disabled:opacity-40"
        >
          Registrar abono
        </button>
        <button
          type="button"
          onClick={() => onEdit(loan)}
          className="rounded-2xl border border-slate-700 px-3 py-2.5 text-xs font-semibold text-slate-200"
        >
          Editar
        </button>
      </div>
    </article>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-950/70 px-2 py-2">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-xs font-semibold text-white">{value}</p>
    </div>
  );
}
