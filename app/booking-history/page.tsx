"use client";

import { fetchJson } from "@/lib/fetch-json";

import { useState } from "react";
import { AnimatedCard } from "@/components/animated-card";
import { formatCurrency } from "@/utils/formatting";

type BookingHistoryItem = {
  id: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: string;
  customerName: string;
  customerEmail: string;
  payments?: Array<{
    status: string;
    transactionId?: string;
    snapUrl?: string | null;
    paymentMethod?: string;
  }>;
};

export const dynamic = "force-dynamic";

function formatBookingDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getBadgeClasses(status: string) {
  switch (status) {
    case "confirmed":
    case "success":
      return "bg-emerald-500/10 text-emerald-200";
    case "pending":
      return "bg-amber-500/10 text-amber-200";
    case "cancelled":
    case "expired":
    case "refunded":
      return "bg-rose-500/10 text-rose-200";
    default:
      return "bg-[color:rgba(16,185,129,0.12)] text-[color:var(--accent)]";
  }
}

export default function BookingHistoryPage() {
  const [bookings, setBookings] = useState<BookingHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email && !phone) {
      setError("Please enter your email or phone number.");
      return;
    }

    setLoading(true);
    setError(null);
    setBookings([]);
    setSearched(true);

    try {
      const query = new URLSearchParams();
      if (email) query.append("email", email);
      if (phone) query.append("phone", phone);

      const { res: response, data: __body } = await fetchJson(`/api/bookings?${query.toString()}`, {
        cache: "no-store",
      });

      const data = __body;
      if (!response.ok || !data.success) {
        throw new Error(String(data.message ?? "") || "Unable to load booking history.");
      }
      
      setBookings(data.bookings as BookingHistoryItem[]);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 bg-[color:var(--background)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <AnimatedCard className="p-6 sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-strong)]">Find your bookings</p>
            <h1 className="mt-2 text-balance text-3xl font-semibold leading-tight text-[color:var(--foreground)] sm:text-4xl">Search your booking history</h1>
            <p className="mt-2 text-[color:var(--muted)]">Enter your email or phone number to view all your bookings.</p>
          </div>

          <form onSubmit={handleSearch} className="mt-8 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[color:var(--muted)]">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-white outline-none focus:border-[color:var(--accent)] placeholder:text-[color:var(--muted)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[color:var(--muted)]">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+62..."
                  className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-white outline-none focus:border-[color:var(--accent)] placeholder:text-[color:var(--muted)]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-8 py-3 disabled:opacity-60"
            >
              {loading ? "Searching…" : "Search"}
            </button>
          </form>

          {error && searched ? (
            <div className="mt-4 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
              {error}
            </div>
          ) : null}
        </AnimatedCard>

        {searched && (
          <AnimatedCard className="p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-strong)]">Booking history</p>
                <h2 className="mt-2 text-balance text-2xl font-semibold leading-tight text-[color:var(--foreground)] sm:text-3xl">Your complete booking timeline</h2>
              </div>
            </div>

            <div className="mt-8">
              {loading ? (
                <div className="glass-panel rounded-3xl p-6 text-sm text-[color:var(--muted)]">Loading booking history…</div>
              ) : bookings.length === 0 ? (
                <div className="glass-panel rounded-3xl p-6 text-sm text-[color:var(--muted)]">No bookings found for this email or phone number.</div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/10">
                    <table className="min-w-[640px] w-full table-auto text-left text-sm text-[color:var(--muted)]">
                      <thead className="bg-[color:rgba(0,0,0,0.28)] text-[color:var(--muted)]">
                        <tr>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((item) => (
                          <tr key={item.id} className="border-t border-white/10 bg-[color:rgba(15,23,42,0.08)]">
                            <td className="px-4 py-3">{item.customerName}</td>
                            <td className="px-4 py-3">{formatBookingDate(item.bookingDate)}</td>
                            <td className="px-4 py-3">{formatCurrency(item.totalPrice)}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-2">
                                <span className={`rounded-full px-3 py-1 text-sm ${getBadgeClasses(item.status)}`}>{item.status}</span>
                                {item.payments?.[0]?.status === "pending" && item.payments?.[0]?.snapUrl ? (
                                  <a
                                    href={item.payments[0].snapUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-full bg-[color:rgba(16,185,129,0.12)] px-3 py-1 text-center text-xs font-semibold text-emerald-200"
                                  >
                                    Continue payment
                                  </a>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden space-y-3">
                    {bookings.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-white/10 card-surface p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-[color:var(--muted)]">Name</p>
                            <p className="font-semibold text-[color:var(--foreground)]">{item.customerName}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-sm ${getBadgeClasses(item.status)}`}>{item.status}</span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-[color:var(--muted)]">
                          <div>
                            <p className="text-xs text-[color:var(--muted)]">Date</p>
                            <p className="text-sm text-[color:var(--foreground)]">{formatBookingDate(item.bookingDate)}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-[color:var(--muted)]">Amount</p>
                            <p className="text-sm text-[color:var(--foreground)]">{formatCurrency(item.totalPrice)}</p>
                          </div>
                          {item.payments?.[0]?.status === "pending" && item.payments?.[0]?.snapUrl ? (
                            <div className="col-span-2">
                              <a
                                href={item.payments[0].snapUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex rounded-full bg-[color:rgba(16,185,129,0.12)] px-4 py-2 text-xs font-semibold text-emerald-200"
                              >
                                Continue payment
                              </a>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </AnimatedCard>
        )}
      </div>
    </main>
  );
}
