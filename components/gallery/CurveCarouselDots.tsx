"use client";

interface CurveCarouselDotsProps {
  activeIndex: number;
  count: number;
  onSelect: (index: number) => void;
}

export function CurveCarouselDots({ activeIndex, count, onSelect }: CurveCarouselDotsProps) {
  return (
    <div className="flex max-w-full flex-wrap items-center justify-center gap-3 rounded-[2rem] border border-white/10 bg-white/5 px-4 py-3 text-center shadow-[0_18px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl">
      {Array.from({ length: count }).map((_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSelect(index)}
          className={`h-3.5 w-3.5 rounded-full transition ${index === activeIndex ? "bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" : "bg-white/25 hover:bg-white/40"}`}
          aria-label={`Tampilkan slide ${index + 1}`}
          aria-current={index === activeIndex ? "true" : "false"}
        />
      ))}
    </div>
  );
}
