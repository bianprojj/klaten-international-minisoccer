import type { Metadata } from "next";
import Link from "next/link";
import { FieldCard } from "@/components/field-card";
import { fields as fallbackFields } from "@/lib/mock-data";
import { getFields } from "@/lib/data";
import type { Field } from "@/types";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lapangan Mini Soccer Klaten | Harga & Fasilitas",
  description: "Daftar lapangan mini soccer Klaten. Harga per jam transparan, fasilitas lengkap. Booking online cepat.",
  alternates: { canonical: "/fields" },
};;

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

async function loadFields(): Promise<Field[]> {
  try {
    return await getFields();
  } catch (error) {
    console.error("Failed to load fields directly from DB for /fields page:", error);
  }

  try {
    const appUrl = await getAppUrl();
    const response = await fetch(new URL("/api/fields", appUrl).toString(), {
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.success && Array.isArray(data.data) && data.data.length > 0) {
        return data.data;
      }
      console.error("Fields API returned invalid data for /fields page:", data);
    } else {
      const body = await response.text();
      console.error(`Fields API returned ${response.status} for /fields page: ${body}`);
    }
  } catch (error) {
    console.error("Failed to load fields from internal API for /fields page:", error);
  }

  console.warn("Using fallback fields for /fields page.");
  return fallbackFields;
}

export default async function FieldsPage() {
  const fields = await loadFields();

  return (
    <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-strong)]">Browse fields</p>
            <h1 className="mt-2 text-balance text-3xl font-semibold leading-tight text-[color:var(--foreground)] sm:text-4xl">Find a field for your next match</h1>
          </div>
          <Link href="/book" className="rounded-full border border-[color:rgba(16,185,129,0.24)] px-5 py-2 text-sm text-[color:var(--accent)] transition hover:bg-[color:rgba(16,185,129,0.06)]">
            Continue to booking
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {fields.map((field) => (
            <FieldCard key={field.id} field={field} />
          ))}
        </div>
      </div>
    </main>
  );
}
