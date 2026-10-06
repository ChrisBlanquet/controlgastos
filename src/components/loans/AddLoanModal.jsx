import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { INPUT_BASE, NUMBER_INPUT } from "../../constants/ui";
import { roundMoney, toSafeNumber } from "../../utils/numbers";

const INSTITUTIONS = ["Klar", "BBVA", "Santander", "Banorte", "Nu", "Otra"];

const EMPTY = {
  name: "",
  institution: "Klar",
  customInstitution: "",
  initialPrincipal: "",
  currentBalance: "",
  totalInstallments: "12",
  remainingInstallments: "",
  monthlyPayment: "",
  capital: "",
  interest: "",
  vat: "",
  paymentDay: "15",
  vatTouched: false,
};

export default function AddLoanModal({ open, loan, saving, onClose, onSubmit, onDelete }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (!loan) {
      setForm(EMPTY);
    } else {
      const known = INSTITUTIONS.includes(loan.institution);
      setForm({
        name: loan.name ?? "",
        institution: known ? loan.institution : "Otra",
        customInstitution: known ? "" : loan.institution ?? "",
        initialPrincipal: loan.initialPrincipal ?? "",
        currentBalance: loan.currentBalance ?? "",
        totalInstallments: loan.totalInstallments ?? "12",
        remainingInstallments: loan.remainingInstallments ?? "",
        monthlyPayment: loan.monthlyPayment ?? "",
        capital: loan.breakdown?.capital ?? "",
        interest: loan.breakdown?.interest ?? "",
        vat: loan.breakdown?.vat ?? "",
        paymentDay: loan.paymentDay ?? "15",
        vatTouched: Boolean(loan.breakdown?.vat),
      });
    }
    setErrors({});
    setSubmitError(null);
  }, [open, loan]);

  const autoVat = useMemo(() => roundMoney(toSafeNumber(form.interest, 0) * 0.16), [form.interest]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validate() {
    const next = {};
    if (form.name.trim().length < 2) next.name = "Escribe el nombre del préstamo.";
    if (!(toSafeNumber(form.initialPrincipal, 0) > 0)) next.initialPrincipal = "El monto debe ser mayor a 0.";
    if (!(toSafeNumber(form.monthlyPayment, 0) > 0)) next.monthlyPayment = "La cuota mensual es obligatoria.";
    if (toSafeNumber(form.totalInstallments, 0) < 1) next.totalInstallments = "El plazo debe ser de al menos 1.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    const institution =
      form.institution === "Otra" ? form.customInstitution.trim() || "Otra" : form.institution;

    try {
      await onSubmit({
        name: form.name.trim(),
        institution,
        initialPrincipal: toSafeNumber(form.initialPrincipal, 0),
        currentBalance: toSafeNumber(form.currentBalance, form.initialPrincipal),
        totalInstallments: toSafeNumber(form.totalInstallments, 1),
        remainingInstallments: form.remainingInstallments
          ? toSafeNumber(form.remainingInstallments, form.totalInstallments)
          : toSafeNumber(form.totalInstallments, 1),
        monthlyPayment: toSafeNumber(form.monthlyPayment, 0),
        breakdown: {
          capital: toSafeNumber(form.capital, 0),
          interest: toSafeNumber(form.interest, 0),
          vat: form.vatTouched ? toSafeNumber(form.vat, autoVat) : autoVat,
        },
        paymentDay: toSafeNumber(form.paymentDay, 1),
        status: loan?.status ?? "active",
      });
    } catch (error) {
      setSubmitError(error?.message || "No se pudo guardar el préstamo.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <section className="sheet-up relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-slate-800 bg-slate-950 p-5 pb-8 lg:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{loan ? "Editar préstamo" : "Nuevo préstamo"}</h2>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-800 p-2 text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nombre" error={errors.name}>
            <input
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Préstamo Klar"
              className={INPUT_BASE}
            />
          </Field>

          <div>
            <p className="mb-2 text-xs font-medium text-slate-400">Institución</p>
            <div className="flex flex-wrap gap-2">
              {INSTITUTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => update("institution", item)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    form.institution === item ? "bg-white text-slate-950" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            {form.institution === "Otra" ? (
              <input
                value={form.customInstitution}
                onChange={(event) => update("customInstitution", event.target.value)}
                placeholder="Nombre de la financiera"
                className={`${INPUT_BASE} mt-2`}
              />
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MoneyField
              label="Monto prestado"
              error={errors.initialPrincipal}
              value={form.initialPrincipal}
              onChange={(value) => update("initialPrincipal", value)}
            />
            <MoneyField
              label="Saldo restante"
              value={form.currentBalance}
              onChange={(value) => update("currentBalance", value)}
            />
            <Field label="Plazo (pagos)" error={errors.totalInstallments}>
              <input
                type="number"
                inputMode="numeric"
                value={form.totalInstallments}
                onChange={(event) => update("totalInstallments", event.target.value)}
                className={NUMBER_INPUT}
              />
            </Field>
            <Field label="Pagos restantes">
              <input
                type="number"
                inputMode="numeric"
                value={form.remainingInstallments}
                onChange={(event) => update("remainingInstallments", event.target.value)}
                placeholder="Igual al plazo"
                className={NUMBER_INPUT}
              />
            </Field>
            <MoneyField
              label="Pago mensual"
              error={errors.monthlyPayment}
              value={form.monthlyPayment}
              onChange={(value) => update("monthlyPayment", value)}
            />
            <Field label="Día de cobro">
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max="31"
                value={form.paymentDay}
                onChange={(event) => update("paymentDay", event.target.value)}
                className={NUMBER_INPUT}
              />
            </Field>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
            <p className="mb-2 text-xs font-medium text-slate-400">Desglose opcional de la cuota</p>
            <div className="grid grid-cols-3 gap-2">
              <MoneyField label="Capital" value={form.capital} onChange={(value) => update("capital", value)} compact />
              <MoneyField label="Interés" value={form.interest} onChange={(value) => update("interest", value)} compact />
              <MoneyField
                label="IVA 16%"
                value={form.vatTouched ? form.vat : autoVat || ""}
                onChange={(value) => setForm((current) => ({ ...current, vat: value, vatTouched: true }))}
                compact
              />
            </div>
          </div>

          {submitError ? (
            <p className="flex items-start gap-2 text-sm text-rose-300">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              {submitError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-white py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            {saving ? "Guardando…" : loan ? "Guardar cambios" : "Registrar préstamo"}
          </button>
          {loan ? (
            <button type="button" onClick={() => onDelete(loan.id)} className="w-full text-sm text-rose-400">
              Eliminar préstamo
            </button>
          ) : null}
        </form>
      </section>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-rose-400">{error}</span> : null}
    </label>
  );
}

function MoneyField({ label, value, onChange, error, compact }) {
  return (
    <Field label={label} error={error}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${NUMBER_INPUT} ${compact ? "px-2 pl-7 text-xs" : "pl-8"}`}
        />
      </div>
    </Field>
  );
}
