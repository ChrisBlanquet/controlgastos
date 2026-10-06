import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import {
  CATEGORY_COLORS,
  ICON_OPTIONS,
  getCategoryColor,
  getCategoryIcon,
} from "../../constants/categories";
import { INPUT_BASE } from "../../constants/ui";

export default function AddCategoryModal({ open, saving, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Dog");
  const [color, setColor] = useState("emerald");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setName("");
      setIcon("Dog");
      setColor("emerald");
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError("Escribe el nombre de la categoría.");
      return;
    }

    try {
      await onSubmit({ name: name.trim(), icon, color });
      onClose();
    } catch (err) {
      setError(err?.message || "No se pudo guardar la categoría.");
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center lg:items-center">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <section className="sheet-up relative w-full max-w-md rounded-t-3xl border border-slate-800 bg-slate-950 p-4 lg:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Nueva categoría</h2>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-800 p-2 text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">Nombre</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Mascotas, Ropa, Gimnasio..."
              className={INPUT_BASE}
              autoFocus
            />
          </label>

          <div>
            <p className="mb-2 text-xs font-medium text-slate-400">Icono</p>
            <div className="grid grid-cols-6 gap-2">
              {ICON_OPTIONS.map((iconName) => {
                const Icon = getCategoryIcon(iconName);
                const active = icon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={`flex h-11 items-center justify-center rounded-2xl border transition ${
                      active
                        ? `${getCategoryColor(color).chip} border-current`
                        : "border-slate-800 bg-slate-900/60 text-slate-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-slate-400">Color</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setColor(item.id)}
                  className={`h-8 w-8 rounded-full border ${item.icon} ${
                    color === item.id ? "ring-2 ring-white" : "border-transparent"
                  }`}
                  aria-label={item.id}
                />
              ))}
            </div>
          </div>

          {error ? (
            <div className="flex items-start gap-2 text-sm text-rose-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-white py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Agregar categoría"}
          </button>
        </form>
      </section>
    </div>
  );
}
