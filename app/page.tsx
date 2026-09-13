import type { Metadata } from "next";
import type { Review } from "@/types";
import { HeroSection } from "@/components/hero-section";
import { ReviewSection } from "@/components/review-section";
import { SectionHeading } from "@/components/section-heading";
import { getReviews, getVenueFeatures, getVenueGallery } from "@/lib/data";
import { siteConfig } from "@/lib/site-config";
import { getSiteContent } from "@/lib/site-content";
import { getFieldHourlyRate } from "@/lib/site-content";
import CurveCarousel from "@/components/gallery/CurveCarousel";

export const metadata: Metadata = {
  title: "Klaten Minisoccer | Booking Lapangan Mini Soccer di Klaten",
  description:
    "Booking lapangan mini soccer Klaten online. Harga transparan, fasilitas lengkap, jadwal fleksibel. Telp +62 812 3456 7890.",
  alternates: {
    canonical: "/",
  },
};

export const revalidate = 60;

export default async function Home() {
  let reviews: Review[] = [];
  const [features, gallery, content, hourlyRate] = await Promise.all([getVenueFeatures(), getVenueGallery(), getSiteContent(), getFieldHourlyRate()]);
  try {
    reviews = await getReviews();
  } catch (error) {
    console.error('❌ Failed to load reviews:', error);
  }
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: siteConfig.name,
    url: siteConfig.url,
    image: `${siteConfig.url}/kim-logo.svg`,
    telephone: "+62 812 3456 7890",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Klaten",
      addressLocality: "Klaten",
      addressRegion: "Jawa Tengah",
      addressCountry: "ID",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: -7.7115,
      longitude: 110.6030,
    },
    openingHours: "Mo-Su 07:00-22:00",
    priceRange: "Rp",
    description: siteConfig.description,
    sameAs: [siteConfig.url],
  };

  return (
    <main className="flex-1">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <HeroSection facilities={features} content={content} />

      <CurveCarousel images={gallery} price={hourlyRate} />

      <ReviewSection initialReviews={reviews} />

      <section aria-labelledby="location-heading" className="border border-[color:var(--border-strong)] bg-[color:var(--surface-strong)] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <SectionHeading eyebrow="Lokasi lapangan" title="Temukan lapangan kami di Klaten" id="location-heading" />
              <p className="mt-4 max-w-2xl text-lg text-[color:var(--muted)]">
                Lapangan terletak strategis, mudah dijangkau, dan didukung fasilitas pendukung untuk tim mini soccer.
              </p>
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-[color:var(--border-strong)] bg-[color:var(--surface)]">
              <iframe
                title="Klaten International Minisoccer location"
                src="https://www.openstreetmap.org/export/embed.html?bbox=110.5950%2C-7.7210%2C110.6110%2C-7.7020&layer=mapnik"
                className="h-[360px] w-full border-0"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
