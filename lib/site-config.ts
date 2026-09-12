export const siteConfig = {
  name: "Klaten Minisoccer",
  title: "Klaten Minisoccer | Booking Lapangan Mini Soccer di Klaten",
  description:
    "Pesan lapangan mini soccer di Klaten dengan booking online, harga transparan, fasilitas lengkap, dan jadwal per jam yang fleksibel.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://klatenminisoccer.web.id",
  locale: "id_ID",
  keywords: [
    "booking lapangan mini soccer",
    "lapangan mini soccer Klaten",
    "futsal Klaten",
    "pesan lapangan online",
    "klaten international minisoccer",
  ],
  openGraphImage: "/kim-logo.svg",
  navItems: [
    { href: "/", label: "Home" },
    { href: "/book", label: "Booking" },
    { href: "/booking-history", label: "History" },
  ],
};
