import { Calendar, CreditCard } from "lucide-react";
import CreditCardVisual from "./CreditCardVisual";
import { getCardCycle } from "../../utils/cardDates";

export default function CardList({ accounts, selectedId, onSelect }) {
  if (!accounts.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 px-5 py-10 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10">
          <CreditCard className="h-6 w-6 text-emerald-300" />
        </div>
        <p className="text-sm font-semibold text-white">Aún no hay tarjetas</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          Agrega tu Klar, Nu o cualquier crédito para ver cortes, pagos y utilización.
        </p>
      </div>
    );
  }

  return (
    <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 lg:snap-none lg:flex-col lg:overflow-visible">
      {accounts.map((account) => {
        const cycle = getCardCycle(account.cutoffDay, account.paymentDueDays);

        return (
          <div key={account.id} className="w-[86%] shrink-0 snap-center lg:w-full">
            <CreditCardVisual
              account={account}
              selected={account.id === selectedId}
              onClick={() => onSelect(account.id)}
            />
            <div className="mt-2 flex justify-center">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  cycle.badge.type === "payment"
                    ? "bg-amber-400/15 text-amber-200"
                    : "bg-emerald-400/15 text-emerald-200"
                }`}
              >
                <Calendar className="h-3 w-3" />
                {cycle.badge.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
