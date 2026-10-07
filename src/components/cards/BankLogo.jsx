import { useId } from "react";

function VisaMark() {
  return (
    <span className="text-[13px] font-black italic tracking-tight text-white">VISA</span>
  );
}

function MastercardMark() {
  return (
    <span className="flex items-center" aria-hidden="true">
      <span className="-mr-2 h-5 w-5 rounded-full bg-red-500/90" />
      <span className="h-5 w-5 rounded-full bg-amber-400/90" />
    </span>
  );
}

export function IssuerLogo({ issuer = "visa" }) {
  return issuer === "mastercard" ? <MastercardMark /> : <VisaMark />;
}

export function BankLogo({ bank = "otro", customBank = "", className = "" }) {
  const marks = {
    klar: "Klar",
    nu: "Nu",
    bbva: "BBVA",
    santander: "Santander",
    banorte: "Banorte",
    hey: "Hey",
    mercado_pago: "MP",
    otro: customBank || "Card",
  };

  return (
    <span className={`truncate text-sm font-semibold tracking-wide text-white/95 ${className}`}>
      {marks[bank] ?? customBank ?? marks.otro}
    </span>
  );
}

export function Chip() {
  const chipId = useId().replace(/:/g, "");

  return (
    <svg viewBox="0 0 50 38" className="h-9 w-12 drop-shadow sm:h-10 sm:w-[3.25rem]" aria-hidden="true">
      <defs>
        <linearGradient id={chipId} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="45%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <rect width="50" height="38" rx="6" fill={`url(#${chipId})`} />
      <path
        d="M0 13h50M0 25h50M18 0v38M32 0v38"
        stroke="#92400e"
        strokeOpacity="0.35"
        strokeWidth="1.2"
      />
      <rect x="18" y="13" width="14" height="12" rx="2" fill="#fbbf24" fillOpacity="0.55" />
    </svg>
  );
}
