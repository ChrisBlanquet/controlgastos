import { parseLocalDate } from "./cardDates";
import { toSafeNumber } from "./numbers";

export const SORT_PREF_KEY = "movement_sort_pref";

export const SORT_OPTIONS = [
  { id: "recent", label: "Más recientes" },
  { id: "oldest", label: "Más antiguos" },
  { id: "amount_desc", label: "Mayor a menor monto" },
  { id: "amount_asc", label: "Menor a mayor monto" },
];

export const GROUP_OPTIONS = [
  { id: "chrono", label: "Cronológico" },
  { id: "category", label: "Agrupar por Categorías" },
];

export function readSortPref() {
  try {
    const stored = JSON.parse(localStorage.getItem(SORT_PREF_KEY) || "null");
    const sortBy = SORT_OPTIONS.some((item) => item.id === stored?.sortBy) ? stored.sortBy : "recent";
    const groupBy = GROUP_OPTIONS.some((item) => item.id === stored?.groupBy) ? stored.groupBy : "chrono";
    return { sortBy, groupBy };
  } catch {
    return { sortBy: "recent", groupBy: "chrono" };
  }
}

export function persistSortPref(pref) {
  try {
    localStorage.setItem(SORT_PREF_KEY, JSON.stringify(pref));
  } catch {
    /* ignore */
  }
}

function itemTime(item, getDate) {
  const parsed = parseLocalDate(getDate(item));
  return parsed ? parsed.getTime() : 0;
}

export function sortMovements(list, sortBy, getDate, getAmount) {
  const copy = [...list];
  copy.sort((a, b) => {
    if (sortBy === "oldest") return itemTime(a, getDate) - itemTime(b, getDate);
    if (sortBy === "amount_desc") return toSafeNumber(getAmount(b), 0) - toSafeNumber(getAmount(a), 0);
    if (sortBy === "amount_asc") return toSafeNumber(getAmount(a), 0) - toSafeNumber(getAmount(b), 0);
    return itemTime(b, getDate) - itemTime(a, getDate);
  });
  return copy;
}

export function processMovements(filtered, sortBy, groupBy, accessors) {
  const { getDate, getAmount, getCategory } = accessors;
  const list = sortMovements(filtered, sortBy, getDate, getAmount);

  if (groupBy !== "category") {
    return { mode: "flat", items: list, groups: [], grandTotal: 0 };
  }

  const buckets = new Map();
  list.forEach((item) => {
    const key = String(getCategory(item) || "Otro");
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(item);
  });

  const grandTotal = list.reduce((sum, item) => sum + toSafeNumber(getAmount(item), 0), 0);
  const groups = [...buckets.entries()]
    .map(([category, items]) => {
      const total = items.reduce((sum, item) => sum + toSafeNumber(getAmount(item), 0), 0);
      return {
        category,
        items,
        total,
        share: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
      };
    })
    .sort((a, b) => b.total - a.total);

  return { mode: "category", items: list, groups, grandTotal };
}
