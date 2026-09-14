"use client";

import { useMemo } from "react";
import type { VenueGalleryImage } from "@/types";
import { useCarousel } from "@/hooks/useCarousel";
import { CurveCarouselDots } from "./CurveCarouselDots";
import { CurveCarouselItem } from "./CurveCarouselItem";

interface CurveCarouselProps {
  images: VenueGalleryImage[];
  price: number;
}

function normalizeOffset(index: number, activeIndex: number, count: number) {
  const raw = index - activeIndex;
  const half = Math.floor(count / 2);

  if (raw > half) return raw - count;
  if (raw < -half) return raw + count;
  return raw;
}

export default function CurveCarousel({ images, price }: CurveCarouselProps) {
  const { activeIndex, previous, next, setActiveIndex, handleKeyDown } = useCarousel(images.length);
  const visibleRange = 3;

  const visibleItems = useMemo(
    () =>
      images
        .map((image, index) => {
          const offset = normalizeOffset(index, activeIndex, images.length);
          return {
            image,
            offset,
            isVisible: Math.abs(offset) <= visibleRange,
          };
        })
        .filter((item) => item.isVisible),
    [images, activeIndex, visibleRange]
  );

  if (!images.length) return null;

  return (
    <section
      aria-labelledby="venue-gallery-heading"
      className="relative w-full overflow-hidden px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
      style={{ backgroundColor: "#0b0f14" }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="aurora" />
      <div className="aurora-mid" />
      <div className="absolute inset-0 grid-tex" />
      <div className="relative mx-auto w-full max-w-7xl">
        <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#2dd4bf]">Galeri lapangan</p>
            <h2 id="venue-gallery-heading" className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl" style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}>
              Klaten International Minisoccer
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
              Jelajahi koleksi foto lapangan premium yang menempatkan setiap gambar dalam ruang bernapas dan fokus visual berkelas.
            </p>
          </div>

          <div className="glass inline-flex max-w-full flex-wrap items-center gap-3 self-start rounded-full px-5 py-3 text-sm text-white/80 lg:self-auto">
            <span className="font-semibold text-white">Harga sewa</span>
            <span className="rounded-full bg-slate-950/60 px-3 py-2 text-sm text-[#2dd4bf]">Rp {price.toLocaleString("id-ID")} / jam</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-5xl px-4 pb-6 sm:px-6">
          <div className="pointer-events-none absolute inset-x-0 bottom-16 mx-auto h-24 max-w-2xl rounded-[100%] bg-[#2dd4bf]/10 blur-3xl" />
          <div
            className="coverflow relative mx-auto w-full"
            role="group"
            aria-label="Gallery carousel"
          >
            {visibleItems.map(({ image, offset }) => (
              <CurveCarouselItem
                key={image.id}
                image={image}
                offset={offset}
                isActive={offset === 0}
                onSelect={() => setActiveIndex(images.indexOf(image))}
              />
            ))}
          </div>

          <div className="mt-7 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={previous}
              className="nav-btn glass text-slate-200"
              aria-label="Sebelumnya"
            >
              <span className="inline-flex h-full w-full items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M15.41 7.41 10.83 12l4.58 4.59L14 18l-6-6 6-6z" />
                </svg>
              </span>
            </button>
            <CurveCarouselDots activeIndex={activeIndex} count={images.length} onSelect={setActiveIndex} />
            <button
              type="button"
              onClick={next}
              className="nav-btn glass text-slate-200"
              aria-label="Berikutnya"
            >
              <span className="inline-flex h-full w-full items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
