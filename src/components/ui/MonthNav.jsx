import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonthLabel, shiftMonth } from "../../utils/expenses";

export default function MonthNav({
  value,
  onChange,
  label,
  onPrev,
  onNext,
  prevAria = "Periodo anterior",
  nextAria = "Periodo siguiente",
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 px-2 py-1.5">
      <button
        type="button"
        onClick={() => (onPrev ? onPrev() : onChange(shiftMonth(value, -1)))}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-300 transition hover:bg-slate-800"
        aria-label={prevAria}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <p className="min-w-0 flex-1 truncate px-1 text-center text-sm font-semibold capitalize text-white">
        {label || formatMonthLabel(value)}
      </p>
      <button
        type="button"
        onClick={() => (onNext ? onNext() : onChange(shiftMonth(value, 1)))}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-300 transition hover:bg-slate-800"
        aria-label={nextAria}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
