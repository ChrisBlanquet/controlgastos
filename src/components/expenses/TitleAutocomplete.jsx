import { useEffect, useMemo, useRef, useState } from "react";
import { getCategoryColor, getCategoryIcon, resolveCategory } from "../../constants/categories";
import { INPUT_BASE } from "../../constants/ui";
import { buildTitleSuggestions, matchTitleSuggestions } from "../../utils/titleSuggestions";

export default function TitleAutocomplete({
  value,
  onChange,
  onPick,
  expenses = [],
  categories = [],
  error,
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const catalog = useMemo(() => buildTitleSuggestions(expenses), [expenses]);
  const matches = useMemo(() => matchTitleSuggestions(catalog, value), [catalog, value]);

  useEffect(() => {
    setActiveIndex(0);
  }, [value]);

  useEffect(() => {
    function handlePointer(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointer);
    return () => document.removeEventListener("pointerdown", handlePointer);
  }, []);

  function pick(item) {
    onPick(item.title, item.category);
    setOpen(false);
  }

  function handleKeyDown(event) {
    if (!open || !matches.length) {
      if (event.key === "ArrowDown" && matches.length) {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % matches.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + matches.length) % matches.length);
    } else if (event.key === "Enter" && matches[activeIndex]) {
      event.preventDefault();
      pick(matches[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  const showList = open && matches.length > 0;

  return (
    <div ref={rootRef} className="relative">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">Concepto</span>
      <input
        value={value}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="Súper Chedraui"
        className={INPUT_BASE}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (matches.length) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        aria-autocomplete="list"
        aria-expanded={showList}
      />
      {error ? <span className="mt-1 block text-xs text-rose-400">{error}</span> : null}

      {showList ? (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1 max-h-52 overflow-y-auto overscroll-contain rounded-xl border border-slate-800 bg-slate-900 shadow-xl"
        >
          {matches.map((item, index) => {
            const category = resolveCategory(item.category, categories);
            const Icon = getCategoryIcon(category.icon);
            const tone = getCategoryColor(category.color);
            const active = index === activeIndex;

            return (
              <li key={item.title}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => setActiveIndex(index)}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    pick(item);
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left ${
                    active ? "bg-slate-800/90" : "bg-transparent"
                  }`}
                >
                  <span className="min-w-0 truncate text-sm text-slate-100">
                    <Highlight text={item.title} query={value} />
                  </span>
                  {item.category ? (
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tone.chip}`}
                    >
                      <Icon className="h-3 w-3" />
                      {category.name}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function Highlight({ text, query }) {
  const needle = String(query || "").trim();
  if (!needle) return text;

  const start = text.toLocaleLowerCase("es-MX").indexOf(needle.toLocaleLowerCase("es-MX"));
  if (start < 0) return text;

  return (
    <>
      {text.slice(0, start)}
      <mark className="bg-transparent font-semibold text-emerald-300">
        {text.slice(start, start + needle.length)}
      </mark>
      {text.slice(start + needle.length)}
    </>
  );
}
