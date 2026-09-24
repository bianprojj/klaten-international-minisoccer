import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";
import { getRateLimitResult, sanitizeObject } from "@/lib/security-headers";
import { getScheduleSlots, getRequestedScheduleBlocks } from "@/lib/booking-engine";
import { createPaymentTransaction } from "@/lib/payment-service";
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
    const notes = typeof safeBody?.notes === "string" ? safeBody.notes.trim().slice(0, 500) : "";
    const referralCode = typeof safeBody?.referralCode === "string" ? safeBody.referralCode.trim().toUpperCase() : "";
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

    // Referral: same rules as /api/referrals/validate (exists + active).
    let referralPercent = 0;
    let referralApplied = "";
    if (referralCode) {
      const referral = await prisma.referralCode.findUnique({ where: { code: referralCode } });
      if (!referral || !referral.isActive) {
        return NextResponse.json({ success: false, message: "Kode referral tidak valid." }, { status: 400 });
      }
      referralPercent = Math.max(0, referral.percent ?? 0);
      referralApplied = referral.code;
    }
    const subtotal = totalPrice;
    const discount = referralApplied ? Math.min(Math.round((subtotal * referralPercent) / 100), subtotal) : 0;
    const adminFee = Math.round(((subtotal - discount) * 2) / 100);
    const total = subtotal - discount + adminFee;

    const useMidtrans = paymentMethod === "Midtrans";

    const booking = await prisma.booking.create({
      data: {
        bookingDate: range.start,
        startTime,
        endTime,
        durationHours,
        totalPrice: total,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        status: useMidtrans ? "pending" : "confirmed",
        notes: notes || (useMidtrans ? "Booking via admin (Midtrans)" : "Walk-in cash booking"),
      },
      select: { id: true, bookingDate: true, startTime: true, endTime: true, totalPrice: true, status: true },
    });

    if (useMidtrans) {
      const forwardedProto = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(/:$/, "");
      const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
      const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${forwardedProto}://${host}` : "");
      const result = await createPaymentTransaction({
        bookingId: booking.id,
        amount: total,
        paymentMethod: "Midtrans",
        customerName,
        email: customerEmail || undefined,
        phone: customerPhone || undefined,
        appBaseUrl,
      });
      await auditLog("walkin-booking-created", `Admin booking ${booking.id} for ${customerName} (Midtrans)`, customerEmail, clientIp);
      return NextResponse.json({
        success: true,
        message: "Booking dibuat, lanjutkan ke pembayaran Midtrans.",
        data: { booking, payment: null, invoice: null, snapUrl: result.snapUrl, snapToken: result.snapToken, pricing: { subtotal, discount, adminFee, total, referralCode: referralApplied, referralPercent } },
      }, { status: 201 });
    }

    const transactionId = `CASH-${booking.id.substring(0, 8)}-${Date.now()}`;
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        transactionId,
        amount: total,
        paymentMethod: "Offline",
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
        subtotal,
        tax: 0,
        discount,
        total,
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
      data: { booking, payment, invoice, pricing: { subtotal, discount, adminFee, total, referralCode: referralApplied, referralPercent } },
    }, { status: 201 });
  } catch (error) {
    console.error("[STAFF WALK-IN] Error:", error);
    return NextResponse.json({ success: false, message: "Unable to create walk-in booking." }, { status: 500 });
  }
}
