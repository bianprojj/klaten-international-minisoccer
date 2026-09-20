import { fetchJson } from "@/lib/fetch-json";
import type { Metadata } from "next";
import { fields as fallbackFields } from "@/lib/mock-data";
import { getFields } from "@/lib/data";
import { BookingForm } from "@/components/booking-form";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sewa Lapangan Klaten | Booking Mini Soccer & Futsal",
  description: "Sewa lapangan Klaten di Klaten International Minisoccer, Karanganom Klaten Utara. Booking lapangan mini soccer Klaten online, harga sekitar Rp 214.000 - 750.000, jadwal per jam.",
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

async function loadFields() {
  try {
    const fields = await getFields();
    return { fields, usingFallback: false } as const;
  } catch (error) {
    console.error("Failed to load fields directly from DB:", error);
  }

  try {
    const appUrl = await getAppUrl();
    const { res: response, data: __body } = await fetchJson(new URL("/api/fields", appUrl).toString(), {
      cache: "no-store",
    });

    if (response.ok) {
      const data = __body;
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
  const { fields, usingFallback } = await loadFields();

  return (
    <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <section>
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
