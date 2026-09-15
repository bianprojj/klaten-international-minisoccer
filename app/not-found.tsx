import Link from "next/link";

export const metadata = {
  title: "Halaman Tidak Ditemukan | Klaten Minisoccer",
  description: "Halaman tidak ditemukan. Kembali ke sewa lapangan mini soccer di Klaten.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-strong)]">404</p>
      <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Halaman tidak ditemukan</h1>
      <p className="mx-auto mt-4 max-w-xl text-[color:var(--muted)]">
        Halaman hilang. Kembali booking lapangan mini soccer di Klaten.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className="btn-primary">Beranda</Link>
        <Link href="/book" className="btn-primary">Booking Lapangan</Link>
      </div>
    </main>
  );
}
