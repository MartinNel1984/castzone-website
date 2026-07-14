import type { Metadata } from "next";
import { Newsreader, Manrope, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SignupNudge from "@/components/SignupNudge";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://castzone.co.za"),
  title: {
    default: "CastZone — Where South Africa Fishes",
    template: "%s · CastZone",
  },
  description:
    "South Africa's home for bass, saltwater, and specimen anglers. Share catches, find venues, buy and sell tackle.",
  keywords: "fishing, South Africa, bass fishing, saltwater fishing, carp, specimen, SA fishing forum",
  alternates: { canonical: "/" },
  other: { "google-adsense-account": "ca-pub-9454815992418505" },
  openGraph: {
    title: "CastZone — Where South Africa Fishes",
    description: "South Africa's modern fishing forum. Bass, saltwater, specimen and more.",
    url: "https://castzone.co.za",
    siteName: "CastZone",
    locale: "en_ZA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CastZone — Where South Africa Fishes",
    description: "South Africa's modern fishing forum. Bass, saltwater, specimen and more.",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://castzone.co.za/#organization",
      name: "CastZone",
      url: "https://castzone.co.za",
      logo: "https://castzone.co.za/icon",
      image: "https://castzone.co.za/opengraph-image",
      description:
        "South Africa's home for bass, saltwater, and specimen anglers. Share catches, find venues, buy and sell tackle.",
      sameAs: [
        "https://www.facebook.com/CastZoneFishing",
        "https://instagram.com/castzonefishing",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://castzone.co.za/#website",
      name: "CastZone",
      url: "https://castzone.co.za",
      inLanguage: "en-ZA",
      publisher: { "@id": "https://castzone.co.za/#organization" },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://castzone.co.za/search?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${newsreader.variable} ${manrope.variable} ${jetbrainsMono.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-deep-water text-bone-white antialiased">
        {/* Organization + WebSite structured data (schema.org JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <SignupNudge />
        {/* Cloudflare Web Analytics — privacy-first, no cookies */}
        <Script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "f63581216ddd43f3a172437006b33bc5"}'
          strategy="afterInteractive"
        />
        {/* Google AdSense — Auto Ads */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9454815992418505"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {/* Google Analytics (GA4) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-98JB2BMV96"
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-98JB2BMV96');
          `}
        </Script>
      </body>
    </html>
  );
}
