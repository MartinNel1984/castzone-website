import type { Metadata } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${barlowCondensed.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-deep-water text-bone-white antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
