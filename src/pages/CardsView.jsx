import { Plus } from "lucide-react";
import CardList from "../components/cards/CardList";

export default function CardsView({
  accounts,
  loading,
  error,
  onAdd,
  onSelect,
}) {
  const cards = accounts.filter((account) => account.type !== "loan");

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Mis tarjetas</h1>
          <p className="text-sm text-slate-400">Administra plásticos, límites y cortes</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-400 px-3 py-2 text-xs font-semibold text-slate-950"
        >
          <Plus className="h-3.5 w-3.5" />
          Nueva tarjeta
        </button>
      </div>

      {loading ? (
        <div className="h-48 animate-pulse rounded-3xl bg-slate-900" />
      ) : (
        <CardList accounts={cards} onSelect={onSelect} />
      )}
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
