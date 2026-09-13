import Image from "next/image";
import { FALLBACK_REMOTE_IMAGES, getSafeRemoteImageUrl } from "@/lib/remote-image";
import type { FacilityImage, SiteContent } from "@/types";

// ponytail: no onError fallback state, ceiling 4 imgs, add error boundary when remote 5xx frequent
export function HeroSection({ facilities, content = {} as Partial<SiteContent> }: { facilities: FacilityImage[]; content?: Partial<SiteContent> }) {
  const displayFacilities = facilities.filter((facility) => facility && typeof facility.title === "string");
  const heroBackgroundUrl = getSafeRemoteImageUrl(content.backgroundImageUrl, FALLBACK_REMOTE_IMAGES, 0);

  return (
    <section
      className="relative -mt-16 overflow-hidden bg-[color:var(--background)] pt-20 sm:pt-24"
    >
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {heroBackgroundUrl ? (
          <Image
            src={heroBackgroundUrl}
            alt=""
            aria-hidden="true"
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            className="object-cover brightness-110"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.28),transparent_30%),linear-gradient(120deg,rgba(15,23,42,0.94),rgba(15,23,42,0.8))]" />
        )}
        <div className="absolute inset-0 bg-[color:var(--background)]/5" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_35%)]" />
      <div className="pointer-events-none absolute left-1/2 top-6 h-96 w-96 -translate-x-1/2 rounded-full hero-accent blur-xl" />
      <div className="pointer-events-none absolute -left-16 top-10 h-48 w-48 rounded-full hero-glow blur-xl shadow-[0_0_120px_rgba(255,255,255,0.45)]" />
      <div className="pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full hero-ring blur-xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full hero-bottom blur-xl" />
      <div className="absolute inset-0 hero-overlay" />
      <div className="relative px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto w-full max-w-7xl text-center text-[color:var(--foreground)]">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[color:var(--accent-strong)]">
            {content.locationLabel}
          </p>
          <h1 className="hero-title mt-5 text-4xl font-semibold tracking-tight leading-[1.05] sm:text-5xl lg:text-6xl">
            {content.heroTitle}
          </h1>
          <p className="hero-subtitle mx-auto mt-8 max-w-2xl text-base font-medium leading-8 text-[color:var(--foreground)] sm:text-lg sm:leading-9">
            {content.heroSubtitle}
          </p>

          <div className="relative mx-auto mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[rgba(251,203,232,0.24)] via-[rgba(147,197,253,0.18)] to-[rgba(199,210,254,0.02)] blur-xl" />
            <a
              href="/book"
              className="btn-primary relative z-10 w-full sm:w-auto"
            >
              {content.ctaPrimary}
            </a>
            <a
              href="/booking-history"
              className="btn-secondary relative z-10 w-full sm:w-auto"
            >
              {content.ctaSecondary}
            </a>
          </div>

          <div className="mt-14 grid items-stretch gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
            {displayFacilities.map((facility, index) => (
              <div key={facility.id ?? facility.title} className="flex h-full flex-col rounded-[2rem] border border-[color:var(--border-strong)] bg-[color:var(--surface)] p-4 shadow-sm backdrop-blur-xl">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-[color:var(--surface)]">
                  <Image
                    src={getSafeRemoteImageUrl(facility.imageUrl, FALLBACK_REMOTE_IMAGES, index)}
                    alt={facility.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    loading="lazy"
                    decoding="async"
                    className="object-cover"
                  />
                </div>
                <h3 className="mt-4 line-clamp-1 text-lg font-semibold text-[color:var(--foreground)]">{facility.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[color:var(--muted)]">{facility.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
