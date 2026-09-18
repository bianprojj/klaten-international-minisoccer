"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { siteConfig } from "@/lib/site-config";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/20 bg-[var(--glass-bg)] shadow-lg shadow-black/5 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1180px] flex-nowrap items-center justify-between gap-2 px-3 py-1.5 sm:px-4 lg:px-6">
        <div className="flex min-h-16 items-center md:min-h-20 min-w-0">
          <Link href="/" className="inline-flex items-center gap-3" aria-label={`Beranda ${siteConfig.name}`}>
            <Image src="/kim-logo.png" alt="Klaten International Minisoccer" width={72} height={72} priority className="h-14 w-14 object-contain md:h-16 md:w-16" />
            <span className="self-center bg-gradient-to-br from-[#005136] via-[#2c9e5f] to-[#C9D651] bg-clip-text text-sm font-black leading-tight text-transparent sm:text-base">
              KLATEN<br />
              INTERNATIONAL<br />
              MINISOCCER
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 text-sm md:flex" aria-label="Navigasi utama">
          {siteConfig.navItems.map((item) => (
            <Link key={item.href} href={item.href} className="font-[Manrope] text-sm font-medium text-[#1A1F4D] transition hover:text-[#005136]">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(0,81,54,0.16)] bg-white text-[#1A1F4D] transition hover:bg-[#F1EED9] md:hidden"
            aria-label="Buka menu navigasi"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((value) => !value)}
          >
            <span className="text-lg">{mobileOpen ? "✕" : "☰"}</span>
          </button>

          <Link href="/book" className="btn-primary hidden md:inline-flex md:px-3 md:py-1.5">
            Booking Lapangan
          </Link>
        </div>
      </div>

      {mobileOpen ? (
        <div id="mobile-nav" className="border-t border-[color:var(--border-strong)] px-4 py-4 shadow-none md:hidden navbar-shell">
          <div className="flex flex-col gap-3 text-sm text-[color:var(--foreground)]">
            {siteConfig.navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-2xl px-4 py-3 transition hover:bg-white/5"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/book" className="btn-primary block" onClick={() => setMobileOpen(false)}>
              Booking Lapangan
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
