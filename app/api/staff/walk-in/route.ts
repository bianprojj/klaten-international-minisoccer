import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";
import { getRateLimitResult, sanitizeObject } from "@/lib/security-headers";
import { getScheduleSlots, getRequestedScheduleBlocks } from "@/lib/booking-engine";
import { auditLog } from "@/lib/audit-log";

export const dynamic = "force-dynamic";

function getCookieToken(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/admin-session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function parseTimeToMinutes(timeValue: string) {
  const [hourText, minuteText] = timeValue.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText ?? "0");
  if (Number.isNaN(hour) || Number.isNaN(minute)) return NaN;
  return hour * 60 + minute;
}

export async function POST(request: Request) {
  try {
    const token = getCookieToken(request);
    const admin = await getAuthenticatedAdminFromToken(token);
    if (!admin) return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
    if (!hasAdminPermission(admin, "canCreateBookings")) {
      return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
    }

    const body = await request.json();
    const safeBody = sanitizeObject(body as Record<string, unknown>);
    const customerName = typeof safeBody?.customerName === "string" ? safeBody.customerName.trim() : "";
    const customerPhone = typeof safeBody?.customerPhone === "string" ? safeBody.customerPhone.trim() : "";
    const customerEmail = typeof safeBody?.customerEmail === "string" ? safeBody.customerEmail.trim() : "";
    const bookingDate = typeof safeBody?.bookingDate === "string" ? safeBody.bookingDate : "";
    const startTime = typeof safeBody?.startTime === "string" ? safeBody.startTime : "";
    const endTime = typeof safeBody?.endTime === "string" ? safeBody.endTime : "";
    const paymentMethod = (typeof safeBody?.paymentMethod === "string" ? safeBody.paymentMethod : "Offline") as string;
    const clientIp = request.headers.get("x-forwarded-for") ?? "unknown";

    if (!customerName || !customerPhone || !bookingDate || !startTime || !endTime) {
      return NextResponse.json({ success: false, message: "Missing required fields (name, phone, date, time)." }, { status: 400 });
    }

    const range = { start: new Date(`${bookingDate}T00:00:00.000Z`), end: new Date(`${bookingDate}T23:59:59.999Z`) };
    if (Number.isNaN(range.start.getTime()) || Number.isNaN(range.end.getTime())) {
      return NextResponse.json({ success: false, message: "Invalid booking date." }, { status: 400 });
    }

    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes) || endMinutes <= startMinutes) {
      return NextResponse.json({ success: false, message: "Invalid time range." }, { status: 400 });
    }

    const durationHours = Math.max(Math.ceil((endMinutes - startMinutes) / 60), 1);

    const scheduleSlots = await getScheduleSlots();
    const requestedBlocks = getRequestedScheduleBlocks(startTime, endTime, scheduleSlots, bookingDate);
    let totalPrice = 0;
    if (requestedBlocks.length > 0) {
      const slotTimes = requestedBlocks.map((b) => b.start);
      const slotRecords = await prisma.scheduleSlot.findMany({ where: { startTime: { in: slotTimes } } });
      totalPrice = slotRecords.reduce((sum, s) => sum + (s.price ?? 0), 0);
    } else {
      const hourlyRate = 110000;
      totalPrice = hourlyRate * durationHours;
    }

    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        bookingDate: range.start,
        status: { in: ["pending", "confirmed", "rescheduled", "completed"] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });
    if (overlappingBooking) {
      return NextResponse.json({ success: false, message: "This time slot is not available." }, { status: 409 });
    }

    const rateLimit = getRateLimitResult(`staff-walkin:${clientIp}`);
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, message: "Too many requests. Please try again later." }, { status: 429 });
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
        customerEmail: customerEmail || null,
        status: "confirmed",
        notes: "Walk-in cash booking",
      },
      select: { id: true, bookingDate: true, startTime: true, endTime: true, totalPrice: true, status: true },
    });

    const transactionId = `CASH-${booking.id.substring(0, 8)}-${Date.now()}`;
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        transactionId,
        amount: totalPrice,
        paymentMethod: paymentMethod === "Offline" ? "Offline" : "Midtrans",
        provider: "Offline",
        status: "success",
        paidAt: new Date(),
      },
      select: { id: true, transactionId: true, amount: true, status: true },
    });

    const invoiceNumber = `INV-${booking.id.substring(0, 8).toUpperCase()}`;
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        bookingId: booking.id,
        paymentId: payment.id,
        subtotal: totalPrice,
        tax: 0,
        discount: 0,
        total: totalPrice,
        status: "paid",
        issuedAt: new Date(),
        paidAt: new Date(),
      },
      select: { id: true, invoiceNumber: true, status: true },
    });

    await auditLog("walkin-booking-created", `Walk-in booking ${booking.id} for ${customerName}`, customerEmail, clientIp);

    return NextResponse.json({
      success: true,
      message: "Walk-in booking created successfully.",
      data: { booking, payment, invoice },
    }, { status: 201 });
  } catch (error) {
    console.error("[STAFF WALK-IN] Error:", error);
    return NextResponse.json({ success: false, message: "Unable to create walk-in booking." }, { status: 500 });
  }
}
