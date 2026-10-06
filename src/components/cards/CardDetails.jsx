import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Pencil,
  Wallet,
} from "lucide-react";
import { getCardCycle, formatShortDate } from "../../utils/cardDates";
import {
  availableCredit,
  formatMXN,
  utilization,
  utilizationTone,
} from "../../utils/money";

export default function CardDetails({ account, onEdit }) {
  if (!account) return null;

  const cycle = getCardCycle(account.cutoffDay, account.paymentDueDays);
  const used = utilization(account.currentBalance, account.creditLimit);
  const tone = utilizationTone(used);
  const available = availableCredit(account.currentBalance, account.creditLimit);

  return (
    <section className="mx-4 mt-4 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 p-4 lg:mx-0">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Detalle</p>
          <h3 className="text-base font-semibold text-white">{account.name}</h3>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 rounded-xl bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </button>
      </div>

      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-slate-400">Utilización</span>
          <span className={`font-semibold ${tone.text}`}>
            {used.toFixed(0)}% · {tone.label}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${tone.bar}`}
            style={{ width: `${used}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Metric
          icon={Wallet}
          label="Saldo actual"
          value={formatMXN(account.currentBalance)}
        />
        <Metric
          icon={CheckCircle2}
          label="Disponible"
          value={formatMXN(available)}
        />
        <Metric
          icon={Calendar}
          label="Próximo corte"
          value={`${cycle.daysUntilCutoff} días`}
          hint={formatShortDate(cycle.nextCutoff)}
        />
        <Metric
          icon={AlertTriangle}
          label="Fecha límite"
          value={`${cycle.daysUntilPayment} días`}
          hint={formatShortDate(cycle.paymentDue)}
        />
      </div>
    </section>
  );
}

function Metric({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl bg-slate-950/80 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        <p className="text-[11px] uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-sm font-semibold text-white">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p> : null}
    </div>
  );
}
