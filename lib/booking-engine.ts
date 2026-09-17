import { prisma } from "@/lib/prisma";
import { DEFAULT_TIMEZONE, formatJakartaDateKey, parseDateOnlyInTimeZone } from "@/lib/timezone";

/**
 * Booking status types matching the database enum
 */
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "expired" | "refunded" | "rescheduled";

/**
 * Statuses that block a time slot from being booked
 */
export const BLOCKING_BOOKING_STATUSES: BookingStatus[] = ["pending", "confirmed", "completed", "rescheduled"];

/**
 * Statuses that allow reclaiming a time slot for new bookings
 */
export const RECLAIMABLE_BOOKING_STATUSES: BookingStatus[] = ["expired", "cancelled", "refunded"];

/**
 * Checks if a booking status blocks a time slot from new bookings
 * @param status - Booking status string (case-insensitive)
 * @returns True if the status blocks the slot
 */
export function isBookingSlotBlocked(status: string | undefined | null): boolean {
  const normalized = status?.trim().toLowerCase();
  return !!normalized && BLOCKING_BOOKING_STATUSES.includes(normalized as BookingStatus);
}

/**
 * Checks if a booking status allows reclaiming the time slot
 * @param status - Booking status string (case-insensitive)
 * @returns True if the slot can be reclaimed
 */
export function shouldReclaimBookingStatus(status: string | undefined | null): boolean {
  const normalized = status?.trim().toLowerCase();
  return !!normalized && RECLAIMABLE_BOOKING_STATUSES.includes(normalized as BookingStatus);
}

/**
 * Checks if a time slot is available for new bookings
 * @param status - Booking status string (case-insensitive)
 * @returns True if slot is available
 */
export function isBookingStatusAvailableInSlot(status: string | undefined | null): boolean {
  return !isBookingSlotBlocked(status);
}

/**
 * Deletes reclaimable bookings for a specific date/time slot
 * Used to free up slots that were expired/cancelled/refunded
 * @param bookingDate - Optional date to filter (defaults to all)
 * @param startTime - Optional start time to filter (defaults to all)
 * @returns Prisma deleteMany result with count of deleted bookings
 */
export async function reclaimExpiredSlotBookings(bookingDate?: string | Date, startTime?: string) {
  const where: Record<string, unknown> = {
    status: {
      in: RECLAIMABLE_BOOKING_STATUSES,
    },
  };

  if (bookingDate) {
    const normalizedDate = bookingDate instanceof Date ? bookingDate : parseDateOnlyInTimeZone(bookingDate, DEFAULT_TIMEZONE);
    if (!Number.isNaN(normalizedDate.getTime())) {
      where.bookingDate = normalizedDate;
    }
  }

  if (startTime) {
    where.startTime = startTime;
  }

  return prisma.booking.deleteMany({
    where,
  });
}

/**
 * Schedule slot record from database
 */
export interface ScheduleSlotRecord {
  id: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  sortOrder: number;
  price?: number;
}

function parseTimeToMinutes(timeValue: string) {
  const [hourText, minuteText] = timeValue.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText ?? "0");
  if (Number.isNaN(hour) || Number.isNaN(minute)) return NaN;
  return hour * 60 + minute;
}

function formatMinutesToTime(totalMinutes: number) {
  const safeMinutes = Math.max(0, totalMinutes);
  const hour = Math.floor(safeMinutes / 60);
  const minute = safeMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export async function getScheduleSlots(): Promise<ScheduleSlotRecord[]> {
  const scheduleSlots = await prisma.scheduleSlot.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return scheduleSlots.map((slot) => ({
    id: slot.id,
    startTime: slot.startTime,
    endTime: slot.endTime,
    isActive: slot.isActive,
    sortOrder: slot.sortOrder,
    price: typeof slot.price === "number" ? slot.price : undefined,
  }));
}

function isScheduleSlotAvailable(
  slot: ScheduleSlotRecord,
  bookedIntervals: Array<{ startTime: string; endTime: string }>
) {
  if (!slot.isActive) {
    return false;
  }

  return !bookedIntervals.some((booking) => booking.startTime < slot.endTime && booking.endTime > slot.startTime);
}

function buildDefaultTimeSlots(
  date: string,
  bookedIntervals: Array<{ startTime: string; endTime: string }>
) {
  const slots: Array<{ id: string; startTime: string; endTime: string; isAvailable: boolean }> = [];
  const startHour = 6;
  const endHour = 22;

  for (let hour = startHour; hour < endHour; hour++) {
    const startTime = `${String(hour).padStart(2, "0")}:00`;
    const endTime = `${String(hour + 1).padStart(2, "0")}:00`;
    const isAvailable = !bookedIntervals.some((booking) => booking.startTime < endTime && booking.endTime > startTime);
    slots.push({ id: `${date}-${startTime}-${endTime}`, startTime, endTime, isAvailable });
  }

  return slots;
}

export function buildTimeSlots(
  date: string,
  bookedIntervals: Array<{ startTime: string; endTime: string }>,
  scheduleSlots: ScheduleSlotRecord[] = []
) {
  if (!scheduleSlots || scheduleSlots.length === 0) {
    // Attach default price to fallback slots
    const defaultSlots = buildDefaultTimeSlots(date, bookedIntervals);
    return defaultSlots.map((s) => ({ ...s, price: undefined }));
  }

  return scheduleSlots.map((slot) => ({
    id: `${date}-${slot.startTime}-${slot.endTime}`,
    startTime: slot.startTime,
    endTime: slot.endTime,
    isAvailable: isScheduleSlotAvailable(slot, bookedIntervals),
    price: slot.price ?? undefined,
  }));
}

export function getRequestedScheduleBlocks(
  startTime: string,
  endTime: string,
  scheduleSlots: ScheduleSlotRecord[] = []
) {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes) || endMinutes <= startMinutes) {
    return [];
  }

  if (!scheduleSlots || scheduleSlots.length === 0) {
    const blocks: Array<{ start: string; end: string }> = [];
    for (let cursor = startMinutes; cursor < endMinutes; cursor += 60) {
      const nextCursor = Math.min(cursor + 60, endMinutes);
      blocks.push({ start: formatMinutesToTime(cursor), end: formatMinutesToTime(nextCursor) });
    }
    return blocks;
  }

  const scheduleByStart = new Map(scheduleSlots.map((slot) => [slot.startTime, slot]));
  const blocks: Array<{ start: string; end: string }> = [];
  let cursor = startTime;

  while (cursor !== endTime) {
    const slot = scheduleByStart.get(cursor);
    if (!slot || !slot.isActive) {
      return [];
    }
    blocks.push({ start: slot.startTime, end: slot.endTime });
    cursor = slot.endTime;
  }

  return blocks;
}
export interface BookingRecord {
  id: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  createdAt: string;
}

