import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonthLabel, shiftMonth } from "../../utils/expenses";

export default function MonthNav({ value, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 px-2 py-1.5">
      <button
        type="button"
        onClick={() => onChange(shiftMonth(value, -1))}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-300 transition hover:bg-slate-800"
        aria-label="Mes anterior"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <p className="text-sm font-semibold capitalize text-white">{formatMonthLabel(value)}</p>
      <button
        type="button"
        onClick={() => onChange(shiftMonth(value, 1))}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-300 transition hover:bg-slate-800"
        aria-label="Mes siguiente"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
