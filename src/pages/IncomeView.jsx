import IncomeCard from "../components/incomes/IncomeCard";
import MonthNav from "../components/ui/MonthNav";
import { formatMonthLabel } from "../utils/expenses";
import { incomeTotal } from "../utils/income";
import { formatMXN } from "../utils/money";

export default function IncomeView({
  month,
  onMonthChange,
  income,
  incomes,
  due,
  onSave,
}) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-white">Sueldo e ingresos</h1>
        <p className="text-sm text-slate-400">Registra el ingreso estimado de cada mes</p>
      </div>

      <MonthNav value={month} onChange={onMonthChange} />
      <IncomeCard month={month} income={income} due={due} onSave={onSave} />

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
        <h2 className="mb-3 text-sm font-semibold text-white">Historial</h2>
        {incomes.length ? (
          <div className="space-y-2">
            {incomes.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl bg-slate-950/70 px-3 py-3"
              >
                <p className="text-sm text-slate-200">{formatMonthLabel(item.monthYear || item.month || item.id)}</p>
                <p className="text-sm font-semibold text-white">{formatMXN(incomeTotal(item))}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Todavía no hay sueldos guardados.</p>
        )}
      </section>
    </div>
  );
}
