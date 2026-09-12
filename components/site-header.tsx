"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { siteConfig } from "@/lib/site-config";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="navbar-shell sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl flex-nowrap items-center justify-between gap-2 px-3 py-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="inline-flex items-center gap-3 truncate max-w-[220px] md:max-w-none" aria-label={`Beranda ${siteConfig.name}`}>
            <Image src="/kim-logo.svg" alt={`${siteConfig.name} logo`} width={36} height={36} priority className="h-9 w-9 rounded-lg object-cover" />
            <span className="truncate text-base font-semibold text-[color:var(--foreground)] sm:text-lg">{siteConfig.name}</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-[color:var(--foreground)] md:flex" aria-label="Primary navigation">
          {siteConfig.navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-[color:var(--accent-strong)]">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border-strong)] bg-[color:rgba(15,23,42,0.04)] text-[color:var(--foreground)] transition hover:bg-[color:rgba(15,23,42,0.08)] md:hidden"
            aria-label="Buka menu navigasi"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((value) => !value)}
          >
            <span className="text-lg">{mobileOpen ? "✕" : "☰"}</span>
          </button>

          <Link href="/book" className="btn-primary hidden md:inline-flex md:px-3 md:py-1.5">
            Book a field
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
              Book a field
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
