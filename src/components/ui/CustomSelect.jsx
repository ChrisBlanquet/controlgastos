import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export default function CustomSelect({
  label,
  value,
  options = [],
  placeholder = "Selecciona",
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    function handleClick(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      {label ? (
        <p className="mb-1.5 text-xs font-medium text-slate-400">{label}</p>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-left text-sm text-white outline-none transition focus:border-emerald-400/50 focus:shadow-[0_0_0_4px_rgba(52,211,153,0.12)]"
      >
        <span className={selected ? "text-white" : "text-slate-500"}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="sheet-up fixed inset-x-0 bottom-0 z-50 max-h-[60dvh] overflow-y-auto rounded-t-3xl border border-slate-800 bg-slate-900 p-3 lg:absolute lg:inset-auto lg:top-[calc(100%+0.5rem)] lg:right-0 lg:left-0 lg:z-20 lg:max-h-64 lg:rounded-2xl lg:p-1.5 lg:shadow-2xl">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-700 lg:hidden" />
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm ${
                    active ? "bg-white/10 text-white" : "text-slate-300"
                  }`}
                >
                  {option.label}
                  {active ? <Check className="h-4 w-4 text-emerald-300" /> : null}
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
