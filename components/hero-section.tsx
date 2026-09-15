import Image from "next/image";
import { FALLBACK_REMOTE_IMAGES, getSafeRemoteImageUrl } from "@/lib/remote-image";
import type { FacilityImage, SiteContent } from "@/types";

// ponytail: no onError fallback state, ceiling 4 imgs, add error boundary when remote 5xx frequent
export function HeroSection({ facilities, content = {} as Partial<SiteContent> }: { facilities: FacilityImage[]; content?: Partial<SiteContent> }) {
  const displayFacilities = facilities.filter((facility) => facility && typeof facility.title === "string");
  const heroBackgroundUrl = getSafeRemoteImageUrl(content.backgroundImageUrl, FALLBACK_REMOTE_IMAGES, 0);

  return (
    <section
      className="relative -mt-[68px] overflow-hidden bg-[#F1EED9] md:-mt-[76px]"
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
            className="object-cover scale-x-[2.2] scale-y-[2.2]"
          />
        ) : (
          <div className="absolute inset-0 bg-[#005136]" />
        )}
        <div className="absolute inset-0 bg-[#005136]/30" />
      </div>
      <div className="relative px-4 pb-20 pt-[92px] sm:px-6 sm:pb-24 sm:pt-[116px] lg:px-8">
        <div className="mx-auto w-full max-w-[1180px] text-center">
          <p className="font-[Manrope] text-sm font-semibold text-[#F1EED9]/90">
            {content.locationLabel}
          </p>
          <h1 className="mt-5 font-[Archivo] text-[40px] font-black leading-[1.05] tracking-[-0.02em] text-[#F1EED9] sm:text-[56px]">
            {content.heroTitle}
          </h1>
          <p className="mx-auto mt-8 max-w-2xl font-[Manrope] text-[18px] font-normal leading-[1.5] text-[#F1EED9]/90">
            {content.heroSubtitle}
          </p>

          <div className="relative mx-auto mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/book"
              className="btn-primary relative z-10 w-full sm:w-auto"
            >
              {content.ctaPrimary}
            </a>
            <a
              href="/booking-history"
              className="relative z-10 inline-flex items-center justify-center rounded-[14px] border-[1.5px] border-[#F1EED9] bg-transparent px-7 py-3.5 font-[Manrope] text-base font-medium text-[#F1EED9] transition hover:bg-white/10"
            >
              {content.ctaSecondary}
            </a>
          </div>

          <div className="mt-14 grid items-stretch gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
            {displayFacilities.map((facility, index) => (
              <div key={facility.id ?? facility.title} className="relative overflow-hidden rounded-[20px] border border-white/20 bg-[var(--glass-bg)] shadow-lg shadow-black/5 backdrop-blur-xl">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-[20px] bg-[#FFFFFF]">
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
                <div className="p-6">
                  <h3 className="mt-2 font-[Archivo] text-xl font-bold text-[#1A1F4D]">{facility.title}</h3>
                  <p className="mt-2 font-[Manrope] text-sm leading-6 text-[rgba(26,31,77,0.62)]">{facility.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
