import { Landmark } from "lucide-react";
import { BankLogo } from "../cards/BankLogo";
import { formatMXN } from "../../utils/money";

export default function MonthBreakdown({ groups }) {
  if (!groups?.length) {
    return <p className="text-sm text-slate-400">No hay compromisos proyectados en este mes.</p>;
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <article key={group.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <GroupMark group={group} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{group.name}</p>
                <p className="truncate text-[11px] capitalize text-slate-500">{group.subtitle}</p>
              </div>
            </div>
            <p className="shrink-0 text-sm font-semibold text-white">{formatMXN(group.total)}</p>
          </div>
          <ul className="space-y-1.5">
            {group.items.map((item) => (
              <li key={`${group.id}-${item.id}-${item.kind}`} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs text-slate-200">{item.label}</p>
                  {item.isLast ? (
                    <span className="mt-1 inline-flex rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                      🎉 ¡Último pago!
                    </span>
                  ) : null}
                </div>
                <p className="shrink-0 text-xs font-semibold text-slate-100">{formatMXN(item.amount)}</p>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function GroupMark({ group }) {
  if (group.type === "loan") {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-400/15 text-indigo-300">
        <Landmark className="h-4 w-4" />
      </div>
    );
  }

  const theme = String(group.themeColor || "");
  const hex = theme.startsWith("hex:") ? theme.slice(4) : theme.startsWith("#") ? theme : "";

  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br text-[10px] ${
        hex ? "" : theme || "from-zinc-400 to-neutral-950"
      }`}
      style={hex ? { backgroundColor: hex } : undefined}
    >
      <BankLogo bank={group.bank} customBank={group.customBank} className="max-w-[2.2rem] text-[10px]" />
    </div>
  );
}
