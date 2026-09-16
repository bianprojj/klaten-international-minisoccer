"use client";

import { useMemo } from "react";
import type { VenueGalleryImage } from "@/types";
import { useCarousel } from "@/hooks/useCarousel";
import { PRICE_RANGE_SHORT, PRICE_DISCOUNT_NOTE } from "@/lib/venue";
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
  const { activeIndex, previous, next, setActiveIndex, handleKeyDown, setPaused } = useCarousel(images.length, 2500);
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
      className="relative w-full overflow-hidden bg-[#F1EED9] px-4 py-16 sm:px-6 lg:px-8"
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      tabIndex={0}
    >
      <div className="relative mx-auto w-full max-w-[1180px]">
        <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="font-[Manrope] text-xs font-semibold text-[#005136]">Galeri lapangan</p>
            <h2 id="venue-gallery-heading" className="mt-4 font-[Archivo] text-4xl font-extrabold leading-[1.15] tracking-[-0.02em] text-[#1A1F4D] sm:text-[40px]">
              Galeri Lapangan Mini Soccer Klaten
            </h2>
            <p className="mt-5 max-w-2xl font-[Manrope] text-base leading-8 text-[rgba(26,31,77,0.62)] sm:text-lg">
              Foto lapangan Klaten Minisoccer: rumput premium 5v5, lampu malam, ruang ganti. Cocok untuk sewa lapangan Klaten, futsal, komunitas.
            </p>
          </div>

          <div className="inline-flex max-w-full flex-wrap items-center gap-3 self-start rounded-full border border-[rgba(0,81,54,0.16)] bg-[#FFFFFF] px-5 py-3 font-[Manrope] text-sm text-[rgba(26,31,77,0.62)] shadow-[0_4px_16px_rgba(26,31,77,0.08)] lg:self-auto" title={PRICE_DISCOUNT_NOTE}>
            <span className="font-semibold text-[#1A1F4D]">Harga sewa</span>
            <span className="rounded-full bg-[#C9D651] px-3 py-2 text-xs font-semibold text-[#005136]">{PRICE_RANGE_SHORT} / jam</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-5xl px-4 pb-6 sm:px-6">
          <div className="pointer-events-none absolute inset-x-0 bottom-16 mx-auto h-24 max-w-2xl rounded-[100%] bg-slate-100 blur-3xl" />
          <div
            className="coverflow relative mx-auto w-full"
            role="group"
            aria-label="Galeri lapangan Klaten"
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
              className="nav-btn border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-100"
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
              className="nav-btn border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-100"
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
