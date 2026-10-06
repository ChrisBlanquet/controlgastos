import { useState } from "react";
import { CheckCircle2, Pencil, ShieldAlert, TrendingUp, Wallet } from "lucide-react";
import { formatMonthLabel } from "../../utils/expenses";
import { incomeHealth, incomeTotal } from "../../utils/income";
import { formatMXN } from "../../utils/money";
import EditIncomeModal from "./EditIncomeModal";

const TONE = {
  green: {
    card: "border-emerald-400/20 from-emerald-400/10",
    bar: "bg-emerald-400",
    text: "text-emerald-300",
    Icon: CheckCircle2,
  },
  yellow: {
    card: "border-amber-400/20 from-amber-400/10",
    bar: "bg-amber-400",
    text: "text-amber-300",
    Icon: TrendingUp,
  },
  red: {
    card: "border-rose-400/20 from-rose-500/10",
    bar: "bg-rose-500",
    text: "text-rose-300",
    Icon: ShieldAlert,
  },
};

export default function IncomeCard({ month, income, due, onSave }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const total = incomeTotal(income);
  const health = incomeHealth(total, due);
  const tone = TONE[health.tone];
  const Icon = tone.Icon;
  const usedPercent = Math.min(100, health.used * 100);

  async function handleSubmit(payload) {
    setSaving(true);
    try {
      await onSave(month, payload);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <article className={`w-full min-w-0 overflow-hidden rounded-3xl border bg-gradient-to-br to-slate-900/80 p-4 backdrop-blur ${tone.card}`}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[11px] uppercase tracking-wider text-slate-400">Sueldo vs. compromisos</p>
            <p className="truncate text-sm font-semibold text-white">{formatMonthLabel(month)}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-xl bg-slate-800/80 p-2 text-slate-200"
            aria-label="Editar sueldo"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mb-3 grid w-full grid-cols-3 gap-2 text-center">
          <Metric label="Ingreso" value={total ? formatMXN(total) : "—"} />
          <Metric label="Compromisos" value={formatMXN(due)} />
          <Metric label="Libre" value={total ? formatMXN(health.remaining) : "—"} accent={tone.text} />
        </div>

        <div className="mb-2 h-2 overflow-hidden rounded-full bg-slate-800">
          <div className={`h-full rounded-full transition-all duration-700 ${tone.bar}`} style={{ width: `${usedPercent}%` }} />
        </div>

        <div className={`flex items-start gap-2 text-xs ${tone.text}`}>
          <Icon className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{health.label}</p>
        </div>

        {income?.extraIncome > 0 ? (
          <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-slate-400">
            <Wallet className="h-3 w-3" />
            Base {formatMXN(income.baseSalary)} + extras {formatMXN(income.extraIncome)}
          </p>
        ) : null}
      </article>

      <EditIncomeModal
        open={open}
        month={month}
        income={income}
        saving={saving}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}

function Metric({ label, value, accent }) {
  return (
    <div className="min-w-0 rounded-2xl bg-slate-950/50 px-1.5 py-2 sm:px-2">
      <p className="truncate text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-0.5 truncate text-xs font-semibold sm:text-sm ${accent || "text-white"}`}>{value}</p>
    </div>
  );
}
