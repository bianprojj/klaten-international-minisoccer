export const DEFAULT_TIMEZONE = "Asia/Jakarta";

export function normalizeTimeString(timeValue: string | null | undefined): string {
  if (!timeValue) return "00:00";
  const trimmed = String(timeValue).trim();
  if (!trimmed) return "00:00";

  const match = trimmed.match(/^\d{1,2}:\d{2}$/);
  if (match) {
    const [hourText, minuteText] = trimmed.split(":");
    const hour = Number(hourText);
    const minute = Number(minuteText);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return "00:00";
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  const numeric = Number(trimmed);
  if (Number.isNaN(numeric)) return "00:00";
  return `${String(Math.floor(numeric)).padStart(2, "0")}:00`;
}

export function parseDateOnlyInTimeZone(dateValue: string | Date, timezone = DEFAULT_TIMEZONE): Date {
  if (dateValue instanceof Date) {
    return new Date(dateValue.getTime());
  }

  const normalized = String(dateValue ?? "").trim();
  if (!normalized) {
    return new Date(NaN);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const fakeDate = new Date(`${normalized}T00:00:00+07:00`);
    if (!Number.isNaN(fakeDate.getTime())) {
      return fakeDate;
    }
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(NaN);
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(parsed);

  const byType = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  const year = byType.year;
  const month = byType.month;
  const day = byType.day;

  if (!year || !month || !day) {
    return parsed;
  }

  return new Date(`${year}-${month}-${day}T00:00:00+07:00`);
}

export function formatJakartaDateKey(dateValue: string | Date): string {
  const date = dateValue instanceof Date ? dateValue : parseDateOnlyInTimeZone(dateValue);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DEFAULT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function formatJakartaDate(dateValue: string | Date): string {
  const date = dateValue instanceof Date ? dateValue : parseDateOnlyInTimeZone(dateValue);
  const formatted = new Intl.DateTimeFormat("id-ID", {
    timeZone: DEFAULT_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);

  return formatted.replace(/\//g, "-");
}

export function getTodayDateStringInTimeZone(timezone = DEFAULT_TIMEZONE): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function formatJakartaDateTime(dateValue: string | Date, timeValue?: string | null): string {
  const date = formatJakartaDate(dateValue);
  const time = normalizeTimeString(timeValue ?? undefined);
  return `${date} ${time} WIB`;
}
