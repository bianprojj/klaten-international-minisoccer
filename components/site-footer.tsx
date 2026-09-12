export function SiteFooter() {
  return (
    <footer className="border-t border-[color:var(--border-strong)] navbar-shell">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <div className="space-y-4 text-sm text-[color:var(--muted)]">
          <p className="font-semibold text-[color:var(--foreground)]">Klaten Minisoccer</p>
          <p>Booking lapangan mini soccer di Klaten. Pesan online, harga transparan, jadwal fleksibel.</p>
          <address className="not-italic">
            Klaten, Jawa Tengah, Indonesia<br />
            Telp: <a href="tel:+6281234567890" className="text-[color:var(--accent)]">+62 812 3456 7890</a><br />
            Email: <a href="mailto:hello@klatenminisoccer.web.id" className="text-[color:var(--accent)]">hello@klatenminisoccer.web.id</a>
          </address>
          <p>Follow us on:</p>
          <div className="flex flex-wrap gap-3 text-[color:var(--muted)]">
            <a href="https://instagram.com/" rel="me noopener" className="transition hover:text-[color:var(--accent)]">Instagram</a>
            <a href="https://wa.me/6281234567890" rel="me noopener" className="transition hover:text-[color:var(--accent)]">WhatsApp</a>
            <a href="https://tiktok.com/" rel="me noopener" className="transition hover:text-[color:var(--accent)]">TikTok</a>
          </div>
        </div>

        <div className="grid gap-4 text-sm text-[color:var(--muted)] sm:grid-cols-2">
          <nav aria-label="Footer">
          <div>
            <p className="mb-3 font-semibold text-[color:var(--foreground)]">Quick links</p>
            <ul className="space-y-2">
              <li><a href="/fields" className="transition hover:text-[color:var(--accent)]">Lapangan Mini Soccer Klaten</a></li>
              <li><a href="/book" className="transition hover:text-[color:var(--accent)]">Booking Lapangan Klaten</a></li>
              <li><a href="/booking-history" className="transition hover:text-[color:var(--accent)]">Riwayat Booking</a></li>
            </ul>
          </div>
          </nav>
          <div>
            <p className="mb-3 font-semibold text-[color:var(--foreground)]">Support</p>
            <ul className="space-y-2">
              <li>Contact: +62 812 3456 7890</li>
              <li>Email: <a href="mailto:hello@klatenminisoccer.web.id" className="text-[color:var(--accent)]">hello@klatenminisoccer.web.id</a></li>
              <li>Office: Klaten, Jawa Tengah, Indonesia</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
