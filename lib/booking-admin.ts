export type BookingUpdateExisting = {
  bookingDate?: string | Date | null;
  startTime?: string | null;
  endTime?: string | null;
  totalPrice?: number | null;
  durationHours?: number | null;
};

export function parseTimeToMinutes(timeValue: string): number {
  const [hourText, minuteText = "0"] = timeValue.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return Number.NaN;
  return hour * 60 + minute;
}

export function normalizeDateKey(dateValue: Date | string | null | undefined): string {
  if (!dateValue) return "";
  if (dateValue instanceof Date) {
    return dateValue.toISOString().slice(0, 10);
  }
  const dateString = String(dateValue).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

export function resolveBookingUpdatePayload(
  body: Record<string, unknown>,
  existing: BookingUpdateExisting = {}
) {
  const updates: Record<string, unknown> = {};

  if (typeof body.status === "string") updates.status = body.status;
  if (typeof body.notes === "string") updates.notes = body.notes;
  if (typeof body.customerName === "string" && body.customerName.trim()) updates.customerName = body.customerName.trim();
  if (typeof body.customerPhone === "string" && body.customerPhone.trim()) updates.customerPhone = body.customerPhone.trim();
  if (typeof body.customerEmail === "string") updates.customerEmail = body.customerEmail.trim() || null;

  const nextDate = typeof body.bookingDate === "string" ? body.bookingDate.trim() : normalizeDateKey(existing.bookingDate);
  const nextStartTime = typeof body.startTime === "string" ? body.startTime.trim() : existing.startTime ?? "";
  const nextEndTime = typeof body.endTime === "string" ? body.endTime.trim() : existing.endTime ?? "";

  if (nextDate) updates.bookingDate = nextDate;
  if (nextStartTime) updates.startTime = nextStartTime;
  if (nextEndTime) updates.endTime = nextEndTime;

  if (nextStartTime && nextEndTime) {
    const startMinutes = parseTimeToMinutes(nextStartTime);
    const endMinutes = parseTimeToMinutes(nextEndTime);
    if (!Number.isNaN(startMinutes) && !Number.isNaN(endMinutes) && endMinutes > startMinutes) {
      const durationHours = Math.max(Math.ceil((endMinutes - startMinutes) / 60), 1);
      updates.durationHours = durationHours;

      if (typeof existing.totalPrice === "number" && typeof existing.durationHours === "number" && existing.durationHours > 0) {
        const hourlyRate = Math.round(existing.totalPrice / existing.durationHours);
        updates.totalPrice = Math.max(durationHours * hourlyRate, 110000);
      }
    }
  }

  return updates;
}
