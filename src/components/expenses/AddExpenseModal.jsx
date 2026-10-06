import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Plus, Sparkles, X } from "lucide-react";
import { MSI_TERMS, getCategoryColor, getCategoryIcon } from "../../constants/categories";
import { INPUT_BASE, NUMBER_INPUT } from "../../constants/ui";
import AddCategoryModal from "../categories/AddCategoryModal";
import TitleAutocomplete from "./TitleAutocomplete";
import { calcMonthlyPayment, todayISO } from "../../utils/expenses";
import { toOptionalNumber, toSafeNumber } from "../../utils/numbers";

const EMPTY_FORM = {
  accountId: "",
  title: "",
  category: "Alimentos",
  purchaseDate: todayISO(),
  totalAmount: "",
  isMsi: false,
  totalInstallments: 12,
  monthlyPayment: "",
  cashbackEarned: "",
  monthlyTouched: false,
};

function toFormValues(expense, accounts) {
  if (!expense) {
    return {
      ...EMPTY_FORM,
      purchaseDate: todayISO(),
      accountId: accounts[0]?.id ?? "",
    };
  }

  return {
    accountId: expense.accountId ?? accounts[0]?.id ?? "",
    title: expense.title ?? "",
    category: expense.category ?? "Otro",
    purchaseDate: expense.purchaseDate ?? todayISO(),
    totalAmount: expense.totalAmount ?? "",
    isMsi: Boolean(expense.isMsi),
    totalInstallments: expense.totalInstallments ?? 12,
    monthlyPayment: expense.monthlyPayment ?? "",
    cashbackEarned: expense.cashbackEarned || "",
    monthlyTouched: true,
  };
}

