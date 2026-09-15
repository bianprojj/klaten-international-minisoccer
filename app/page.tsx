import type { Metadata } from "next";
import type { Review } from "@/types";
import { HeroSection } from "@/components/hero-section";
import { ReviewSection } from "@/components/review-section";
import { SectionHeading } from "@/components/section-heading";
import { getReviews, getVenueFeatures, getVenueGallery } from "@/lib/data";
import { siteConfig } from "@/lib/site-config";
import { getSiteContent } from "@/lib/site-content";
import { getDefaultFieldPrice } from "@/lib/venue";
import CurveCarousel from "@/components/gallery/CurveCarousel";
import { LocationMap } from "@/components/location-map";

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: "/",
    type: "website",
  },
};

export const revalidate = 60;

export default async function Home() {
  let reviews: Review[] = [];
  const [features, gallery, content] = await Promise.all([getVenueFeatures(), getVenueGallery(), getSiteContent()]);
  const hourlyRate = getDefaultFieldPrice();
  try {
    reviews = await getReviews();
  } catch (error) {
    console.error('❌ Failed to load reviews:', error);
  }
  const ratings = reviews.map((r) => Number(r.rating)).filter((n) => Number.isFinite(n) && n > 0);
  const reviewCount = ratings.length;
  const ratingValue = reviewCount ? Number((ratings.reduce((a, b) => a + b, 0) / reviewCount).toFixed(1)) : 4.9;
  const faqs = [
    { q: "Di mana lapangan mini soccer di Klaten?", a: "Klaten Minisoccer di Jl. Desa Karanganom, Karanganom, Klaten Utara, Klaten, Jawa Tengah. Buka setiap hari 06.00–23.00 WIB." },
    { q: "Berapa harga sewa lapangan Klaten?", a: `Harga sewa mulai Rp ${hourlyRate.toLocaleString("id-ID")} per jam, transparan di halaman booking tanpa biaya tersembunyi.` },
    { q: "Bagaimana cara booking lapangan Klaten online?", a: "Pilih tanggal dan jam di halaman Booking, isi nama dan WhatsApp, lalu bayar via Midtrans. Konfirmasi instan." },
    { q: "Jam berapa lapangan buka?", a: "Setiap hari 06.00–23.00 WIB, termasuk akhir pekan dan hari libur." },
    { q: "Apakah cocok untuk futsal dan komunitas?", a: "Ya. Lapangan 5v5 premium, lampu malam, sewa bola dan sepatu, ruang ganti, cocok untuk futsal, mini soccer, dan komunitas." },
  ];
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SportsActivityLocation",
        "@id": `${siteConfig.url}/#venue`,
        name: "Klaten Minisoccer - Sewa Lapangan Mini Soccer di Klaten",
        url: siteConfig.url,
        image: [`${siteConfig.url}/kim-logo.png`],
        telephone: siteConfig.phone,
        email: siteConfig.email,
        priceRange: `Rp ${hourlyRate.toLocaleString("id-ID")}`,
        description: siteConfig.description,
        address: {
          "@type": "PostalAddress",
          streetAddress: "Jl. Desa Karanganom, Karanganom, Klaten Utara",
          addressLocality: "Klaten",
          addressRegion: "Jawa Tengah",
          postalCode: "57438",
          addressCountry: "ID",
        },
        geo: { "@type": "GeoCoordinates", latitude: -7.6848873, longitude: 110.6101472 },
        openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], opens: "06:00", closes: "23:00" }],
        aggregateRating: { "@type": "AggregateRating", ratingValue, reviewCount: Math.max(reviewCount, 1) },
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.name,
        inLanguage: "id-ID",
      },
      {
        "@type": "FAQPage",
        "@id": `${siteConfig.url}/#faq`,
        mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };

  return (
    <main className="flex-1">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <HeroSection facilities={features} content={content} />

      <CurveCarousel images={gallery} price={hourlyRate} />

      <ReviewSection initialReviews={reviews} />

      <section aria-labelledby="faq-heading" className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading eyebrow="FAQ sewa lapangan Klaten" title="Pertanyaan seputar lapangan di Klaten" id="faq-heading" />
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {faqs.map((f) => (
              <details key={f.q} className="card-surface p-6">
                <summary className="cursor-pointer font-semibold">{f.q}</summary>
                <p className="mt-2 text-[color:var(--muted)]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="location-heading" className="border border-[color:var(--border-strong)] bg-[color:var(--surface-strong)] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <SectionHeading eyebrow="Lokasi lapangan" title="Temukan lapangan kami di Klaten" id="location-heading" />
              <p className="mt-4 max-w-2xl text-lg text-[color:var(--muted)]">
                Lapangan terletak strategis, mudah dijangkau, dan didukung fasilitas pendukung untuk tim mini soccer.
              </p>
            </div>
            <LocationMap />
          </div>
        </div>
      </section>
    </main>
  );
}
