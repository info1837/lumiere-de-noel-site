import "./globals.css";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { NavBar, MobileBottomBar } from "./ClientLayout";
import BandeauRarete from "@/components/BandeauRarete";
import { lireDisponibilites, messageRarete } from "@/lib/disponibilites";
import { ServerFooter } from "./ServerFooter";
import TelemetryClient from "./TelemetryClient";
import FestiveLayer from "@/components/FestiveLayer";
import { company, serviceArea, services } from "@/components/data";
import { aggregateRating, sameAs } from "@/components/reviews";
import { PHOTOS } from "@/components/photos";

// Meta Pixel piloté par variable d'environnement. Absent = pixel inactif.
// Voir .env.example — NEXT_PUBLIC_META_PIXEL_ID.
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
const PIXEL_ENABLED = Boolean(META_PIXEL_ID);

const BASE = company.baseUrl;

// Une seule écriture de l'URL des polices : elle apparaît trois fois dans
// le <head> (preload, feuille différée, repli sans JavaScript), et trois
// copies finiraient par diverger d'une graisse.
const POLICES =
  "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Nunito+Sans:wght@400;500;600;700&display=swap";

export const metadata = {
  metadataBase: new URL(BASE),
  // SEO P0 §5.1 — le titre faisait 111 caractères et la description 200 :
  // Google coupait les deux. `keywords` est retiré (ignoré depuis 2009, et
  // il annonçait Brossard sur les pages de Laval).
  title: {
    default: "Installation de lumières de Noël | Solution Lumière de Noël",
    template: `%s | ${company.titleSuffix}`,
  },
  description:
    "Pose, entretien et retrait inclus — projets à partir de 1 000 $. Résidentiel et commercial sur la Rive-Nord, à Montréal et sur la Rive-Sud. Un nombre limité de propriétés chaque saison.",
  authors: [{ name: company.name }],
  alternates: { canonical: "/", languages: { "fr-CA": "/" } },
  openGraph: {
    type: "website",
    url: "/",
    siteName: company.name,
    title: "Installation de lumières de Noël | Solution Lumière de Noël",
    description:
      "Pose, entretien et retrait inclus — projets à partir de 1 000 $. Résidentiel et commercial sur la Rive-Nord, à Montréal et sur la Rive-Sud. Un nombre limité de propriétés chaque saison.",
    images: [PHOTOS["blainville-01"].src],
    locale: "fr_CA",
  },
  twitter: {
    card: "summary_large_image",
    title: "Installation de lumières de Noël | Solution Lumière de Noël",
    description: "Pose, entretien et retrait inclus — projets à partir de 1 000 $. Rive-Nord, Montréal et Rive-Sud. Un nombre limité de propriétés chaque saison.",
    images: [PHOTOS["blainville-01"].src],
  },
  // L'ancien /favicon.svg reste volontairement retiré : un favicon SVG a
  // priorité sur le .ico dans les navigateurs modernes, il aurait donc
  // continué d'afficher l'ANCIEN logo par-dessus le nouveau kit.
  //
  // DEUX DESSINS SELON LA TAILLE, ET C'EST VOULU.
  // Le carré du kit place la marque sur 31 % de la largeur du canevas : à 16px,
  // le dessin réel ne fait plus que ~5px, l'ampoule (traits de 6,5 unités) se
  // dissout en gris et le S devient illisible. Mesuré, pas supposé.
  //   ≤48px  (onglet, favoris)      → le S doré seul, à 74 % du carré
  //   ≥180px (iOS, Android, PWA)    → la marque complète, à 86 % du carré
  // Le .ico contient trois rendus INDÉPENDANTS (16/32/48) issus du SVG, pas un
  // agrandissement du 16 : Pillow ignore silencieusement append_images pour ce
  // format et n'écrivait qu'une seule taille. Le conteneur est écrit à la main.
  // Sources : kitlogosolutionlumieredenoel/svg/favicon-petit.svg et -grand.svg.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/favicon-180.png",
  },
  other: {
    "theme-color": "#0B1B2B",
    "geo.region": "CA-QC",
    "geo.placename": "Grand Montréal, Québec",
    "geo.position": "45.6722;-73.8736",
    ICBM: "45.6722, -73.8736",
  },
};

export default async function RootLayout({ children }) {
  // ⚠️ Le layout lit les disponibilités UNE fois et marque le <body>.
  //
  // C'est ce marqueur qui décale l'en-tête flottant de la hauteur du
  // bandeau. Sans lui, la pilule reste collée en haut et RECOUVRE le
  // bandeau dès qu'on défile — c'est ce que Yahir a vu sur /calculatrice.
  //
  // Et quand le CRM se tait, la classe n'est pas posée : aucun décalage,
  // aucun espace vide en haut de page.
  const rarete = messageRarete(await lireDisponibilites());
  return (
    <html lang="fr">
      <head>
        {/* ⚠️ LES POLICES NE BLOQUENT PLUS LE RENDU.
            Un <link rel="stylesheet"> est bloquant par construction : le
            navigateur ne peint rien tant qu'il n'a pas la feuille. Mesuré
            par Lighthouse mobile sur l'accueil : 1 374 ms de rendu bloqué,
            à lui seul.

            Le motif ci-dessous est le classique « media=print puis onload » :
            une feuille dont le media ne correspond pas est téléchargée
            SANS bloquer, et on la bascule sur `all` dès qu'elle est là. Le
            `preload` lance le téléchargement tôt pour que la bascule arrive
            vite, et le <noscript> garde les polices pour qui coupe le
            JavaScript.

            `display=swap` était déjà là : le texte s'affiche en police de
            secours puis bascule, au lieu de rester invisible. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" as="style" href={POLICES} />
        <link rel="stylesheet" href={POLICES} media="print" data-polices="" />
        <noscript><link rel="stylesheet" href={POLICES} /></noscript>
        <script
          dangerouslySetInnerHTML={{
            __html: "(function(){var l=document.querySelector('link[data-polices]');"
              + "if(!l)return;function go(){l.media='all';}"
              + "if(l.sheet)go();else l.addEventListener('load',go);})();",
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
              "@id": `${BASE}/#business`,
              name: company.name,
              image: `${BASE}${PHOTOS["blainville-01"].src}`,
              logo: `${BASE}/favicon-512.png`,
              url: `${BASE}/`,
              telephone: company.phoneHref ? company.phoneHref.replace("tel:", "") : undefined,
              email: company.email,
              priceRange: "$$",
              description:
                "Installation clé en main de lumières de Noël et d'éclairage architectural permanent au Québec — résidentiel et commercial.",
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
      <body className={rarete ? "avec-bandeau" : undefined}>
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

        {/* Le bandeau AU-DESSUS de l'entête : c'est le premier chiffre que
            le visiteur lit, et il ne doit pas disparaître au défilement
            comme le ferait un élément de la nav. Il rend null quand le CRM
            ne répond pas — aucun espace réservé, aucun squelette. */}
        <BandeauRarete rarete={rarete} />
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
