export const BANKS = [
  { id: "klar", label: "Klar", issuer: "mastercard" },
  { id: "nu", label: "Nu", issuer: "mastercard" },
  { id: "bbva", label: "BBVA", issuer: "visa" },
  { id: "mercado_pago", label: "Mercado Pago", issuer: "mastercard" },
  { id: "santander", label: "Santander", issuer: "visa" },
  { id: "banorte", label: "Banorte", issuer: "visa" },
];

export const CUSTOM_BANK = { id: "otro", label: "+ Otro / Personalizado", issuer: "visa" };

export const CARD_THEMES = [
  { id: "nu", label: "Nu Morado", className: "from-purple-600 to-indigo-950" },
  { id: "klar", label: "Klar Verde", className: "from-emerald-400 to-green-900" },
  { id: "bbva", label: "BBVA Azul", className: "from-sky-500 to-blue-950" },
  { id: "santander", label: "Santander Rojo", className: "from-red-500 to-red-950" },
  { id: "banorte", label: "Banorte", className: "from-orange-500 to-red-950" },
  { id: "hey", label: "Hey Magenta", className: "from-fuchsia-500 to-pink-950" },
  { id: "mp", label: "Mercado Pago", className: "from-cyan-400 to-blue-900" },
  { id: "platinum", label: "Platinum", className: "from-zinc-400 to-neutral-950" },
  { id: "gold", label: "Gold", className: "from-amber-300 to-yellow-800" },
  { id: "ocean", label: "Ocean", className: "from-teal-400 to-slate-950" },
];

export const BANK_THEME = {
  klar: "from-emerald-400 to-green-900",
  nu: "from-purple-600 to-indigo-950",
  bbva: "from-sky-500 to-blue-950",
  santander: "from-red-500 to-red-950",
  banorte: "from-orange-500 to-red-950",
  hey: "from-fuchsia-500 to-pink-950",
  mercado_pago: "from-cyan-400 to-blue-900",
  otro: "from-zinc-400 to-neutral-950",
};

export function isKnownBank(bankId) {
  return BANKS.some((bank) => bank.id === bankId);
}

export function getBankLabel(bankId, customBank) {
  const known = BANKS.find((bank) => bank.id === bankId);
  if (known) return known.label;
  return String(customBank || "").trim() || "Personalizada";
}
