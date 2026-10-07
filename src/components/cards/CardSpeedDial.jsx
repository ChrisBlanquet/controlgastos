import { createPortal } from "react-dom";
import { ArrowDownCircle, Plus, ShoppingBag } from "lucide-react";

export default function CardSpeedDial({ open, onToggle, onExpense, onPay }) {
  return createPortal(
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-[35] bg-slate-950/45 backdrop-blur-[2px] transition-opacity duration-200"
          onClick={onToggle}
          aria-label="Cerrar menú"
        />
      ) : null}

      <div className="pointer-events-none fixed right-4 bottom-20 z-40 flex flex-col items-end gap-3 md:right-6 md:bottom-6">
        <div
          className={`flex flex-col items-end gap-3 transition-all duration-200 ${
            open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
          }`}
        >
          <SpeedAction
            label="Nuevo gasto"
            icon={ShoppingBag}
            className="bg-slate-800 text-white hover:bg-slate-700"
            onClick={onExpense}
          />
          <SpeedAction
            label="Abonar / Pagar corte"
            icon={ArrowDownCircle}
            className="bg-emerald-600 text-white hover:bg-emerald-500"
            onClick={onPay}
          />
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/30"
          aria-label={open ? "Cerrar menú" : "Agregar movimiento"}
          aria-expanded={open}
        >
          <Plus className={`h-7 w-7 transition-transform duration-200 ${open ? "rotate-45" : "rotate-0"}`} />
        </button>
      </div>
    </>,
    document.body
  );
}

function SpeedAction({ label, icon: Icon, className, onClick }) {
  return (
    <div className="pointer-events-auto flex items-center gap-3">
      <span className="rounded-full border border-white/10 bg-slate-950/80 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md">
        {label}
      </span>
      <button
        type="button"
        onClick={onClick}
        className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg backdrop-blur-md transition ${className}`}
        aria-label={label}
      >
        <Icon className="h-5 w-5" />
      </button>
    </div>
  );
}
