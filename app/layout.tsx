import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/lib/site-config";
import { getSiteContent } from "@/lib/site-content";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  return {
  metadataBase: new URL(siteConfig.url),
  alternates: { canonical: siteConfig.url },
  title: {
    default: content.heroTitle || siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: content.heroSubtitle || siteConfig.description,
  keywords: siteConfig.keywords,
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "icon", type: "image/png", sizes: "32x32", url: "/favicon-32x32.png" },
    { rel: "icon", type: "image/png", sizes: "16x16", url: "/favicon-16x16.png" },
    { rel: "apple-touch-icon", sizes: "180x180", url: "/apple-touch-icon.png" },
    { rel: "icon", type: "image/png", sizes: "192x192", url: "/android-chrome-192x192.png" },
    { rel: "icon", type: "image/png", sizes: "512x512", url: "/android-chrome-512x512.png" },
  ],
  robots: { index: true, follow: true },
  openGraph: {
    title: content.heroTitle || siteConfig.title,
    description: content.heroSubtitle || siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
    images: [{ url: siteConfig.openGraphImage, width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: content.heroTitle || siteConfig.title,
    description: content.heroSubtitle || siteConfig.description,
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
      className="h-full antialiased"
    >
      <head>
        <meta name="google-site-verification" content="BsXuXOKxwt6fAebllkzGcfGD91W6OLjAY9YHcVoIYvw" />
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
