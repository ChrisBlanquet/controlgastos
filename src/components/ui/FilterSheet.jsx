import { X } from "lucide-react";

const FILTERS = [
  { id: "all", label: "Todo" },
  { id: "msi", label: "Solo MSI" },
  { id: "pending", label: "Pendiente" },
  { id: "paid", label: "Pagado" },
];

const VIEW_OPTIONS = [
  { id: "cutoff", label: "Por Ciclo de Corte" },
  { id: "calendar", label: "Mes Natural" },
];

export default function FilterSheet({
  open,
  value,
  onChange,
  viewMode,
  onViewModeChange,
  onClose,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center lg:items-center">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <section className="sheet-up relative w-full max-w-md rounded-t-3xl border border-slate-800 bg-slate-950 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Filtros</h2>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-800 p-2 text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Agrupación de fechas</p>
          <div className="flex rounded-2xl border border-slate-800 bg-slate-900/70 p-1">
            {VIEW_OPTIONS.map((option) => {
              const active = viewMode === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onViewModeChange(option.id)}
                  className={`flex-1 rounded-xl px-2 py-2.5 text-[11px] font-semibold leading-tight transition duration-200 ${
                    active ? "bg-emerald-400 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tipo de movimiento</p>
        <div className="grid grid-cols-2 gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => {
                onChange(filter.id);
                onClose();
              }}
              className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                value === filter.id
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                  : "border-slate-800 bg-slate-900/60 text-slate-300"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
