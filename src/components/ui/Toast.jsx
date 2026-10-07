import { useEffect } from "react";
import { Check } from "lucide-react";

export default function Toast({ message, onDone }) {
  useEffect(() => {
    const timer = setTimeout(() => onDone?.(), 2400);
    return () => clearTimeout(timer);
  }, [message, onDone]);

  if (!message) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex justify-center px-4 md:bottom-8">
      <p className="pointer-events-auto inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-slate-900/95 px-4 py-2.5 text-sm font-medium text-white shadow-2xl backdrop-blur">
        <Check className="h-4 w-4 text-emerald-300" />
        {message}
      </p>
    </div>
  );
}
