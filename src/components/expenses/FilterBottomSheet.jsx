import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getCategoryColor, getCategoryIcon } from "../../constants/categories";
import { DEFAULT_HOME_FILTERS } from "../../utils/filters";

export default function FilterBottomSheet({
  open,
  accounts,
  categories,
  filters,
  onApply,
  onClose,
}) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  if (!open) return null;

  function setField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Cerrar filtros"
        onClick={onClose}
      />

      <section className="sheet-up relative max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:rounded-2xl lg:max-w-lg">
        <div className="mb-5">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-700 lg:hidden" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Filtrar movimientos</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-slate-800 p-2 text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <Section title="Cuenta / Tarjeta">
            <Chip
              active={!draft.accountId}
              onClick={() => setField("accountId", null)}
            >
              Todas las tarjetas
            </Chip>
            {accounts.map((account) => (
              <Chip
                key={account.id}
                active={draft.accountId === account.id}
                onClick={() => setField("accountId", account.id)}
              >
                {account.name}
              </Chip>
            ))}
          </Section>

          <Section title="Modalidad de pago">
            <Chip active={draft.paymentMode === "all"} onClick={() => setField("paymentMode", "all")}>
              Todas
            </Chip>
            <Chip
              active={draft.paymentMode === "contado"}
              onClick={() => setField("paymentMode", "contado")}
            >
              Una sola exhibición (Contado)
            </Chip>
            <Chip active={draft.paymentMode === "msi"} onClick={() => setField("paymentMode", "msi")}>
              Meses Sin Intereses (MSI)
            </Chip>
          </Section>

          <Section title="Estado de pago">
            <Chip active={draft.status === "all"} onClick={() => setField("status", "all")}>
              Todos
            </Chip>
            <Chip
              active={draft.status === "pending"}
              onClick={() => setField("status", "pending")}
            >
              Solo pendientes
            </Chip>
            <Chip active={draft.status === "paid"} onClick={() => setField("status", "paid")}>
              Solo pagados
            </Chip>
          </Section>

          <Section title="Categoría">
            <Chip active={!draft.categoryId} onClick={() => setField("categoryId", null)}>
              Todas
            </Chip>
            {categories.map((category) => {
              const Icon = getCategoryIcon(category.icon);
              const tone = getCategoryColor(category.color);
              const active = draft.categoryId === category.id || draft.categoryId === category.name;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setField("categoryId", category.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                    active ? `scale-105 ${tone.chip}` : "border-slate-800 bg-slate-950/50 text-slate-300"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {category.name}
                </button>
              );
            })}
          </Section>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDraft(DEFAULT_HOME_FILTERS)}
            className="rounded-2xl border border-slate-700 bg-slate-950/60 py-3 text-sm font-semibold text-slate-200"
          >
            Restablecer
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="rounded-2xl bg-emerald-400 py-3 text-sm font-semibold text-slate-950"
          >
            Aplicar filtros
          </button>
        </div>
      </section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-slate-400">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
        active
          ? "scale-105 bg-white text-slate-950 shadow-lg shadow-white/10"
          : "border border-slate-800 bg-slate-950/50 text-slate-300"
      }`}
    >
      {children}
    </button>
  );
}