export default function AddExpenseModal({
  open,
  accounts,
  expense,
  saving,
  defaultAccountId,
  lockAccount = false,
  categories = [],
  expenses = [],
  onCreateCategory,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);

  useEffect(() => {
    if (!open) return;
    const values = toFormValues(expense, accounts);
    if (!expense && defaultAccountId) values.accountId = defaultAccountId;
    setForm(values);
    setErrors({});
    setSubmitError(null);
  }, [open, expense, accounts, defaultAccountId]);

  const computedMonthly = useMemo(
    () => calcMonthlyPayment(form.totalAmount, form.isMsi ? form.totalInstallments : 1),
    [form.totalAmount, form.isMsi, form.totalInstallments]
  );

  function updateField(field, value) {
    setSubmitError(null);
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "totalAmount" || field === "totalInstallments" || field === "isMsi") {
        if (!current.monthlyTouched || field === "isMsi") {
          next.monthlyPayment = "";
          if (field === "isMsi") next.monthlyTouched = false;
        }
      }
      if (field === "monthlyPayment") next.monthlyTouched = true;
      return next;
    });
  }

  function validate() {
    const nextErrors = {};
    if (!form.accountId) nextErrors.accountId = "Elige una tarjeta o préstamo.";
    if (form.title.trim().length < 2) nextErrors.title = "Escribe el concepto.";
    if (!(toSafeNumber(form.totalAmount, 0) > 0)) nextErrors.totalAmount = "El monto debe ser mayor a 0.";
    if (!form.purchaseDate) nextErrors.purchaseDate = "Elige una fecha.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    const installments = form.isMsi ? toSafeNumber(form.totalInstallments, 12) : 1;
    const monthly = form.monthlyTouched
      ? toSafeNumber(form.monthlyPayment, computedMonthly)
      : computedMonthly;

    try {
      await onSubmit({
        accountId: form.accountId,
        title: form.title.trim(),
        category: form.category,
        purchaseDate: form.purchaseDate,
        totalAmount: toSafeNumber(form.totalAmount, 0),
        isMsi: form.isMsi,
        totalInstallments: installments,
        remainingInstallments: expense
          ? Math.min(installments, toSafeNumber(expense.remainingInstallments, installments))
          : installments,
        monthlyPayment: monthly,
        cashbackEarned: toOptionalNumber(form.cashbackEarned) ?? 0,
        status: expense?.status ?? "pending",
      });
    } catch (error) {
      setSubmitError(error?.message || "No se pudo guardar el gasto.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Cerrar"
        onClick={onClose}
      />

      <section className="sheet-up relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-slate-800 bg-slate-950 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl lg:max-w-lg lg:rounded-3xl">
        <div className="sticky top-0 z-10 bg-slate-950/95 px-4 pb-3 pt-3 backdrop-blur">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-700 lg:hidden" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {expense ? "Editar gasto" : "Nuevo gasto"}
            </h2>
            <button type="button" onClick={onClose} className="rounded-full bg-slate-800 p-2 text-slate-300">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-4">
          <div>
            <p className="mb-2 text-xs font-medium text-slate-400">
              {lockAccount ? "Se registrará en" : "Tarjeta o préstamo"}
            </p>
            {lockAccount ? (
              <LockedAccountChip account={accounts.find((item) => item.id === form.accountId)} />
            ) : (
              <div className="flex flex-wrap gap-2">
                {accounts.map((account) => {
                  const active = form.accountId === account.id;
                  return (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => updateField("accountId", account.id)}
                      className={`rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                        active
                          ? "border-emerald-400/40 bg-emerald-400/10 text-white shadow-[0_0_16px_rgba(52,211,153,0.12)]"
                          : "border-slate-800 bg-slate-900/60 text-slate-200"
                      }`}
                    >
                      {account.name}
                    </button>
                  );
                })}
              </div>
            )}
            {errors.accountId ? <span className="mt-1 block text-xs text-rose-400">{errors.accountId}</span> : null}
          </div>

          <TitleAutocomplete
            value={form.title}
            expenses={expenses}
            categories={categories}
            error={errors.title}
            onChange={(title) => updateField("title", title)}
            onPick={(title, category) => {
              setForm((current) => ({
                ...current,
                title,
                category: category || current.category,
              }));
            }}
          />

          <div>
            <p className="mb-2 text-xs font-medium text-slate-400">Categoría</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = getCategoryIcon(category.icon);
                const tone = getCategoryColor(category.color);
                const active = form.category === category.id || form.category === category.name;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => updateField("category", category.name)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                      active
                        ? `scale-105 ${tone.chip} shadow-lg`
                        : "scale-100 border-slate-800 bg-slate-900/60 text-slate-300"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {category.name}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setCategoryModalOpen(true)}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-600 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:border-emerald-400/50"
              >
                <Plus className="h-3.5 w-3.5" />
                Nueva Categoría
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-400">Fecha</span>
              <input
                type="date"
                value={form.purchaseDate}
                onChange={(event) => updateField("purchaseDate", event.target.value)}
                className={`${INPUT_BASE} [color-scheme:dark]`}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-400">Monto total</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                  $
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={form.totalAmount}
                  onChange={(event) => updateField("totalAmount", event.target.value)}
                  placeholder="0.00"
                  className={`${NUMBER_INPUT} pl-8`}
                />
              </div>
              {errors.totalAmount ? (
                <span className="mt-1 block text-xs text-rose-400">{errors.totalAmount}</span>
              ) : null}
            </label>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Meses Sin Intereses (MSI)</p>
                <p className="text-xs text-slate-400">Divide la compra y calcula la cuota</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.isMsi}
                onClick={() => updateField("isMsi", !form.isMsi)}
                className={`relative h-7 w-12 rounded-full transition ${
                  form.isMsi ? "bg-emerald-400" : "bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition ${
                    form.isMsi ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            {form.isMsi ? (
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {MSI_TERMS.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => updateField("totalInstallments", term)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        Number(form.totalInstallments) === term
                          ? "bg-emerald-400 text-slate-950"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {term} meses
                    </button>
                  ))}
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-slate-400">
                    Cuota mensual
                  </span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                      $
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={form.monthlyTouched ? form.monthlyPayment : computedMonthly || ""}
                      onChange={(event) => updateField("monthlyPayment", event.target.value)}
                      className={`${NUMBER_INPUT} pl-8`}
                    />
                  </div>
                </label>
              </div>
            ) : null}
          </div>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              Cashback
              <span className="font-normal text-slate-600">Opcional</span>
            </span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-emerald-400">
                + $
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={form.cashbackEarned}
                onChange={(event) => updateField("cashbackEarned", event.target.value)}
                placeholder="0.00"
                className={`${NUMBER_INPUT} pl-11 text-emerald-300`}
              />
            </div>
          </label>

          {submitError ? (
            <div className="flex items-start gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-3 text-sm text-rose-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {submitError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saving || accounts.length === 0}
            className="w-full rounded-2xl bg-white py-3.5 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            {saving ? "Guardando…" : expense ? "Guardar cambios" : "Registrar gasto"}
          </button>
        </form>
      </section>

      <AddCategoryModal
        open={categoryModalOpen}
        saving={savingCategory}
        onClose={() => setCategoryModalOpen(false)}
        onSubmit={async (payload) => {
          setSavingCategory(true);
          try {
            await onCreateCategory?.(payload);
            updateField("category", payload.name);
          } catch (error) {
            throw error;
          } finally {
            setSavingCategory(false);
          }
        }}
      />
    </div>
  );
}

function LockedAccountChip({ account }) {
  if (!account) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-sm text-slate-400">
        Sin tarjeta seleccionada
      </div>
    );
  }

  return (
    <div className="inline-flex rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-3 py-2">
      <p className="text-xs font-semibold text-white">{account.name}</p>
    </div>
  );
}
