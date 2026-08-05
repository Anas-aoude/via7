import type { Metadata } from "next";
import { headers } from "next/headers";
import {
  Geist,
  Geist_Mono,
  Noto_Sans_Arabic,
} from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

import Navbar from "./components/navbar/Navbar";
import ClientOnly from "./components/ClinetOnly";
import RegisterModal from "./components/models/RegisterModal";
import LoginModal from "./components/models/LoginModal";
import ToasterProvider from "./providers/toasterProvider";
import RentModal from "./components/models/RentModal";
import LanguageProvider from "./providers/LanguageProvider";
import { Language } from "./context/LanguageContext";
import ForgotPasswordModal from "./components/models/ForgotPasswordModal";
import Footer from "./components/footer/Footer";
import CurrencyProvider from "./providers/CurrencyProvider";
import { siteConfig } from "@/app/libs/seo";

import "leaflet/dist/leaflet.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  display: "swap",
});

const siteUrl = siteConfig.url;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "VIA7 | سوق العقارات في سوريا",
    template: "%s | VIA7",
  },

  description:
    "VIA7 هو سوق عقارات حديث للإيجار والبيع واكتشاف العقارات في جميع أنحاء سوريا.",

  keywords: [
    "VIA7",
    "VIA7 Syria",
    "عقارات سوريا",
    "عقارات دمشق",
    "عقارات حلب",
    "شراء عقار في سوريا",
    "إيجار عقارات في سوريا",
    "real estate Syria",
    "Syria properties",
    "Damascus real estate",
    "Aleppo real estate",
    "Immobilien Syrien",
    "Immobilien Damaskus",
  ],

  applicationName: "VIA7",
  generator: "Next.js",
  authors: [{ name: "VIA7" }],
  creator: "VIA7",
  publisher: "VIA7",



  manifest: "/site.webmanifest",

  icons: {
    icon: [
      { url: "/favicon-32x32.png" },
      {
        url: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: ["/favicon-32x32.png"],
  },

  openGraph: {
    title: "VIA7 | سوق العقارات في سوريا",
    description: "اكتشف أفضل العقارات للبيع والإيجار في سوريا عبر VIA7.",
    url: "/ar",
    siteName: "VIA7",
    type: "website",
    locale: "ar_SY",
    alternateLocale: ["en_US", "de_DE"],
    images: [
      {
        url: "/logo1.png",
        width: 1200,
        height: 630,
        alt: "VIA7 - Real Estate Marketplace in Syria",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "VIA7 | Real Estate Marketplace in Syria",
    description: "Discover properties for rent and sale across Syria with VIA7.",
    images: ["/logo1.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  category: "real estate",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers();
  const headerLanguage = headerStore.get("x-locale");

  const isValidLanguage =
    headerLanguage === "ar" ||
    headerLanguage === "en" ||
    headerLanguage === "de";

  const initialLanguage: Language = isValidLanguage
    ? (headerLanguage as Language)
    : "ar";

  return (
    <html
      lang={initialLanguage}
      dir={initialLanguage === "ar" ? "ltr" : "ltr"}
    >
      <body
        className={`
    ${geistSans.variable}
    ${geistMono.variable}
    ${notoArabic.variable}
    antialiased
  `}
      >
        <LanguageProvider initialLanguage={initialLanguage}>
          <CurrencyProvider>
            <Suspense fallback={null}>
              <Navbar />
            </Suspense>

            <main className="min-h-screen">
              {children}
            </main>

            <Footer />

            <ClientOnly>
              <ToasterProvider />
              <RegisterModal />
              <LoginModal />
              <ForgotPasswordModal />
              <RentModal />
            </ClientOnly>
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}