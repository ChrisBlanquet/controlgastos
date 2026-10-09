const mxn = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

const MASK = "$ •••••";
let hideSensitiveBalances = false;
try {
  hideSensitiveBalances = localStorage.getItem("hideSensitiveBalances") === "true";
} catch {
  hideSensitiveBalances = false;
}

export function setHideSensitiveBalances(hidden) {
  hideSensitiveBalances = Boolean(hidden);
}

export function formatMXN(value) {
  if (hideSensitiveBalances) return MASK;
  return mxn.format(Number(value) || 0);
}

export function utilization(currentBalance, creditLimit) {
  const limit = Number(creditLimit) || 0;
  const balance = Math.max(0, Number(currentBalance) || 0);
  if (limit <= 0) return 0;
  return Math.min(100, (balance / limit) * 100);
}

export function availableCredit(currentBalance, creditLimit) {
  return Math.max(0, (Number(creditLimit) || 0) - (Number(currentBalance) || 0));
}

export function utilizationTone(percent) {
  if (percent < 30) {
    return {
      bar: "bg-emerald-400",
      text: "text-emerald-300",
      label: "Saludable",
    };
  }

  if (percent < 70) {
    return {
      bar: "bg-amber-400",
      text: "text-amber-300",
      label: "Moderado",
    };
  }

  return {
    bar: "bg-rose-500",
    text: "text-rose-300",
    label: "Alto",
  };
}

export function darkenHex(hex, amount = 0.45) {
  const raw = String(hex || "").replace("#", "");
  if (raw.length !== 6) return "#0f172a";

  const channels = [0, 2, 4].map((index) => {
    const value = parseInt(raw.slice(index, index + 2), 16);
    return Math.max(0, Math.round(value * (1 - amount)));
  });

  return `#${channels.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}
