import { X } from "lucide-react";

const FILTERS = [
  { id: "all", label: "Todo" },
  { id: "msi", label: "Solo MSI" },
  { id: "pending", label: "Pendiente" },
  { id: "paid", label: "Pagado" },
];

export default function FilterSheet({ open, value, onChange, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <section className="sheet-up relative w-full max-w-md rounded-t-3xl border border-slate-800 bg-slate-950 p-4 lg:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Filtros</h2>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-800 p-2 text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>
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
