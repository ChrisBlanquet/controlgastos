import { CreditCard, LogOut, Plus } from "lucide-react";
import { NAV_ITEMS } from "../../constants/nav";

export default function AppLayout({
  activeTab,
  onNavigate,
  user,
  onLogout,
  onAddExpense,
  showFab = true,
  children,
}) {
  const displayName = user?.displayName || "Usuario";
  const photoURL = user?.photoURL;

  return (
    <div className="min-h-dvh overflow-x-hidden bg-slate-950 text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-800 bg-slate-950/95 px-4 py-5 backdrop-blur md:flex">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/15 ring-1 ring-emerald-400/30">
            <CreditCard className="h-5 w-5 text-emerald-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Control de Pagos</p>
            <p className="text-[11px] text-slate-500">Finanzas personales</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  active
                    ? "bg-emerald-400/10 text-emerald-200 shadow-[0_0_20px_rgba(52,211,153,0.08)]"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <div className="mb-3 flex items-center gap-3">
            {photoURL ? (
              <img
                src={photoURL}
                alt={displayName}
                referrerPolicy="no-referrer"
                className="h-10 w-10 rounded-full object-cover ring-2 ring-emerald-400/30"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-emerald-300">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{displayName}</p>
              <p className="truncate text-[11px] text-slate-500">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur md:hidden">
          <div className="mx-auto flex w-full max-w-md items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/15">
              <CreditCard className="h-5 w-5 text-emerald-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">Control de Pagos</p>
              <p className="truncate text-xs text-slate-400">{displayName}</p>
            </div>
          </div>
        </header>

        <main className="mx-auto min-h-[calc(100dvh-4rem)] w-full max-w-md overflow-x-hidden px-4 pb-24 pt-5 md:max-w-none md:min-h-dvh md:px-8 md:py-6 md:pb-8">
          {children}
        </main>
      </div>

      {showFab ? (
        <button
          type="button"
          onClick={onAddExpense}
          className="fab fixed right-4 bottom-20 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 md:bottom-8"
          aria-label="Agregar gasto"
        >
          <Plus className="h-7 w-7" />
        </button>
      ) : null}

      <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto w-full max-w-md border-t border-slate-800 bg-slate-950/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
        <div className="grid grid-cols-5 items-center px-1 pt-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`flex min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 py-1.5 text-[10px] font-medium leading-tight ${
                  active ? "text-emerald-300" : "text-slate-500"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="w-full truncate text-center">{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
