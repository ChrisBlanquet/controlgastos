import { X } from "lucide-react";
import { formatMXN } from "../../utils/money";
import MonthBreakdown from "./MonthBreakdown";

export default function MonthBreakdownSheet({ open, period, onClose }) {
  if (!open || !period) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <section className="sheet-up relative max-h-[86dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-slate-800 bg-slate-950 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Desglose del mes</p>
            <h2 className="text-lg font-semibold text-white">{period.label}</h2>
            <p className="text-sm font-semibold text-emerald-300">{formatMXN(period.total)}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-800 p-2 text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>
        <MonthBreakdown groups={period.groups} />
      </section>
    </div>
  );
}
