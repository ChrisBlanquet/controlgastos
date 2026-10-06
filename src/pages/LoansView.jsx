import { useState } from "react";
import { Landmark, Plus } from "lucide-react";
import AddLoanModal from "../components/loans/AddLoanModal";
import LoanCardVisual from "../components/loans/LoanCardVisual";
import { formatMXN } from "../utils/money";

export default function LoansView({
  loans,
  loading,
  error,
  totalBalance,
  onAdd,
  onEdit,
  onDelete,
  onPay,
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(loan) {
    setEditing(loan);
    setOpen(true);
  }

  async function handleSubmit(payload) {
    setSaving(true);
    try {
      if (editing) await onEdit(editing.id, payload);
      else await onAdd(payload);
      setOpen(false);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("¿Eliminar este préstamo? Esta acción no se puede deshacer.");
    if (!confirmed) return;
    await onDelete(id);
    setOpen(false);
    setEditing(null);
  }

  async function handlePay(loan) {
    const confirmed = window.confirm(
      `¿Registrar un abono de ${formatMXN(loan.monthlyPayment)} a ${loan.name}?`
    );
    if (!confirmed) return;
    await onPay(loan);
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Préstamos personales</h1>
          <p className="text-sm text-slate-400">Klar, bancos y financieras con desglose de cuota</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-950"
        >
          <Plus className="h-3.5 w-3.5" />
          Nuevo préstamo
        </button>
      </div>

      <article className="mb-5 rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-400/10 to-slate-950 p-4">
        <p className="text-[11px] uppercase tracking-wider text-indigo-200/80">Total adeudado</p>
        <p className="mt-1 text-2xl font-semibold text-white">{formatMXN(totalBalance)}</p>
        <p className="mt-1 text-xs text-slate-400">
          {loans.filter((loan) => loan.status !== "paid").length} préstamos activos
        </p>
      </article>

      {error ? <p className="mb-3 text-sm text-rose-300">{error}</p> : null}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-48 animate-pulse rounded-3xl bg-slate-900" />
          <div className="h-48 animate-pulse rounded-3xl bg-slate-900" />
        </div>
      ) : loans.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {loans.map((loan) => (
            <LoanCardVisual key={loan.id} loan={loan} onPay={handlePay} onEdit={openEdit} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-16 text-center">
          <Landmark className="mx-auto mb-3 h-8 w-8 text-slate-500" />
          <p className="text-sm font-semibold text-white">Aún no hay préstamos</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
            Registra un crédito personal, Klar o nómina para ver cuotas, saldo y progreso de liquidación.
          </p>
        </div>
      )}

      <AddLoanModal
        open={open}
        loan={editing}
        saving={saving}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}
