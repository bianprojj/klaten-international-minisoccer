"use client";

import Image from "next/image";
import type { VenueGalleryImage } from "@/types";

interface CurveCarouselItemProps {
  image: VenueGalleryImage;
  offset: number;
  isActive: boolean;
  onSelect: () => void;
}

export function CurveCarouselItem({ image, offset, isActive, onSelect }: CurveCarouselItemProps) {
  const a = Math.abs(offset);
  const cls = offset === 0 ? "cf-pos-0" : offset === 1 ? "cf-pos-1" : offset === 2 ? "cf-pos-2" : offset >= 3 ? "cf-pos-3" : offset === -1 ? "cf-pos-n1" : offset === -2 ? "cf-pos-n2" : offset <= -3 ? "cf-pos-n3" : "cf-hidden";
  const hidden = a > 3 || (typeof window !== "undefined" && window.innerWidth <= 860 && a > 2) || (typeof window !== "undefined" && window.innerWidth <= 480 && a > 1);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`cf-card ${cls}`}
      style={{
        transform: hidden ? "translate3d(0,0,-520px) scale(.4)" : offset === 0 ? "translate3d(0,0,140px) rotateY(0) scale(1)" : offset === 1 ? "translate3d(168px,0,-40px) rotateY(-42deg) scale(.86)" : offset === -1 ? "translate3d(-168px,0,-40px) rotateY(42deg) scale(.86)" : offset === 2 ? "translate3d(310px,0,-200px) rotateY(-46deg) scale(.7)" : offset === -2 ? "translate3d(-310px,0,-200px) rotateY(46deg) scale(.7)" : offset > 0 ? "translate3d(420px,0,-360px) rotateY(-48deg) scale(.56)" : "translate3d(-420px,0,-360px) rotateY(48deg) scale(.56)",
        opacity: hidden ? 0 : offset === 0 ? 1 : a === 1 ? 0.92 : a === 2 ? 0.55 : 0.22,
        zIndex: 50 - a * 10,
        boxShadow: isActive ? "0 40px 90px -30px rgba(45,212,191,0.35), 0 0 0 1px rgba(45,212,191,0.25)" : undefined,
      }} // ponytail: inline transforms, ceiling no CSS class map, upgrade when positions grow
      aria-label={`Tampilkan ${image.title}`}
    >
      <div className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 30% 20%, rgba(255,255,255,0.18), transparent 60%)" }} />
      <div className="relative h-full overflow-hidden" style={{ borderRadius: 22 }}>
        <Image
          src={image.imageUrl}
          alt={image.title}
          fill
          sizes="280px"
          className="object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute bottom-0 left-0 right-0" style={{ padding: "18px 18px 16px", background: "linear-gradient(to top, rgba(7,10,14,0.92), rgba(7,10,14,0.45) 55%, transparent)" }}>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/70">Venue</p>
          <h3 className="mt-1 text-[17px] font-semibold text-white" style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}>{image.title}</h3>
        </div>
      </div>
    </button>
  );
}
