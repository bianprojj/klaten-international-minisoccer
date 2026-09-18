/**
 * Day-of-week helpers for schedule slots. Client-safe (no prisma import).
 * Canonical storage format: comma-separated keys, e.g. "mon,tue,wed,thu,fri".
 */

export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayKey = (typeof DAY_KEYS)[number];

export const DAY_LABELS: Record<DayKey, string> = {
  mon: "Senin",
  tue: "Selasa",
  wed: "Rabu",
  thu: "Kamis",
  fri: "Jumat",
  sat: "Sabtu",
  sun: "Minggu",
};

export const DAY_SHORT: Record<DayKey, string> = {
  mon: "Sen",
  tue: "Sel",
  wed: "Rab",
  thu: "Kam",
  fri: "Jum",
  sat: "Sab",
  sun: "Min",
};

export const EVERYDAY_VALUE = "mon,tue,wed,thu,fri,sat,sun";
export const WEEKDAYS_VALUE = "mon,tue,wed,thu,fri";
export const WEEKEND_VALUE = "sat,sun";

/** Normalize user input (string "mon,tue" or string[]) into canonical comma value. Returns null if invalid/empty. */
export function normalizeDayOfWeek(value: unknown): string | null {
  const rawList: string[] = Array.isArray(value)
    ? value.map((v) => String(v))
    : typeof value === "string"
      ? value.split(",")
      : [];
  const lowered = rawList.map((v) => v.trim().toLowerCase());
  const picked = DAY_KEYS.filter((day) => lowered.includes(day));
  return picked.length > 0 ? picked.join(",") : null;
}

function weekdayKeyOf(date: string | Date): DayKey | null {
  const parsed = date instanceof Date ? date : new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  // Booking dates are stored as UTC midnight of the YYYY-MM-DD string, so UTC weekday is the source of truth.
  const jsDay = parsed.getUTCDay(); // 0=Sun..6=Sat
  return (["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as DayKey[])[jsDay] ?? null;
}

/** True when a slot applies on the given date. Empty/missing dayOfWeek means everyday (backward compatible). */
export function slotAppliesOnDate(dayOfWeek: string | undefined | null, date: string | Date): boolean {
  if (!dayOfWeek || !dayOfWeek.trim()) return true;
  const key = weekdayKeyOf(date);
  if (!key) return true;
  return dayOfWeek
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .includes(key);
}

/** Compact human label, e.g. "Setiap hari", "Senin–Jumat", "Sabtu, Minggu". */
export function formatDayOfWeek(value: string | undefined | null): string {
  const normalized = normalizeDayOfWeek(value) ?? EVERYDAY_VALUE;
  if (normalized === EVERYDAY_VALUE) return "Setiap hari";
  if (normalized === WEEKDAYS_VALUE) return "Senin–Jumat";
  if (normalized === WEEKEND_VALUE) return "Sabtu–Minggu";
  return normalized
    .split(",")
    .map((d) => DAY_SHORT[d as DayKey] ?? d)
    .join(", ");
}
