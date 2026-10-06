export function toSafeNumber(value, fallback = 0) {
  if (value === "" || value == null) return fallback;

  const parsed = Number(String(value).replace(/[$,%\s]/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function roundMoney(value) {
  return Math.round((toSafeNumber(value, 0) + Number.EPSILON) * 100) / 100;
}

export function toOptionalNumber(value) {
  if (value === "" || value == null) return null;

  const parsed = Number(String(value).replace(/[$,%\s]/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}
