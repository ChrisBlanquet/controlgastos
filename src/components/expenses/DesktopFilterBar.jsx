export default function DesktopFilterBar({ accounts, categories, filters, onChange }) {
  const allActive =
    !filters.accountId && filters.paymentMode === "all" && filters.status === "all" && !filters.categoryId;

  function patch(next) {
    onChange({ ...filters, ...next });
  }

  return (
    <div className="no-scrollbar hidden gap-2 overflow-x-auto pb-1 md:flex">
      <Chip
        active={allActive}
        onClick={() =>
          onChange({ accountId: null, paymentMode: "all", status: "all", categoryId: null })
        }
      >
        Todas
      </Chip>
      <Chip
        active={filters.paymentMode === "msi"}
        onClick={() => patch({ paymentMode: filters.paymentMode === "msi" ? "all" : "msi" })}
      >
        Solo MSI
      </Chip>
      <Chip
        active={filters.status === "pending"}
        onClick={() => patch({ status: filters.status === "pending" ? "all" : "pending" })}
      >
        Pendientes
      </Chip>
      <Chip
        active={filters.status === "paid"}
        onClick={() => patch({ status: filters.status === "paid" ? "all" : "paid" })}
      >
        Pagadas
      </Chip>
      {accounts.map((account) => (
        <Chip
          key={account.id}
          active={filters.accountId === account.id}
          onClick={() => patch({ accountId: filters.accountId === account.id ? null : account.id })}
        >
          {account.name}
        </Chip>
      ))}
      {categories.map((category) => (
        <Chip
          key={category.id}
          active={filters.categoryId === category.id || filters.categoryId === category.name}
          onClick={() =>
            patch({
              categoryId:
                filters.categoryId === category.id || filters.categoryId === category.name
                  ? null
                  : category.id,
            })
          }
        >
          {category.name}
        </Chip>
      ))}
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
        active
          ? "scale-105 bg-white text-slate-950 shadow-lg shadow-white/10"
          : "border border-slate-800 bg-slate-900/60 text-slate-300"
      }`}
    >
      {children}
    </button>
  );
}
