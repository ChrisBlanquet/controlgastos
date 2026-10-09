import { Sparkles } from "lucide-react";
import { NUMBER_INPUT } from "../../constants/ui";
import { STRATEGIES } from "../../utils/decisionCenter";
import { formatMXN } from "../../utils/money";
import { roundMoney, toSafeNumber } from "../../utils/numbers";

export default function PaymentSimulator({
  amount,
  onAmountChange,
  strategy,
  onStrategyChange,
  plan,
  shortcuts = [],
}) {
  return (
    <section className="rounded-3xl border border-violet-400/25 bg-gradient-to-br from-violet-400/10 via-slate-950 to-emerald-400/10 p-4 shadow-[0_0_40px_rgba(167,139,250,0.08)]">
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-200/80">Pago inteligente</p>
        <h2 className="text-lg font-semibold text-white">¿Cuánto tienes para pagar?</h2>
        <p className="mt-1 text-xs text-slate-400">Reparte el dinero en vivo según la estrategia que elijas.</p>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-400">Dinero disponible</span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={amount}
          onChange={(event) => onAmountChange(event.target.value)}
          className={NUMBER_INPUT}
          placeholder="5000"
        />
      </label>

      {shortcuts.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {shortcuts.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => onAmountChange(String(chip.value))}
              className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] font-semibold text-slate-200"
            >
              {chip.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-4 grid gap-2">
        {STRATEGIES.map((item) => {
          const active = strategy === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onStrategyChange(item.id)}
              className={`rounded-2xl border px-3 py-2.5 text-left transition ${
                active
                  ? "border-emerald-400/40 bg-emerald-400/10"
                  : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-white">{item.label}</span>
                {item.recommended ? (
                  <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                    Recomendado
                  </span>
                ) : null}
              </span>
              <span className="mt-0.5 block text-[11px] text-slate-400">{item.hint}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-2">
        {plan.distribution.length ? (
          plan.distribution.map((row) => (
            <article key={row.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{row.name}</p>
                  <p className="text-[11px] text-slate-400">Exigible {formatMXN(row.remaining)}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-emerald-300">{formatMXN(row.assigned)}</p>
              </div>
              <p className="mt-1 text-[11px] font-medium text-slate-300">
                {row.covered
                  ? "Cubierto al 100% ✅"
                  : row.partial
                    ? `Te faltarían ${formatMXN(row.shortfall)} para no generar intereses ⚠️`
                    : row.assigned <= 0.01
                      ? `Sin asignación · faltan ${formatMXN(row.shortfall)} ⚠️`
                      : `Te faltarían ${formatMXN(row.shortfall)} ⚠️`}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${row.covered ? "bg-emerald-400" : "bg-violet-400"}`}
                  style={{ width: `${Math.min(100, (row.assigned / Math.max(row.remaining, 0.01)) * 100)}%` }}
                />
              </div>
            </article>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-800 px-3 py-6 text-center text-xs text-slate-500">
            No hay vencimientos en este mes para repartir.
          </p>
        )}
      </div>

      <p className="mt-4 inline-flex items-start gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2.5 text-sm text-emerald-100">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{plan.impact}</span>
      </p>
      {roundMoney(toSafeNumber(plan.leftover, 0)) > 0.01 ? (
        <p className="mt-2 text-[11px] text-slate-400">Sobra {formatMXN(plan.leftover)} para adelantar o ahorrar.</p>
      ) : null}
    </section>
  );
}
