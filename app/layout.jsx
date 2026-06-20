import "./globals.css";
import Script from "next/script";
import { NavBar } from "./ClientLayout";
import { ServerFooter } from "./ServerFooter";
import FestiveLayer from "@/components/FestiveLayer";
import { company, serviceArea } from "@/components/data";

// TODO: remplacer par le vrai Meta Pixel ID, sinon laisser tel quel (inactif).
const META_PIXEL_ID = "YOUR_PIXEL_ID";
const PIXEL_ENABLED = META_PIXEL_ID !== "YOUR_PIXEL_ID";

const BASE = company.baseUrl;

export const metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: "Lumière de Noël inc. | Installation de lumières de Noël & éclairage architectural — Québec",
    template: "%s | Lumière de Noël inc.",
  },
  description:
    "Installation clé en main de lumières de Noël et d'éclairage architectural permanent au Québec — résidentiel, commercial et municipal. Soumission gratuite. Service du Grand Montréal à l'Estrie.",
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
  other: { "theme-color": "#0B1B2B" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: company.name,
              image: `${BASE}/images/hero-accueil.jpg`,
              "@id": `${BASE}/`,
              url: `${BASE}/`,
              telephone: "+14388656873",
              email: company.email,
              priceRange: "$$",
              address: {
                "@type": "PostalAddress",
                addressRegion: "QC",
                addressCountry: "CA",
              },
              areaServed: serviceArea.map((c) => ({ "@type": "City", name: c })),
              // sameAs omis volontairement : aucun réseau social pour l'instant.
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
      </body>
    </html>
  );
}
