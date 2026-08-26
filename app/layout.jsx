import "./globals.css";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { NavBar, MobileBottomBar } from "./ClientLayout";
import { ServerFooter } from "./ServerFooter";
import TelemetryClient from "./TelemetryClient";
import FestiveLayer from "@/components/FestiveLayer";
import { company, serviceArea, services } from "@/components/data";
import { aggregateRating, sameAs } from "@/components/reviews";

// Meta Pixel piloté par variable d'environnement. Absent = pixel inactif.
// Voir .env.example — NEXT_PUBLIC_META_PIXEL_ID.
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
const PIXEL_ENABLED = Boolean(META_PIXEL_ID);

const BASE = company.baseUrl;

export const metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: "Lumière de Noël inc. | Installation de lumières de Noël & éclairage architectural — Québec",
    template: "%s | Lumière de Noël inc.",
  },
  description:
    "Installation clé en main de lumières de Noël et d'éclairage architectural permanent au Québec — résidentiel, commercial et municipal. Soumission gratuite. Service sur la Rive-Sud, à Montréal et sur la Rive-Nord.",
  keywords:
    "lumières de Noël, installation lumières de Noël, éclairage architectural, éclairage permanent DEL, décoration de Noël commerciale, Blainville, Terrebonne, Brossard, Montréal, Québec",
  authors: [{ name: company.name }],
  alternates: { canonical: "/", languages: { "fr-CA": "/" } },
  openGraph: {
    type: "website",
    url: "/",
    siteName: company.name,
    title: "Lumière de Noël inc. | Lumières de Noël & éclairage architectural au Québec",
    description:
      "On conçoit, installe, entretient et retire vos lumières de Noël. Éclairage architectural permanent disponible. Soumission gratuite.",
    images: ["/images/hero-accueil.jpg"],
    locale: "fr_CA",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lumière de Noël inc. | Lumières de Noël & éclairage architectural",
    description: "Installation clé en main de lumières de Noël et d'éclairage architectural permanent au Québec.",
    images: ["/images/hero-accueil.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    apple: "/apple-touch-icon.png",
  },
  other: {
    "theme-color": "#0B1B2B",
    "geo.region": "CA-QC",
    "geo.placename": "Grand Montréal, Québec",
    "geo.position": "45.6722;-73.8736",
    ICBM: "45.6722, -73.8736",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        {/* Polices : preconnect + stylesheet (remplace l'@import CSS bloquant) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Nunito+Sans:wght@400;500;600;700&display=swap"
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
              "@id": `${BASE}/#business`,
              name: company.name,
              image: `${BASE}/images/hero-accueil.jpg`,
              logo: `${BASE}/images/logo.png`,
              url: `${BASE}/`,
              telephone: company.phoneHref ? company.phoneHref.replace("tel:", "") : undefined,
              email: company.email,
              priceRange: "$$",
              description:
                "Installation clé en main de lumières de Noël et d'éclairage architectural permanent au Québec — résidentiel, commercial et municipal.",
              slogan: "Votre propriété, illuminée — sans le tracas.",
              knowsLanguage: ["fr-CA", "en"],
              currenciesAccepted: "CAD",
              paymentAccepted: "Comptant, Carte de crédit, Virement Interac",
              address: {
                "@type": "PostalAddress",
                addressRegion: "QC",
                addressCountry: "CA",
              },
              geo: { "@type": "GeoCoordinates", latitude: 45.6722, longitude: -73.8736 },
              areaServed: serviceArea.map((c) => ({ "@type": "City", name: c })),
              openingHoursSpecification: [
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                  opens: "08:00",
                  closes: "18:00",
                },
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: "Saturday",
                  opens: "09:00",
                  closes: "16:00",
                },
              ],
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "Services d'éclairage",
                itemListElement: services.map((s) => ({
                  "@type": "Offer",
                  itemOffered: { "@type": "Service", name: s.title, url: `${BASE}/services/${s.slug}` },
                })),
              },
              // aggregateRating + sameAs pilotés par components/reviews.js —
              // émis seulement quand de vrais avis existent (pas de faux signal Google).
              ...(aggregateRating ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: aggregateRating.value,
                  reviewCount: aggregateRating.count,
                },
              } : {}),
              ...(sameAs && sameAs.length ? { sameAs } : {}),
            }),
          }}
        />
      </head>
      <body>
        <a href="#contenu" className="skip-link">Aller au contenu</a>
        <FestiveLayer />

        {PIXEL_ENABLED && (
          <>
            <Script id="meta-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{
              __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`,
            }} />
            <noscript>
              <img height="1" width="1" style={{ display: "none" }} alt=""
                src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`} />
            </noscript>
          </>
        )}

        <NavBar />
        <main id="contenu">{children}</main>
        <ServerFooter />
        <MobileBottomBar />
        <TelemetryClient />
        <Analytics />
      </body>
    </html>
  );
}
