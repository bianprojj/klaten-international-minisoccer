import type { Metadata, Viewport } from "next";
import { Archivo, Manrope } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/lib/site-config";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], weight: ["700", "800", "900"], variable: "--font-heading", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body", display: "swap" });

export const viewport: Viewport = { themeColor: "#005136", width: "device-width", initialScale: 1 };

export async function generateMetadata(): Promise<Metadata> {
  return {
  metadataBase: new URL(siteConfig.url),
  alternates: { canonical: siteConfig.url },
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  formatDetection: { email: false, address: false, telephone: false },
  manifest: "/site.webmanifest",
  robots: { index: true, follow: true },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
    images: [{ url: siteConfig.openGraphImage, width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.openGraphImage],
  },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`h-full antialiased ${archivo.variable} ${manrope.variable}`}
    >
      <head>
        <meta name="google-site-verification" content="BsXuXOKxwt6fAebllkzGcfGD91W6OLjAY9YHcVoIYvw" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-S9EYH0K5Z9"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-S9EYH0K5Z9');
            `,
          }}
        />
        <link rel="preconnect" href="https://www.openstreetmap.org" />
        <link rel="dns-prefetch" href="https://www.openstreetmap.org" />
        {/* Schema.org Structured Data: LocalBusiness + SportsActivityLocation */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["SportsActivityLocation", "LocalBusiness"],
              "name": siteConfig.name,
              "description": siteConfig.description,
              "url": siteConfig.url,
              "telephone": siteConfig.phone,
              "email": siteConfig.email,
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Jl. Desa Karanganom, Karanganom",
                "addressLocality": "Klaten Utara",
                "addressRegion": "Klaten",
                "postalCode": "57462",
                "addressCountry": "ID"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": "-7.684887",
                "longitude": "110.610147"
              },
              "openingHoursSpecification": [
                {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday"
                  ],
                  "opens": "06:00",
                  "closes": "23:00"
                }
              ],
              "priceRange": "Rp 214.000 - Rp 750.000",
              "areaServed": {
                "@type": "GeoCircle",
                "geoMidpoint": {
                  "@type": "GeoCoordinates",
                  "latitude": "-7.684887",
                  "longitude": "110.610147"
                },
                "geoRadius": "20000"
              },
              "makesOffer": {
                "@type": "Offer",
                "name": "Sewa Lapangan Mini Soccer",
                "price": "214000",
                "priceCurrency": "IDR",
                "availability": "https://schema.org/InStock",
                "url": `${siteConfig.url}/book`
              },
              "image": [
                siteConfig.openGraphImage,
                `${siteConfig.url}/android-chrome-512x512.png`
              ],
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": "50",
                "bestRating": "5",
                "worstRating": "1"
              },
              "sameAs": [
                "https://www.instagram.com/kim.soccerfield/",
                "https://www.facebook.com/klatenminisoccer",
                "https://wa.me/6285774440016"
              ]
            })
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-[color:var(--background)] text-[color:var(--foreground)]">
        <script src="/theme-init.js" defer></script>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:px-4 focus:py-2 focus:bg-white">Lewati ke konten</a>
        <SiteHeader />
        <div id="main-content" className="flex-1">{children}</div>
        <SiteFooter />
        <SpeedInsights />
      </body>
    </html>
  );
}
