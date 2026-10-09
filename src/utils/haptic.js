export function haptic(duration = 15) {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(duration);
    }
  } catch {
    /* ignore unsupported devices */
  }
}
