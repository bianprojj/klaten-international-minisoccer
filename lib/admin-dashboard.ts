import { prisma } from "@/lib/prisma";

export interface AdminSummary {
  revenueToday: number;
  revenueThisMonth: number;
  bookingsToday: number;
  bookingsThisMonth: number;
  pendingBookings: number;
  pendingPayments: number;
  peakHours: Array<{ hour: string; bookings: number }>;
  mostBookedField: { name: string; bookings: number } | null;
  customerStats: { totalCustomers: number; activeCustomers: number; newCustomersThisMonth: number };
}

export function getDefaultAdminSummary(): AdminSummary {
  return {
    revenueToday: 0,
    revenueThisMonth: 0,
    bookingsToday: 0,
    bookingsThisMonth: 0,
    pendingBookings: 0,
    pendingPayments: 0,
    peakHours: [],
    mostBookedField: null,
    customerStats: { totalCustomers: 0, activeCustomers: 0, newCustomersThisMonth: 0 },
  };
}

function isMissingTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeCode = (error as { code?: unknown }).code;
  const maybeMessage = (error as { message?: unknown }).message;

  return maybeCode === "P2021" || (typeof maybeMessage === "string" && maybeMessage.includes("does not exist"));
}

// Runs a summary query with the same degrade-to-default semantics as before.
// All queries are independent, so callers run them concurrently.
async function safeSummaryQuery<T>(label: string, fallbackValue: T, query: () => Promise<T>): Promise<T> {
  try {
    return await query();
  } catch (error) {
    if (!isMissingTableError(error)) {
      console.error(label, error);
    }
    return fallbackValue;
  }
}

export async function getAdminSummary(): Promise<AdminSummary> {
  const fallback = getDefaultAdminSummary();

  try {
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const endOfToday = new Date(startOfToday);
    endOfToday.setUTCDate(endOfToday.getUTCDate() + 1);

    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    const [
      revenueToday,
      revenueThisMonth,
      pendingBookings,
      pendingPayments,
      bookingsToday,
      bookingsThisMonth,
      peakHours,
      mostBookedField,
      customerStats,
    ] = await Promise.all([
      safeSummaryQuery("[ADMIN] Unable to load today's revenue summary:", 0, async () => {
        const result = await prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: "success", paidAt: { gte: startOfToday, lt: endOfToday } },
        });
        return Number(result._sum.amount ?? 0);
      }),
      safeSummaryQuery("[ADMIN] Unable to load monthly revenue summary:", 0, async () => {
        const result = await prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: "success", paidAt: { gte: startOfMonth, lt: endOfMonth } },
        });
        return Number(result._sum.amount ?? 0);
      }),
      safeSummaryQuery("[ADMIN] Unable to load pending bookings summary:", 0, async () => {
        return prisma.booking.count({
          where: { status: "pending" },
        });
      }),
      safeSummaryQuery("[ADMIN] Unable to load pending payments summary:", 0, async () => {
        return prisma.payment.count({
          where: { status: "pending" },
        });
      }),
      safeSummaryQuery("[ADMIN] Unable to load today's booking count:", 0, async () => {
        return prisma.booking.count({
          where: {
            bookingDate: { gte: startOfToday, lt: endOfToday },
            status: { in: ["confirmed", "completed"] },
          },
        });
      }),
      safeSummaryQuery("[ADMIN] Unable to load monthly booking count:", 0, async () => {
        return prisma.booking.count({
          where: {
            bookingDate: { gte: startOfMonth, lt: endOfMonth },
            status: { in: ["confirmed", "completed"] },
          },
        });
      }),
      safeSummaryQuery("[ADMIN] Unable to load peak hours summary:", [] as Array<{ hour: string; bookings: number }>, async () => {
        const peakRows = await prisma.booking.groupBy({
          by: ["startTime"],
          _count: { startTime: true },
          where: {
            bookingDate: { gte: startOfMonth, lt: endOfMonth },
            status: { in: ["confirmed", "completed"] },
          },
          orderBy: { _count: { startTime: "desc" } },
          take: 5,
        });
        return peakRows.map((r) => ({ hour: r.startTime, bookings: r._count.startTime }));
      }),
      safeSummaryQuery("[ADMIN] Unable to load most-booked-field summary:", null as { name: string; bookings: number } | null, async () => {
        const mostBookedCount = await prisma.booking.count({
          where: {
            bookingDate: { gte: startOfMonth, lt: endOfMonth },
            status: { in: ["confirmed", "completed"] },
          },
        });

        return {
          name: "Lapangan Klaten International",
          bookings: mostBookedCount,
        };
      }),
      safeSummaryQuery(
        "[ADMIN] Unable to load customer stats summary:",
        { totalCustomers: 0, activeCustomers: 0, newCustomersThisMonth: 0 },
        async () => {
          const customerBookings = await prisma.booking.findMany({
            select: {
              customerEmail: true,
              customerPhone: true,
              createdAt: true,
              status: true,
            },
          });
          const customerKey = (booking: (typeof customerBookings)[number]) =>
            booking.customerEmail?.trim().toLowerCase() || booking.customerPhone.trim();
          const customers = new Map<string, (typeof customerBookings)[number]>();

          for (const booking of customerBookings) {
            const key = customerKey(booking);
            const existing = customers.get(key);
            if (!existing || booking.createdAt < existing.createdAt) {
              customers.set(key, booking);
            }
          }

          const totalCustomers = customers.size;
          const activeCustomers = customerBookings
            .filter((booking) => !["cancelled", "expired"].includes(booking.status))
            .reduce((keys, booking) => keys.add(customerKey(booking)), new Set<string>()).size;
          const newCustomersThisMonth = [...customers.values()].filter(
            (booking) => booking.createdAt >= startOfMonth,
          ).length;

          return { totalCustomers, activeCustomers, newCustomersThisMonth };
        },
      ),
    ]);

    return {
      revenueToday,
      revenueThisMonth,
      bookingsToday,
      bookingsThisMonth,
      pendingBookings,
      pendingPayments,
      peakHours,
      mostBookedField,
      customerStats,
    };
  } catch (error) {
    console.error("[ADMIN] Unable to load dashboard summary:", error);
    return fallback;
  }
}
