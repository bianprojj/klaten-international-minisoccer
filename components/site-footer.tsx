export function SiteFooter() {
  return (
    <footer className="w-full border-t border-white/20 bg-[rgba(0,81,54,0.75)] text-[#F1EED9] shadow-lg shadow-black/5 backdrop-blur-2xl">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-6 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <div className="space-y-4 text-sm font-[Manrope] text-[#F1EED9]">
          <p className="font-semibold text-[#FFFFFF]">Klaten International Minisoccer</p>
          <p className="text-[#F1EED9]">Sewa lapangan mini soccer di Klaten. Booking online, harga sekitar Rp 214.000 - 750.000, jadwal per jam 06.00–23.00 setiap hari.</p>
          <address className="not-italic text-[#F1EED9]">
            Jl. Desan Karanganom, Karanganom, Kec. Klaten Utara, Kabupaten Klaten, Jawa Tengah 57438<br />
            Telp: <a href="tel:+6285774440016" className="text-[#C9D651] hover:underline">+62 857 744 40016</a><br />
            Email: <a href="mailto:admin@dev.klatenminisoccer.web.id" className="text-[#C9D651] hover:underline">admin@dev.klatenminisoccer.web.id</a>
          </address>
          <p className="text-[#F1EED9]/70 text-xs">Follow us on:</p>
          <div className="flex flex-wrap gap-3 text-[#F1EED9]">
            <a href="https://www.instagram.com/kim.soccerfield/" rel="me noopener" className="transition hover:text-[#C9D651]">Instagram</a>
            <a href="https://wa.me/6285774440016" rel="me noopener" className="transition hover:text-[#C9D651]">WhatsApp</a>
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
              <li>Contact: +62 857 744 40016</li>
              <li>Email: <a href="mailto:admin@dev.klatenminisoccer.web.id" className="text-[#C9D651]">admin@dev.klatenminisoccer.web.id</a></li>
              <li>Office: Jl. Desan Karanganom, Karanganom, Kec. Klaten Utara, Kabupaten Klaten, Jawa Tengah 57438</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-4 text-center text-xs text-[#F1EED9]/70">© 2026 Klaten International Minisoccer. All rights reserved.</div>
    </footer>
  );
}
