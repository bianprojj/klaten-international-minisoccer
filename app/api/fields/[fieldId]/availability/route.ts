import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expirePendingPayments, syncBookingStatusesFromPayments } from "@/lib/payment-service";
import { BLOCKING_BOOKING_STATUSES, buildTimeSlots, getScheduleSlots } from "@/lib/booking-engine";
import { DEFAULT_FIELD, DEFAULT_FIELD_ID, isSupportedFieldId, normalizeFieldId, getDefaultFieldPrice } from "@/lib/venue";

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

export async function GET(request: Request, props: { params: Promise<{ fieldId: string }> }) {
  const params = await props.params;
  const normalizedFieldId = normalizeFieldId(params?.fieldId ?? DEFAULT_FIELD_ID);
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ success: false, message: "Date is required." }, { status: 400 });
  }

  if (!isSupportedFieldId(normalizedFieldId)) {
    return NextResponse.json({ success: false, message: "The requested field is not available." }, { status: 404 });
  }

  const range = getDateRange(date);
  if (!range) {
    return NextResponse.json({ success: false, message: "Invalid date format." }, { status: 400 });
  }

  try {
    // Keep payment sync best-effort: do not fail whole request if payments table missing
    try {
      await syncBookingStatusesFromPayments();
      await expirePendingPayments();
    } catch (err) {
      console.warn('[API] Payment sync/expiry skipped due to error:', err instanceof Error ? err.message : String(err));
    }

    const bookings = await prisma.booking.findMany({
      where: {
        bookingDate: range.start,
        status: {
          in: BLOCKING_BOOKING_STATUSES,
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    const scheduleSlots = await getScheduleSlots();
    const schedules = buildTimeSlots(date, bookings, scheduleSlots);

    // Use default field price as an example; actual booking totals are computed per-slot
    const examplePrice = getDefaultFieldPrice();

    const response = NextResponse.json({
      success: true,
      field: { ...DEFAULT_FIELD, price: examplePrice },
      schedules,
    });
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    return response;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[API] Field availability error for ${normalizedFieldId} on ${date}:`, {
      error: errorMsg,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    const schedules = buildTimeSlots(date, []);
    const response = NextResponse.json({ success: true, field: DEFAULT_FIELD, schedules, _debug: `Fallback due to ${errorMsg}` });
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    return response;
  }
}
