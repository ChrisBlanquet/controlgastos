import { BankLogo, Chip, IssuerLogo } from "./BankLogo";
import { getBankLabel } from "../../constants/banks";
import { availableCredit, darkenHex, formatMXN, utilization } from "../../utils/money";

function cardBackground(themeColor) {
  const value = String(themeColor || "");

  if (value.startsWith("#") || value.startsWith("hex:")) {
    const hex = value.replace("hex:", "");
    return {
      className: "",
      style: {
        backgroundImage: `linear-gradient(135deg, ${hex}, ${darkenHex(hex, 0.55)})`,
      },
    };
  }

  return {
    className: `bg-gradient-to-br ${value || "from-zinc-400 to-neutral-950"}`,
    style: undefined,
  };
}

export default function CreditCardVisual({
  account,
  selected = false,
  compact = false,
  onClick,
}) {
  const background = cardBackground(account.themeColor);
  const lastFour = account.lastFour || "1234";
  const available = availableCredit(account.currentBalance, account.creditLimit);
  const used = utilization(account.currentBalance, account.creditLimit);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-[1.4rem] text-left shadow-2xl shadow-black/40 transition duration-300 ${
        compact ? "aspect-[1.7/1]" : "aspect-[1.586/1]"
      } ${selected ? "scale-[1.01] ring-2 ring-white/70" : "hover:scale-[1.01]"}`}
    >
      <div
        className={`absolute inset-0 ${background.className}`}
        style={background.style}
      />
      <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 left-10 h-28 w-40 rounded-full bg-black/20 blur-2xl" />
      <div className="card-shine pointer-events-none absolute inset-0" />

      <div className="relative flex h-full flex-col justify-between p-4 text-white">
        <div className="flex items-start justify-between">
          <div>
            <BankLogo bank={account.bank} customBank={account.customBank} />
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">
              {account.type === "loan" ? "Préstamo" : "Crédito"}
            </p>
          </div>
          <IssuerLogo issuer={account.issuer} />
        </div>

        <div className="flex items-center justify-between">
          <Chip />
          <p className="font-mono text-sm tracking-[0.28em] text-white/90">
            •••• {lastFour}
          </p>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">{account.name}</p>
            <p className="text-[11px] text-white/70">
              {getBankLabel(account.bank, account.customBank)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-white/65">Disponible</p>
            <p className="text-sm font-semibold">{formatMXN(available)}</p>
            <p className="text-[10px] text-white/60">{used.toFixed(0)}% usado</p>
          </div>
        </div>
      </div>
    </button>
  );
}
