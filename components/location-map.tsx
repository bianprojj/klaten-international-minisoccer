"use client";

import { useEffect, useRef, useState } from "react";

export function LocationMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full">
      <div ref={containerRef} className="h-[280px] w-full overflow-hidden rounded-[20px] border border-[rgba(0,81,54,0.16)] bg-[#FFFFFF] shadow-[0_4px_16px_rgba(26,31,77,0.08)] sm:h-[360px] lg:h-[400px]">
        {isVisible ? (
          <iframe
            title="Peta lokasi Klaten Minisoccer Karanganom Klaten Utara"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14107.132781442164!2d110.61014728467454!3d-7.6848874319996705!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a418c77c195ff%3A0xbc8f5e57b5a60649!2sKlaten%20International%20Minisoccer!5e0!3m2!1sid!2sid!4v1789349897571!5m2!1sid!2sid"
            className="h-full w-full border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.18),transparent_45%),linear-gradient(135deg,rgba(15,23,42,0.08),rgba(15,23,42,0.02))] text-sm text-[color:var(--muted)]">
            Memuat peta lokasi…
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-col gap-3 rounded-[20px] border border-[rgba(0,81,54,0.16)] bg-[#FFFFFF] p-6 shadow-[0_4px_16px_rgba(26,31,77,0.08)] sm:flex-row sm:items-center sm:justify-between">
        <div className="font-[Manrope] text-sm leading-6">
          <p className="font-[Archivo] font-bold text-[#1A1F4D]">Klaten International Minisoccer</p>
          <p className="text-[rgba(26,31,77,0.62)]">Jl. Desa Karanganom, Karanganom, Klaten Utara, Klaten</p>
          <p className="text-[rgba(26,31,77,0.62)]">Setiap hari 06.00–23.00 WIB</p>
        </div>
        <a href="https://www.google.com/maps/dir/?api=1&destination=Klaten%20International%20Minisoccer%2C%20Karanganom%2C%20Klaten%20Utara" target="_blank" rel="noopener" className="btn-primary shrink-0 text-center">Get Directions</a>
      </div>
    </div>
  );
}
