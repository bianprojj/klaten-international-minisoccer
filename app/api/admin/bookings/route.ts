import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";
import { getRequestedScheduleBlocks, getScheduleSlots } from "@/lib/booking-engine";
import { DEFAULT_FIELD_ID } from "@/lib/venue";

function getCookieToken(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/admin-session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function getDateRange(dateString: string) {
  const start = new Date(`${dateString}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function parseTimeToMinutes(timeValue: string) {
  const [hourText, minuteText] = timeValue.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText ?? "0");
  if (Number.isNaN(hour) || Number.isNaN(minute)) return NaN;
  return hour * 60 + minute;
}

export async function GET(request: Request) {
  try {
    const token = getCookieToken(request);
    const admin = await getAuthenticatedAdminFromToken(token);
    if (!admin) return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
    if (!hasAdminPermission(admin, "canReadBookings") && !hasAdminPermission(admin, "canManageBookings")) {
      return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
    }

    const url = new URL(request.url);
    const page = Math.max(Number(url.searchParams.get("page") || "1"), 1);
    const limit = Math.max(Number(url.searchParams.get("limit") || "6"), 1);
    const q = (url.searchParams.get("q") || "").trim();
    const date = url.searchParams.get("date") || undefined;
    const status = url.searchParams.get("status") || undefined;

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { customerName: { contains: q, mode: "insensitive" } },
        { customerPhone: { contains: q, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;
    if (date) {
      const range = getDateRange(date);
      if (range) where.bookingDate = { gte: range.start, lt: range.end };
    }

    const total = await prisma.booking.count({ where });
    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.max(Math.ceil(total / limit), 1);
    return NextResponse.json({ success: true, data: bookings, total, page, limit, totalPages });
  } catch (error) {
    console.error("[ADMIN] Booking list error:", error);
    return NextResponse.json({ success: false, message: "Unable to list bookings." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = getCookieToken(request);
    const admin = await getAuthenticatedAdminFromToken(token);
    if (!admin) return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
    if (!hasAdminPermission(admin, "canManageBookings")) {
      return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
    }

    const body = await request.json();
    const fieldId = typeof body.fieldId === "string" ? body.fieldId.trim() : "";
    const bookingDate = typeof body.bookingDate === "string" ? body.bookingDate.trim() : "";
    const startTime = typeof body.startTime === "string" ? body.startTime.trim() : "";
    const endTime = typeof body.endTime === "string" ? body.endTime.trim() : "";
    const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
    const customerPhone = typeof body.customerPhone === "string" ? body.customerPhone.trim() : "";
    const customerEmail = typeof body.customerEmail === "string" ? body.customerEmail.trim() : "";
    const notes = typeof body.notes === "string" ? body.notes.trim() : null;
    const paymentMethod = typeof body.paymentMethod === "string" && body.paymentMethod.trim() ? body.paymentMethod.trim() : "Offline";

    if (!bookingDate || !startTime || !endTime || !customerName || !customerPhone) {
      return NextResponse.json({ success: false, message: "Missing required booking details." }, { status: 400 });
    }

    if (fieldId && fieldId !== DEFAULT_FIELD_ID) {
      return NextResponse.json({ success: false, message: "The selected field is not available." }, { status: 404 });
    }

    const range = getDateRange(bookingDate);
    if (!range) {
      return NextResponse.json({ success: false, message: "Invalid booking date." }, { status: 400 });
    }

    const blocks = getRequestedScheduleBlocks(startTime, endTime);
    if (blocks.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid booking time range." }, { status: 400 });
    }

    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        bookingDate: range.start,
        status: {
          notIn: ["cancelled", "expired"],
        },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (overlappingBooking) {
      return NextResponse.json({ success: false, message: "Requested slot is not available." }, { status: 409 });
    }

    const durationHours = Math.max(Math.ceil((parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime)) / 60), 1);

    // Price follows the schedule slots configured for this weekday (day-aware), fallback 110rb/jam.
    const scheduleSlots = await getScheduleSlots();
    const requestedBlocks = getRequestedScheduleBlocks(startTime, endTime, scheduleSlots, bookingDate);
    let totalPrice = 0;
    if (requestedBlocks.length > 0) {
      const slotTimes = requestedBlocks.map((b) => b.start);
      const slotRecords = await prisma.scheduleSlot.findMany({ where: { startTime: { in: slotTimes } } });
      totalPrice = slotRecords.reduce((sum, s) => sum + (s.price ?? 0), 0);
    }
    if (totalPrice <= 0) {
      totalPrice = 110000 * durationHours;
    }

    // Atomic: booking (confirmed) + payment (cash success) + invoice (paid). No Midtrans involved.
    const booking = await prisma.booking.create({
      data: {
        bookingDate: range.start,
        startTime,
        endTime,
        durationHours,
        totalPrice,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        status: "confirmed",
        notes: notes ?? `Booking manual oleh ${admin.name} (${paymentMethod})`,
      },
    });

    const transactionId = `CASH-${booking.id.substring(0, 8)}-${Date.now()}`;
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        transactionId,
        amount: totalPrice,
        paymentMethod,
        provider: "Offline",
        status: "success",
        paidAt: new Date(),
      },
    });

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${booking.id.substring(0, 8).toUpperCase()}`,
        bookingId: booking.id,
        paymentId: payment.id,
        customerName,
        customerEmail: customerEmail || null,
        customerPhone,
        subtotal: totalPrice,
        tax: 0,
        discount: 0,
        total: totalPrice,
        status: "paid",
        issuedAt: new Date(),
        paidAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: { booking, payment, invoice } }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN] Create booking error:", error);
    return NextResponse.json({ success: false, message: "Unable to create booking." }, { status: 500 });
  }
}
