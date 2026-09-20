import { NextResponse, type NextRequest } from "next/server";
import { auditLog } from "@/lib/audit-log";
import { expirePendingPayments, syncBookingStatusesFromPayments } from "@/lib/payment-service";
import { getRateLimitResult, sanitizeObject, applySecurityHeaders } from "@/lib/security-headers";
import { prisma } from "@/lib/prisma";
import { BLOCKING_BOOKING_STATUSES, getRequestedScheduleBlocks, getScheduleSlots, reclaimExpiredSlotBookings } from "@/lib/booking-engine";
import { DEFAULT_FIELD_ID, DEFAULT_FIELD_NAME, normalizeFieldId, getDefaultFieldPrice } from "@/lib/venue";

export const dynamic = "force-dynamic";

function getDateRange(dateString: string) {
  const start = new Date(`${dateString}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function parseTimeToMinutes(timeValue: string) {
  const [hourText, minuteText] = timeValue.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText ?? "0");

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return NaN;
  }

  return hour * 60 + minute;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const safeBody = sanitizeObject(body as Record<string, unknown>);
    const fieldId = normalizeFieldId(typeof safeBody?.fieldId === "string" ? safeBody.fieldId : "");
    const bookingDate = typeof safeBody?.bookingDate === "string" ? safeBody.bookingDate : "";
    const startTime = typeof safeBody?.startTime === "string" ? safeBody.startTime : "";
    const endTime = typeof safeBody?.endTime === "string" ? safeBody.endTime : "";
    const customerName = typeof safeBody?.customerName === "string" ? safeBody.customerName.trim() : "";
    const customerPhone = typeof safeBody?.customerPhone === "string" ? safeBody.customerPhone.trim() : "";
    const customerEmail = typeof safeBody?.customerEmail === "string" ? safeBody.customerEmail.trim() : "";
    const notes = typeof safeBody?.notes === "string" ? safeBody.notes.trim().slice(0, 500) : "";
    const validateOnly = safeBody?.validateOnly === true;
    const clientIp = request.headers.get("x-forwarded-for") ?? "unknown";

    const rateLimit = getRateLimitResult(`booking:${clientIp}`);
    if (!rateLimit.allowed) {
      const response = NextResponse.json({ success: false, message: "Too many booking attempts. Please try again later." }, { status: 429 });
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      return response;
    }

    if (fieldId && fieldId !== DEFAULT_FIELD_ID) {
      const response = NextResponse.json({ success: false, message: "The selected field is not available." }, { status: 404 });
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      return response;
    }

    if (!bookingDate || !startTime || !endTime) {
      const response = NextResponse.json({ success: false, message: "Missing required booking details." }, { status: 400 });
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      return response;
    }

    const range = getDateRange(bookingDate);
    if (!range) {
      const response = NextResponse.json({ success: false, message: "Invalid booking date." }, { status: 400 });
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      return response;
    }

    const scheduleSlots = await getScheduleSlots();
    const requestedBlocks = getRequestedScheduleBlocks(startTime, endTime, scheduleSlots, bookingDate);
    if (requestedBlocks.length === 0) {
      const response = NextResponse.json({ success: false, message: "Invalid booking time range." }, { status: 400 });
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      return response;
    }

    await syncBookingStatusesFromPayments();
    await expirePendingPayments();
    await reclaimExpiredSlotBookings(range.start, startTime);

    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        bookingDate: range.start,
        status: {
          in: BLOCKING_BOOKING_STATUSES,
        },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (overlappingBooking) {
      const response = NextResponse.json({ success: false, message: "This time slot is not available." }, { status: 409 });
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      return response;
    }

    if (validateOnly) {
      const response = NextResponse.json({ success: true, message: "Slot available." });
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      return response;
    }

    if (!customerName || !customerPhone || !customerEmail) {
      const response = NextResponse.json({ success: false, message: "Customer name, email, and phone are required." }, { status: 400 });
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      return response;
    }

    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    const durationHours = Math.max(Math.ceil((endMinutes - startMinutes) / 60), 1);

    // Calculate totalPrice by summing schedule slot prices for the requested blocks
    const requestedSlotTimes = requestedBlocks.map((b) => b.start);
    const slotRecords = await prisma.scheduleSlot.findMany({ where: { startTime: { in: requestedSlotTimes } } });
    let totalPrice = 0;
    if (slotRecords && slotRecords.length > 0) {
      totalPrice = slotRecords.reduce((sum, s) => sum + (s.price ?? 0), 0);
    } else {
      // fallback: use default field price per hour if schedule slots are not configured
      const defaultPrice = getDefaultFieldPrice();
      totalPrice = defaultPrice * durationHours;
    }

    const booking = await prisma.booking.create({
      data: {
        bookingDate: range.start,
        startTime,
        endTime,
        durationHours,
        totalPrice,
        customerName,
        customerPhone,
        customerEmail,
        notes: notes || undefined,
        status: "pending",
      },
      select: {
        id: true,
        bookingDate: true,
        startTime: true,
        endTime: true,
        totalPrice: true,
        status: true,
        createdAt: true,
      },
    });

    auditLog("booking-created", `Booking ${booking.id} created for ${DEFAULT_FIELD_NAME}`, customerEmail, clientIp);

    const response = NextResponse.json({
      success: true,
      message: "Booking created successfully.",
      booking,
    });
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");

    return applySecurityHeaders(response);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("[API] Booking creation error:", {
      message: errorMsg,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    });

    // Return more specific error messages for known scenarios
    if (errorMsg.includes("Unique constraint failed")) {
      return NextResponse.json(
        { success: false, message: "This time slot is no longer available. Please select another slot.", error: errorMsg },
        { status: 409 }
      );
    }

    if (errorMsg.includes("Field not found")) {
      return NextResponse.json(
        { success: false, message: "The selected field is no longer available.", error: errorMsg },
        { status: 404 }
      );
    }

    if (errorMsg.includes("invalid character") || errorMsg.includes("P2023")) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid booking details. Please return to the booking page and select a valid slot.",
          error: errorMsg,
        },
        { status: 400 }
      );
    }

    // Fallback: return the actual error message to help debugging in production.
    return NextResponse.json(
      { success: false, message: "Unable to create booking. Please try again or contact support.", error: errorMsg, stack: errorStack },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await expirePendingPayments();

    const url = new URL(request.url);
    const email = url.searchParams.get("email")?.trim() ?? "";
    const phone = url.searchParams.get("phone")?.trim() ?? "";

    if (!email && !phone) {
      return NextResponse.json({ success: false, message: "Email or phone is required to search bookings." }, { status: 400 });
    }

    const conditions: Array<Record<string, unknown>> = [];
    if (email) conditions.push({ customerEmail: email });
    if (phone) conditions.push({ customerPhone: phone });

    const bookings = await prisma.booking.findMany({
      where: {
        OR: conditions,
      },
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            transactionId: true,
            status: true,
            amount: true,
            provider: true,
            paymentMethod: true,
            snapUrl: true,
            createdAt: true,
            updatedAt: true,
            paidAt: true,
            expiredAt: true,
          },
        },
      },
      orderBy: { bookingDate: "desc" },
    });

    const normalizedBookings = bookings.map((booking) => ({
      ...booking,
      fieldName: DEFAULT_FIELD_NAME,
    }));

    return NextResponse.json({
      success: true,
      bookings: normalizedBookings,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[API] Booking retrieval error:", {
      message: errorMsg,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: false, message: "Unable to fetch bookings. Please try again." },
      { status: 500 }
    );
  }
}
