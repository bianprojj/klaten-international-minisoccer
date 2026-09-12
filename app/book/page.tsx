import type { Metadata } from "next";
import { bookingSteps, bookedSlots as fallbackBookedSlots, fields as fallbackFields } from "@/lib/mock-data";
import { getUpcomingBookings, getFields, mapBookingsToSlots } from "@/lib/data";
import { expirePendingPayments } from "@/lib/payment-service";
import { BookingForm } from "@/components/booking-form";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Booking Lapangan Mini Soccer Klaten | Jadwal & Harga",
  description: "Booking lapangan mini soccer Klaten. Pilih tanggal dan jam, checkout cepat, konfirmasi instan. Telp +62 812 3456 7890.",
  alternates: { canonical: "/book" },
};

async function getAppUrl() {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = forwardedHost ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";

  if (host) {
    return `${protocol}://${host}`;
  }

  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

async function loadBookedSlots() {
  try {
    await expirePendingPayments();
    const bookings = await getUpcomingBookings(5);
    return mapBookingsToSlots(bookings);
  } catch (error) {
    console.error("Failed to load booked slots:", error);
    return fallbackBookedSlots;
  }
}

async function loadFields() {
  try {
    const fields = await getFields();
    return { fields, usingFallback: false } as const;
  } catch (error) {
    console.error("Failed to load fields directly from DB:", error);
  }

  try {
    const appUrl = await getAppUrl();
    const response = await fetch(new URL("/api/fields", appUrl).toString(), {
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.success && Array.isArray(data.data) && data.data.length > 0) {
        return { fields: data.data, usingFallback: false } as const;
      }
      console.error("Fields API returned invalid data:", data);
    } else {
      const body = await response.text();
      console.error(`Fields API returned ${response.status}: ${body}`);
    }
  } catch (error) {
    console.error("Failed to load fields from internal API:", error);
  }

  console.warn("Using fallback fields data for booking page.");
  return { fields: fallbackFields, usingFallback: true } as const;
}

export default async function BookPage() {
  const bookedSlots = await loadBookedSlots();
  const { fields, usingFallback } = await loadFields();

  return (
    <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="card-surface p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-strong)]">Booking flow</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold leading-tight text-[color:var(--foreground)] sm:text-4xl">Choose your date, time, and payment method</h1>
          <p className="mt-4 max-w-2xl text-lg text-[color:var(--muted)]">
            The booking experience is designed for fast checkout with instant confirmation and a clean hourly schedule.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {bookingSteps.map((step) => (
              <div key={step.title} className="rounded-2xl border border-white/10 card-surface p-6">
                <h2 className="font-semibold text-[color:var(--foreground)]">{step.title}</h2>
                <p className="mt-2 text-sm text-[color:var(--muted)]">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <div className="card-surface p-8 h-full">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-strong)]">Available schedule</p>
                <h2 className="mt-2 text-balance text-2xl font-semibold leading-tight text-[color:var(--foreground)] sm:text-3xl">One client per slot, selected by hour</h2>
              </div>
              <p className="text-sm text-[color:var(--muted)] max-w-xl">
                Each booking is limited to one customer per field and time slot so schedules do not overlap.
              </p>
            </div>

            <div className="mt-8">
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-[color:var(--surface)]">
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full table-auto text-left text-sm text-[color:var(--muted)]">
                    <thead className="bg-[color:var(--surface-strong)] text-[color:var(--muted)]">
                      <tr>
                        <th className="whitespace-nowrap px-4 py-3">Date</th>
                        <th className="whitespace-nowrap px-4 py-3">Time</th>
                        <th className="whitespace-nowrap px-4 py-3">Field</th>
                        <th className="whitespace-nowrap px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookedSlots.map((slot) => (
                        <tr key={`${slot.date}-${slot.time}-${slot.field}`} className="border-t border-white/10">
                          <td className="px-4 py-3 font-medium text-[color:var(--foreground)]">{slot.date}</td>
                          <td className="px-4 py-3">{slot.time}</td>
                          <td className="px-4 py-3">{slot.field}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full bg-[color:rgba(16,185,129,0.12)] px-3 py-1 text-[color:var(--accent)]">
                              {slot.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-3 p-4">
                  {bookedSlots.map((slot) => (
                    <div key={`${slot.date}-${slot.time}-${slot.field}`} className="rounded-3xl border border-white/10 bg-[color:var(--surface-strong)] p-4">
                      <div className="flex flex-col gap-3">
                        <div>
                          <p className="text-xs text-[color:var(--muted)]">Date</p>
                          <p className="font-semibold text-[color:var(--foreground)]">{slot.date}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[color:var(--muted)]">Time</p>
                          <p className="text-sm text-[color:var(--foreground)]">{slot.time}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[color:var(--muted)]">Field</p>
                          <p className="text-sm text-[color:var(--foreground)]">{slot.field}</p>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-xs text-[color:var(--muted)]">Status</p>
                          <span className="rounded-full bg-[color:rgba(16,185,129,0.12)] px-3 py-1 text-[color:var(--accent)] text-sm">{slot.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside className="card-glow p-8 h-full">
            {usingFallback ? (
              <div className="rounded-3xl border border-rose-500/10 bg-rose-500/5 p-8">
                <p className="text-sm uppercase tracking-[0.3em] text-rose-200">Booking unavailable</p>
                <h2 className="mt-3 text-balance text-2xl font-semibold leading-tight text-[color:var(--foreground)] sm:text-3xl">Database connection required</h2>
                <p className="mt-4 text-sm text-[color:var(--muted)]">
                  The booking service is temporarily unavailable because the database could not be accessed. Please try again later.
                </p>
              </div>
            ) : (
              <BookingForm fields={fields} />
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}
