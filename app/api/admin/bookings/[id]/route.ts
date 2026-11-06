import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";
import { getRequestedScheduleBlocks, getScheduleSlots } from "@/lib/booking-engine";
import { resolveBookingUpdatePayload } from "@/lib/booking-admin";

function getCookieToken(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/admin-session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getCookieToken(request);
    const admin = await getAuthenticatedAdminFromToken(token);
    if (!admin) return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
    if (!hasAdminPermission(admin, "canReadBookings") && !hasAdminPermission(admin, "canManageBookings")) {
      return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
    }

    const paramsResolved = await params;
    const booking = await prisma.booking.findUnique({
      where: { id: paramsResolved.id },
      include: {
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!booking) return NextResponse.json({ success: false, message: "Booking not found." }, { status: 404 });
    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error("[ADMIN] Get booking error:", error);
    return NextResponse.json({ success: false, message: "Unable to retrieve booking." }, { status: 500 });
  }
}

function parseTimeToMinutes(timeValue: string) {
  const [hourText, minuteText = "0"] = timeValue.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return NaN;
  return hour * 60 + minute;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getCookieToken(request);
    const admin = await getAuthenticatedAdminFromToken(token);
    if (!admin) return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
    if (!hasAdminPermission(admin, "canManageBookings")) {
      return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
    }

    const paramsResolved = await params;
    const body = await request.json();
    const existingBooking = await prisma.booking.findUnique({ where: { id: paramsResolved.id } });
    if (!existingBooking) {
      return NextResponse.json({ success: false, message: "Booking not found." }, { status: 404 });
    }

    const updates = resolveBookingUpdatePayload(body, existingBooking);

    const hasTimeChange = typeof body.bookingDate === "string" || typeof body.startTime === "string" || typeof body.endTime === "string";
    if (hasTimeChange) {
      const bookingDate = typeof body.bookingDate === "string" && body.bookingDate.trim()
        ? body.bookingDate.trim()
        : new Date(existingBooking.bookingDate).toISOString().slice(0, 10);
      const startTime = typeof body.startTime === "string" && body.startTime.trim() ? body.startTime.trim() : existingBooking.startTime;
      const endTime = typeof body.endTime === "string" && body.endTime.trim() ? body.endTime.trim() : existingBooking.endTime;

      if (!bookingDate || !startTime || !endTime) {
        return NextResponse.json({ success: false, message: "Missing required booking date or time." }, { status: 400 });
      }

      const startMinutes = parseTimeToMinutes(startTime);
      const endMinutes = parseTimeToMinutes(endTime);
      if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes) || endMinutes <= startMinutes) {
        return NextResponse.json({ success: false, message: "Invalid booking time range." }, { status: 400 });
      }

      const scheduleSlots = await getScheduleSlots();
      const requestedBlocks = getRequestedScheduleBlocks(startTime, endTime, scheduleSlots, bookingDate);
      if (requestedBlocks.length === 0) {
        return NextResponse.json({ success: false, message: "Selected time range is not available." }, { status: 400 });
      }

      const existingDate = new Date(`${bookingDate}T00:00:00.000Z`);
      const overlap = await prisma.booking.findFirst({
        where: {
          id: { not: paramsResolved.id },
          bookingDate: existingDate,
          status: { notIn: ["cancelled", "expired"] },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      });

      if (overlap) {
        return NextResponse.json({ success: false, message: "Requested slot is not available." }, { status: 409 });
      }

      const durationHours = Math.max(Math.ceil((endMinutes - startMinutes) / 60), 1);
      updates.bookingDate = bookingDate;
      updates.startTime = startTime;
      updates.endTime = endTime;
      updates.durationHours = durationHours;

      let totalPrice = 0;
      const slotTimes = requestedBlocks.map((slot) => slot.start);
      const slotRecords = await prisma.scheduleSlot.findMany({ where: { startTime: { in: slotTimes } } });
      totalPrice = slotRecords.reduce((sum, slot) => sum + (slot.price ?? 0), 0);
      if (totalPrice <= 0) {
        totalPrice = 110000 * durationHours;
      }
      updates.totalPrice = totalPrice;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, message: "No changes were provided." }, { status: 400 });
    }

    const updated = await prisma.booking.update({ where: { id: paramsResolved.id }, data: updates });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[ADMIN] Update booking error:", error);
    return NextResponse.json({ success: false, message: "Unable to update booking." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getCookieToken(request);
    const admin = await getAuthenticatedAdminFromToken(token);
    if (!admin) return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
    if (!hasAdminPermission(admin, "canManageBookings")) {
      return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
    }

    const paramsResolved = await params;
    await prisma.booking.delete({ where: { id: paramsResolved.id } });
    return NextResponse.json({ success: true, message: "Booking deleted." });
  } catch (error) {
    console.error("[ADMIN] Delete booking error:", error);
    return NextResponse.json({ success: false, message: "Unable to delete booking." }, { status: 500 });
  }
}