interface CreateBookingInput {
  bookingDate: string;
  startTime: string;
  endTime: string;
  pricePerHour: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  timezone?: string;
}

interface BookingResult {
  success: boolean;
  message: string;
  booking?: BookingRecord;
  statusCode: number;
}

const holidayDates = ["2026-07-17", "2026-12-25"];
const maintenanceSchedules = [
  {
    fieldId: "field-1",
    bookingDate: "2026-07-07",
    startTime: "10:00",
    endTime: "11:00",
  },
];

function getDateKey(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function isHoliday(date: Date, timezone: string) {
  const key = getDateKey(date, timezone);
  return holidayDates.includes(key);
}

function isMaintenanceConflict(bookingDate: string, startTime: string, endTime: string) {
  return maintenanceSchedules.some((schedule) => {
    if (schedule.bookingDate !== bookingDate) return false;
    return startTime < schedule.endTime && endTime > schedule.startTime;
  });
}

export async function expireStalePendingBookings(now: Date = new Date()) {
  const expirationCutoff = new Date(now.getTime() - 15 * 60 * 1000);

  await prisma.booking.updateMany({
    where: {
      status: "pending",
      createdAt: { lt: expirationCutoff },
    },
    data: { status: "expired", updatedAt: now },
  });

  await prisma.booking.updateMany({
    where: {
      status: "pending",
      endTime: { lt: "23:59" },
      createdAt: { lt: expirationCutoff },
    },
    data: { status: "expired", updatedAt: now },
  });
}

async function hasOverlap(bookingDate: string, startTime: string, endTime: string) {
  const normalizedDate = parseDateOnlyInTimeZone(bookingDate, DEFAULT_TIMEZONE);
  const overlapping = await prisma.booking.findFirst({
    where: {
      bookingDate: normalizedDate,
      status: {
        in: BLOCKING_BOOKING_STATUSES,
      },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  return overlapping !== null;
}

export async function createBooking(input: CreateBookingInput): Promise<BookingResult> {
  const bookingDate = parseDateOnlyInTimeZone(input.bookingDate, input.timezone ?? DEFAULT_TIMEZONE);
  const startTime = input.startTime;
  const endTime = input.endTime;
  const timezone = input.timezone ?? DEFAULT_TIMEZONE;

  if (!input.customerName || !input.customerPhone) {
    return {
      success: false,
      message: "Customer name and phone number are required.",
      statusCode: 400,
    };
  }

  if (Number.isNaN(bookingDate.getTime())) {
    return {
      success: false,
      message: "Invalid booking date.",
      statusCode: 400,
    };
  }

  if (endTime <= startTime) {
    return {
      success: false,
      message: "Booking end time must be after start time.",
      statusCode: 400,
    };
  }

  if (isHoliday(bookingDate, timezone)) {
    return {
      success: false,
      message: "The selected date is not available because it is marked as a holiday.",
      statusCode: 409,
    };
  }

  if (isMaintenanceConflict(input.bookingDate, startTime, endTime)) {
    return {
      success: false,
      message: "The selected slot overlaps a maintenance window.",
      statusCode: 409,
    };
  }

  await expireStalePendingBookings(new Date());

  if (await hasOverlap(input.bookingDate, startTime, endTime)) {
    return {
      success: false,
      message: "The selected slot is no longer available.",
      statusCode: 409,
    };
  }

  const durationHours = Number(endTime.split(":")[0]) - Number(startTime.split(":")[0]);
  const totalPrice = input.pricePerHour * Math.max(durationHours, 1);

  const record = await prisma.booking.create({
    data: {
      bookingDate,
      startTime,
      endTime,
      durationHours: Math.max(durationHours, 1),
      totalPrice,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      status: "pending",
    },
  });

  return {
    success: true,
    message: "Booking reserved successfully.",
    booking: {
      id: record.id,
      bookingDate: formatJakartaDateKey(record.bookingDate),
      startTime: record.startTime,
      endTime: record.endTime,
      status: record.status as BookingStatus,
      createdAt: record.createdAt.toISOString(),
    },
    statusCode: 201,
  };
}
