import { Lock, X } from "lucide-react";
import { formatMXN } from "../../utils/money";

export default function MonthBreakdownModal({ open, cycle, onClose }) {
  if (!open || !cycle) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center lg:items-center">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="Cerrar" />
      <section className="sheet-up relative flex max-h-[88dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-slate-800 bg-slate-950 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl lg:max-h-[80vh] lg:rounded-3xl">
        <div className="flex items-start justify-between gap-3 px-5 pt-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Desglose de pagos</p>
            <h2 className="truncate text-lg font-semibold text-white">{cycle.label}</h2>
            <p className="mt-1 text-xl font-semibold text-white">{formatMXN(cycle.total)}</p>
            {cycle.settled ? (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                <Lock className="h-3 w-3" />
                Liquidado / Pagado
              </span>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-800 p-2 text-slate-300" aria-label="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto px-5 pb-2">
          {cycle.items.length ? (
            cycle.items.map((item, index) => {
              const allocation = item.allocation;
              const paid = cycle.settled || allocation?.fullyPaid;
              const partial = allocation?.partial;
              return (
              <li
                key={`${item.id}-${item.label}-${index}`}
                className="flex items-start justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{item.title}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {item.kind === "msi" ? (
                      <span className="rounded-full bg-indigo-400/15 px-2 py-0.5 text-[10px] font-semibold text-indigo-200">
                        Mes {item.installment} de {item.totalInstallments} (MSI)
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                        Contado
                      </span>
                    )}
                    {item.isLast ? (
                      <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                        🎉 Último pago
                      </span>
                    ) : null}
                    {paid ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                        <Lock className="h-3 w-3" />
                        Pagado
                      </span>
                    ) : null}
                    {partial ? (
                      <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                        Parcial: {formatMXN(allocation.applied)} / {formatMXN(allocation.charge)}
                      </span>
                    ) : null}
                  </div>
                  {partial ? (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{ width: `${Math.min(100, (allocation.applied / Math.max(allocation.charge, 0.01)) * 100)}%` }}
                      />
                    </div>
                  ) : null}
                </div>
                <p className="shrink-0 text-sm font-semibold text-white">{formatMXN(item.amount)}</p>
              </li>
              );
            })
          ) : (
            <li className="rounded-2xl border border-dashed border-slate-800 px-3 py-8 text-center text-sm text-slate-500">
              Sin compromisos en este ciclo.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
