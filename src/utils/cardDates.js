const MS_PER_DAY = 86_400_000;

export function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function cutoffInMonth(year, monthIndex, cutoffDay) {
  const day = Math.min(Math.max(1, Number(cutoffDay) || 1), daysInMonth(year, monthIndex));
  return startOfDay(new Date(year, monthIndex, day));
}

export function addCalendarDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + Number(days) || 0);
  return startOfDay(next);
}

export function toNextBusinessDay(date) {
  const next = new Date(date);
  const weekday = next.getDay();

  if (weekday === 6) next.setDate(next.getDate() + 2);
  if (weekday === 0) next.setDate(next.getDate() + 1);

  return startOfDay(next);
}

export function daysBetween(from, to) {
  return Math.round((startOfDay(to) - startOfDay(from)) / MS_PER_DAY);
}

export function getNextCutoffDate(cutoffDay, from = new Date()) {
  const today = startOfDay(from);
  const year = today.getFullYear();
  const month = today.getMonth();
  const thisCutoff = cutoffInMonth(year, month, cutoffDay);

  // Nu cierra a primera hora del día de corte: ese día ya pertenece al ciclo siguiente.
  if (today < thisCutoff) return thisCutoff;

  const nextMonth = month + 1;
  const nextYear = nextMonth > 11 ? year + 1 : year;
  return cutoffInMonth(nextYear, nextMonth % 12, cutoffDay);
}

export function getLastCutoffDate(cutoffDay, from = new Date()) {
  const today = startOfDay(from);
  const year = today.getFullYear();
  const month = today.getMonth();
  const thisCutoff = cutoffInMonth(year, month, cutoffDay);

  // Al llegar o superar el día de corte, el acumulado abierto pasa a ser el corte facturado.
  if (today >= thisCutoff) return thisCutoff;

  const prevMonth = month - 1;
  const prevYear = prevMonth < 0 ? year - 1 : year;
  return cutoffInMonth(prevYear, (prevMonth + 12) % 12, cutoffDay);
}

export function firstCutoffForPurchase(purchaseDate, cutoffDay, includeCutoffDay = false) {
  const day = startOfDay(purchaseDate);
  const year = day.getFullYear();
  const month = day.getMonth();
  const thisCutoff = cutoffInMonth(year, month, cutoffDay);
  const belongsToThisCutoff = includeCutoffDay ? day <= thisCutoff : day < thisCutoff;

  if (belongsToThisCutoff) return thisCutoff;

  const nextMonth = month + 1;
  const nextYear = nextMonth > 11 ? year + 1 : year;
  return cutoffInMonth(nextYear, nextMonth % 12, cutoffDay);
}

export function parseLocalDate(value) {
  if (value instanceof Date) return startOfDay(value);
  const [year, month, day] = String(value || "").split("-").map(Number);
  if (!year || !month) return null;
  return startOfDay(new Date(year, month - 1, day || 1));
}

export function shiftCutoffDate(cutoffDate, cutoffDay, deltaMonths) {
  return cutoffInMonth(cutoffDate.getFullYear(), cutoffDate.getMonth() + deltaMonths, cutoffDay);
}

export function getPaymentDueDate(cutoffDate, paymentDueDays) {
  return toNextBusinessDay(addCalendarDays(cutoffDate, paymentDueDays));
}

export function formatShortDate(date) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatDateRange(from, to) {
  if (!from || !to) return "";
  return `${formatShortDate(from)} – ${formatShortDate(to)}`;
}

export function getCardCycle(cutoffDay, paymentDueDays, from = new Date()) {
  const today = startOfDay(from);
  const lastCutoff = getLastCutoffDate(cutoffDay, today);
  const nextCutoff = getNextCutoffDate(cutoffDay, today);
  const paymentDue = getPaymentDueDate(lastCutoff, paymentDueDays);
  const nextPaymentDue = getPaymentDueDate(nextCutoff, paymentDueDays);
  const inPaymentWindow = today <= paymentDue;

  const daysUntilCutoff = daysBetween(today, nextCutoff);
  const daysUntilPayment = daysBetween(today, inPaymentWindow ? paymentDue : nextPaymentDue);

  const badge = inPaymentWindow
    ? {
        type: "payment",
        days: daysUntilPayment,
        date: paymentDue,
        label:
          daysUntilPayment === 0
            ? "Pagas hoy"
            : `Pagas en ${daysUntilPayment} ${daysUntilPayment === 1 ? "día" : "días"}`,
      }
    : {
        type: "cutoff",
        days: daysUntilCutoff,
        date: nextCutoff,
        label:
          daysUntilCutoff === 0
            ? "Corta hoy"
            : `Corta en ${daysUntilCutoff} ${daysUntilCutoff === 1 ? "día" : "días"}`,
      };

  return {
    lastCutoff,
    nextCutoff,
    paymentDue: inPaymentWindow ? paymentDue : nextPaymentDue,
    lastPaymentDue: paymentDue,
    daysUntilCutoff,
    daysUntilPayment,
    badge,
  };
}
