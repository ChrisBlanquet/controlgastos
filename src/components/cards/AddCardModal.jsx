import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CreditCard, Plus, Wallet, X } from "lucide-react";
import { BANKS, BANK_THEME, CARD_THEMES, CUSTOM_BANK, isKnownBank } from "../../constants/banks";
import { toSafeNumber } from "../../utils/numbers";
import CreditCardVisual from "./CreditCardVisual";

const INPUT_BASE =
  "w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/50 focus:shadow-[0_0_0_4px_rgba(52,211,153,0.12)]";

const NUMBER_INPUT =
  `${INPUT_BASE} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;

const EMPTY_FORM = {
  name: "",
  bank: "nu",
  customBank: "",
  type: "credit_card",
  creditLimit: "",
  currentBalance: "",
  cutoffDay: "15",
  paymentDueDays: "20",
  interestRate: "",
  themeColor: BANK_THEME.nu,
  lastFour: "",
  issuer: "mastercard",
  customColor: "#820AD1",
  useCustomColor: false,
  includeCutoffDayInCycle: false,
};

function toFormValues(account) {
  if (!account) return EMPTY_FORM;

  const isCustomTheme =
    String(account.themeColor || "").startsWith("#") ||
    String(account.themeColor || "").startsWith("hex:");
  const knownBank = isKnownBank(account.bank);
  const legacyNames = { hey: "Hey Banco" };

  return {
    name: account.name ?? "",
    bank: knownBank ? account.bank : "otro",
    customBank: knownBank
      ? ""
      : account.customBank || legacyNames[account.bank] || "",
    type: account.type ?? "credit_card",
    creditLimit: account.creditLimit ?? "",
    currentBalance: account.currentBalance ?? "",
    cutoffDay: account.cutoffDay ?? "15",
    paymentDueDays: account.paymentDueDays ?? "20",
    interestRate: account.interestRate ?? "",
    themeColor: isCustomTheme ? CARD_THEMES[0].className : account.themeColor,
    lastFour: account.lastFour ?? "",
    issuer: account.issuer ?? "visa",
    customColor: isCustomTheme ? String(account.themeColor).replace("hex:", "") : "#820AD1",
    useCustomColor: isCustomTheme,
    includeCutoffDayInCycle: account.includeCutoffDayInCycle === true,
  };
}

function buildPayload(form) {
  return {
    name: form.name.trim(),
    bank: form.bank,
    customBank: form.bank === "otro" ? form.customBank.trim() : null,
    type: form.type,
    creditLimit: toSafeNumber(form.creditLimit, 0),
    currentBalance: toSafeNumber(form.currentBalance, 0),
    cutoffDay: toSafeNumber(form.cutoffDay, 1),
    paymentDueDays: toSafeNumber(form.paymentDueDays, 20),
    interestRate: form.interestRate,
    themeColor: form.useCustomColor ? form.customColor : form.themeColor,
    lastFour: form.lastFour,
    issuer: form.issuer,
    includeCutoffDayInCycle: Boolean(form.includeCutoffDayInCycle),
  };
}

export default function AddCardModal({
  open,
  account,
  saving,
  onClose,
  onSubmit,
  onDelete,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (open) {
      setForm(toFormValues(account));
      setErrors({});
      setSubmitError(null);
    }
  }, [open, account]);

  const preview = useMemo(
    () => ({
      ...form,
      creditLimit: toSafeNumber(form.creditLimit, 0),
      currentBalance: toSafeNumber(form.currentBalance, 0),
      themeColor: form.useCustomColor ? form.customColor : form.themeColor,
      lastFour: form.lastFour || "1234",
      name: form.name || "Nueva tarjeta",
      customBank: form.customBank,
    }),
    [form]
  );

  function updateField(field, value) {
    setSubmitError(null);
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === "bank") {
        const bank = BANKS.find((item) => item.id === value);
        next.issuer = bank?.issuer ?? "visa";
        if (!current.useCustomColor) {
          next.themeColor = BANK_THEME[value] ?? BANK_THEME.otro;
        }

        const previousLabel = BANKS.find((item) => item.id === current.bank)?.label;
        const wasDefaultName =
          !current.name ||
          current.name === `${previousLabel ?? ""} Crédito` ||
          current.name === "Tarjeta personalizada";

        if (value === "otro") {
          if (wasDefaultName) next.name = current.customBank || "";
        } else if (wasDefaultName) {
          next.name = `${bank?.label ?? "Tarjeta"} Crédito`;
        }
      }

      return next;
    });
  }

  function validate() {
    const nextErrors = {};
    const limit = toSafeNumber(form.creditLimit, NaN);
    const balance = form.currentBalance === "" ? 0 : toSafeNumber(form.currentBalance, NaN);
    const cutoffDay = toSafeNumber(form.cutoffDay, NaN);
    const paymentDueDays = toSafeNumber(form.paymentDueDays, NaN);

    if (form.name.trim().length < 2) nextErrors.name = "Escribe un nombre.";
    if (form.bank === "otro" && form.customBank.trim().length < 2) {
      nextErrors.customBank = "Escribe el banco o institución.";
    }
    if (!Number.isFinite(limit) || limit <= 0) nextErrors.creditLimit = "El límite debe ser mayor a 0.";
    if (!Number.isFinite(balance) || balance < 0) {
      nextErrors.currentBalance = "El saldo no puede ser negativo.";
    } else if (Number.isFinite(limit) && balance > limit) {
      nextErrors.currentBalance = "El saldo no puede superar el límite.";
    }
    if (!Number.isFinite(cutoffDay) || cutoffDay < 1 || cutoffDay > 31) {
      nextErrors.cutoffDay = "Día entre 1 y 31.";
    }
    if (!Number.isFinite(paymentDueDays) || paymentDueDays < 1 || paymentDueDays > 45) {
      nextErrors.paymentDueDays = "Usa entre 1 y 45 días.";
    }
    if (form.lastFour && !/^\d{4}$/.test(form.lastFour)) {
      nextErrors.lastFour = "Deben ser 4 dígitos.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    try {
      await onSubmit(buildPayload(form));
    } catch (error) {
      setSubmitError(error?.message || "No se pudo guardar la cuenta.");
    }
  }

  async function handleDelete() {
    if (!account) return;

    try {
      await onDelete(account.id);
    } catch (error) {
      setSubmitError(error?.message || "No se pudo eliminar la cuenta.");
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
              {account ? "Editar cuenta" : "Nueva tarjeta"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-slate-800 p-2 text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-4">
          <CreditCardVisual account={preview} compact />

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "credit_card", label: "Tarjeta", icon: CreditCard },
              { id: "loan", label: "Préstamo", icon: Wallet },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => updateField("type", option.id)}
                className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-medium ${
                  form.type === option.id
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                    : "border-slate-800 bg-slate-900/60 text-slate-300"
                }`}
              >
                <option.icon className="h-4 w-4" />
                {option.label}
              </button>
            ))}
          </div>

          <Field label="Nombre" error={errors.name}>
            <input
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Klar Crédito"
              className={INPUT_BASE}
            />
          </Field>

          <div>
            <p className="mb-2 text-xs font-medium text-slate-400">Banco</p>
            <div className="flex flex-wrap gap-2">
              {BANKS.map((bank) => (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => updateField("bank", bank.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    form.bank === bank.id
                      ? "bg-white text-slate-950"
                      : "border border-slate-800 bg-slate-900/60 text-slate-300"
                  }`}
                >
                  {bank.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => updateField("bank", CUSTOM_BANK.id)}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  form.bank === "otro"
                    ? "bg-indigo-400 text-slate-950"
                    : "border border-slate-800 bg-slate-900/60 text-slate-300"
                }`}
              >
                <Plus className="h-3 w-3" />
                Otro / Personalizado
              </button>
            </div>

            {form.bank === "otro" ? (
              <div className="mt-3">
                <Field label="Institución" error={errors.customBank}>
                  <input
                    value={form.customBank}
                    onChange={(event) => updateField("customBank", event.target.value)}
                    placeholder="Hey Banco, Liverpool, Coppel..."
                    className={INPUT_BASE}
                    autoFocus
                  />
                </Field>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Límite" error={errors.creditLimit}>
              <AffixInput prefix="$">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.creditLimit}
                  onChange={(event) => updateField("creditLimit", event.target.value)}
                  placeholder="25,000"
                  className={`${NUMBER_INPUT} pl-8`}
                />
              </AffixInput>
            </Field>
            <Field label="Saldo actual" error={errors.currentBalance}>
              <AffixInput prefix="$">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.currentBalance}
                  onChange={(event) => updateField("currentBalance", event.target.value)}
                  placeholder="0"
                  className={`${NUMBER_INPUT} pl-8`}
                />
              </AffixInput>
            </Field>
            <Field label="Día de corte" error={errors.cutoffDay}>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max="31"
                value={form.cutoffDay}
                onChange={(event) => updateField("cutoffDay", event.target.value)}
                className={NUMBER_INPUT}
              />
            </Field>
            <Field label="Días para pagar" error={errors.paymentDueDays}>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max="45"
                value={form.paymentDueDays}
                onChange={(event) => updateField("paymentDueDays", event.target.value)}
                className={NUMBER_INPUT}
              />
            </Field>
            <Field label="Últimos 4" error={errors.lastFour}>
              <input
                inputMode="numeric"
                maxLength={4}
                value={form.lastFour}
                onChange={(event) =>
                  updateField("lastFour", event.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="1234"
                className={INPUT_BASE}
              />
            </Field>
            <Field label="CAT / tasa anual" hint="Opcional">
              <AffixInput suffix="%">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.interestRate}
                  onChange={(event) => updateField("interestRate", event.target.value)}
                  placeholder="—"
                  className={`${NUMBER_INPUT} pr-8`}
                />
              </AffixInput>
            </Field>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={form.includeCutoffDayInCycle}
            onClick={() => updateField("includeCutoffDayInCycle", !form.includeCutoffDayInCycle)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-left"
          >
            <span>
              <span className="block text-sm font-semibold text-white">¿Compras en el día de corte?</span>
              <span className="mt-0.5 block text-[11px] text-slate-400">
                {form.includeCutoffDayInCycle
                  ? "Entran en el corte actual (Bancos tradicionales)."
                  : "Pasan al próximo corte (Recomendado para Nu y Fintechs)."}
              </span>
            </span>
            <span
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                form.includeCutoffDayInCycle ? "bg-emerald-400" : "bg-slate-700"
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition ${
                  form.includeCutoffDayInCycle ? "left-5" : "left-0.5"
                }`}
              />
            </span>
          </button>

          <div>
            <p className="mb-2 text-xs font-medium text-slate-400">Color de la tarjeta</p>
            <div className="grid grid-cols-5 gap-2">
              {CARD_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  title={theme.label}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      themeColor: theme.className,
                      useCustomColor: false,
                    }))
                  }
                  className={`h-10 rounded-xl bg-gradient-to-br ${theme.className} ${
                    !form.useCustomColor && form.themeColor === theme.className
                      ? "ring-2 ring-white"
                      : "ring-1 ring-white/10"
                  }`}
                />
              ))}
            </div>
            <label className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-2">
              <input
                type="color"
                value={form.customColor}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    customColor: event.target.value,
                    useCustomColor: true,
                  }))
                }
                className="h-9 w-9 cursor-pointer rounded-lg border-0 bg-transparent"
              />
              <span className="text-sm text-slate-200">Color personalizado</span>
            </label>
          </div>

          {submitError ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-3 text-sm text-rose-200"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {submitError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-white py-3.5 text-sm font-semibold text-slate-950 transition active:scale-[0.99] disabled:opacity-60"
          >
            {saving ? "Guardando…" : account ? "Guardar cambios" : "Agregar tarjeta"}
          </button>

          {account ? (
            <button
              type="button"
              onClick={handleDelete}
              className="w-full pb-2 text-sm font-medium text-rose-400"
            >
              Eliminar cuenta
            </button>
          ) : null}
        </form>
      </section>
    </div>
  );
}

function AffixInput({ prefix, suffix, children }) {
  return (
    <div className="relative">
      {prefix ? (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
          {prefix}
        </span>
      ) : null}
      {children}
      {suffix ? (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
          {suffix}
        </span>
      ) : null}
    </div>
  );
}

function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-400">
        {label}
        {hint ? <span className="font-normal text-slate-600">{hint}</span> : null}
      </span>
      {children}
      {error ? <span className="mt-1 block text-xs text-rose-400">{error}</span> : null}
    </label>
  );
}
