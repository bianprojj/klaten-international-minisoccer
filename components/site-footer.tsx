export function SiteFooter() {
  return (
    <footer className="w-full border-t border-white/20 bg-[rgba(0,81,54,0.75)] text-[#F1EED9] shadow-lg shadow-black/5 backdrop-blur-2xl">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-6 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <div className="space-y-4 text-sm font-[Manrope] text-[#F1EED9]">
          <p className="font-semibold text-[#FFFFFF]">Klaten Minisoccer</p>
          <p className="text-[#F1EED9]">Sewa lapangan mini soccer di Klaten, Karanganom Klaten Utara. Booking online, harga transparan, jadwal per jam.</p>
          <address className="not-italic text-[#F1EED9]">
            Klaten, Jawa Tengah, Indonesia<br />
            Telp: <a href="tel:+6281234567890" className="text-[#C9D651] hover:underline">+62 812 3456 7890</a><br />
            Email: <a href="mailto:hello@klatenminisoccer.web.id" className="text-[#C9D651] hover:underline">hello@klatenminisoccer.web.id</a>
          </address>
          <p className="text-[#F1EED9]/70 text-xs">Follow us on:</p>
          <div className="flex flex-wrap gap-3 text-[#F1EED9]">
            <a href="https://instagram.com/" rel="me noopener" className="transition hover:text-[#C9D651]">Instagram</a>
            <a href="https://wa.me/6281234567890" rel="me noopener" className="transition hover:text-[#C9D651]">WhatsApp</a>
            <a href="https://tiktok.com/" rel="me noopener" className="transition hover:text-[#C9D651]">TikTok</a>
          </div>
        </div>

        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <nav aria-label="Tautan footer">
          <div>
            <p className="mb-3 font-semibold text-[#FFFFFF]">Quick links</p>
            <ul className="space-y-2 text-[#F1EED9]">
              <li><a href="/book" className="transition hover:text-[#C9D651]">Booking Lapangan Klaten</a></li>
              <li><a href="/booking-history" className="transition hover:text-[#C9D651]">Riwayat Booking</a></li>
            </ul>
          </div>
          </nav>
          <div>
            <p className="mb-3 font-semibold text-[#FFFFFF]">Support</p>
            <ul className="space-y-2 text-[#F1EED9]">
              <li>Contact: +62 812 3456 7890</li>
              <li>Email: <a href="mailto:hello@klatenminisoccer.web.id" className="text-[#C9D651]">hello@klatenminisoccer.web.id</a></li>
              <li>Office: Klaten, Jawa Tengah, Indonesia</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-4 text-center text-xs text-[#F1EED9]/70">© 2026 Klaten International Minisoccer. All rights reserved.</div>
    </footer>
  );
}
