import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { getCategoryColor, getCategoryIcon, resolveCategory } from "../../constants/categories";
import { formatMXN } from "../../utils/money";

export default function CategoryAccordionItem({
  categoryKey,
  categories,
  total,
  share,
  count,
  open,
  onToggle,
  children,
}) {
  const category = resolveCategory(categoryKey, categories);
  const Icon = getCategoryIcon(category.icon);
  const tone = getCategoryColor(category.color);

  const iconClass = tone.icon.split(" ").find((token) => token.startsWith("text-")) || "text-white";

  return (
    <article className="rounded-2xl">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 text-left transition-all hover:bg-slate-800/60"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex shrink-0 items-center justify-center rounded-xl bg-slate-800/80 p-2.5">
            <Icon className={`h-4 w-4 ${iconClass}`} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{category.name}</p>
            <p className="text-xs text-slate-400">
              {count} {count === 1 ? "movimiento" : "movimientos"} · {share.toFixed(0)}% del periodo
            </p>
          </div>
        </div>
        <div className="ml-3 flex shrink-0 items-center gap-2">
          <p className="text-sm font-bold text-slate-100">{formatMXN(total)}</p>
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"}`}
          />
        </div>
      </button>

      <div className={`accordion-grid ${open ? "open" : ""}`}>
        <div className="min-h-0 overflow-hidden">
          <div className="mt-2 space-y-2 border-l-2 border-slate-800/80 pl-3">{children}</div>
        </div>
      </div>
    </article>
  );
}

export function CategoryAccordionList({ groups, categories, children }) {
  const ids = groups.map((group) => group.category);
  const [expanded, setExpanded] = useState(() => new Set(ids.slice(0, 1)));

  useEffect(() => {
    setExpanded(new Set(ids.slice(0, 1)));
  }, [ids.join("|")]);

  const allOpen = ids.length > 0 && ids.every((id) => expanded.has(id));

  function toggle(id) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {ids.length > 1 ? (
        <button
          type="button"
          onClick={() => setExpanded(allOpen ? new Set() : new Set(ids))}
          className="text-[11px] font-semibold text-emerald-300/90 transition hover:text-emerald-200"
        >
          {allOpen ? "Colapsar todo" : "Expandir todo"}
        </button>
      ) : null}

      {groups.map((group) => (
        <CategoryAccordionItem
          key={group.category}
          categoryKey={group.category}
          categories={categories}
          total={group.total}
          share={group.share}
          count={group.items.length}
          open={expanded.has(group.category)}
          onToggle={() => toggle(group.category)}
        >
          {children(group)}
        </CategoryAccordionItem>
      ))}
    </div>
  );
}
