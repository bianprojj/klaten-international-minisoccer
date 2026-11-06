import { resolveBookingUpdatePayload } from "@/lib/booking-admin";

describe("resolveBookingUpdatePayload", () => {
  it("applies date and time changes and recomputes duration and pricing", () => {
    const result = resolveBookingUpdatePayload(
      {
        bookingDate: "2026-11-06",
        startTime: "17:30",
        endTime: "19:00",
        customerName: "Anan Hartanto",
        customerPhone: "08572872111",
        customerEmail: "hartantoaanann@gmail.com",
        notes: "ubah jam booking",
        status: "confirmed",
      },
      {
        bookingDate: "2026-11-03T00:00:00.000Z",
        startTime: "16:30",
        endTime: "18:00",
        totalPrice: 220000,
        durationHours: 2,
      }
    );

    expect(result.bookingDate).toBe("2026-11-06");
    expect(result.startTime).toBe("17:30");
    expect(result.endTime).toBe("19:00");
    expect(result.durationHours).toBe(2);
    expect(result.totalPrice).toBe(220000);
    expect(result.status).toBe("confirmed");
    expect(result.customerName).toBe("Anan Hartanto");
  });
});
