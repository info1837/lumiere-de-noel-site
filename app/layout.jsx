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
import { GOOGLE_ADS_ID } from "@/lib/google-ads";

// Meta Pixel piloté par variable d'environnement. Absent = pixel inactif.
// Voir .env.example — NEXT_PUBLIC_META_PIXEL_ID.
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
const PIXEL_ENABLED = Boolean(META_PIXEL_ID);

const BASE = company.baseUrl;

// ≤ 155 caractères : Google coupe au-delà, et la version d'avant (185)
// perdait justement la fin — « un nombre limité de propriétés ».
const DESCRIPTION =
  "Lumières de Noël posées, entretenues et retirées, à partir de 1 000 $. Rive-Nord, Montréal et Rive-Sud. Un nombre limité de propriétés chaque saison.";

// Les deux fichiers de police du premier écran (latin). Les sous-ensembles
// latin-ext ne se chargent que si une page en a besoin (unicode-range).
// Voir le haut de globals.css.
const POLICES = ["/fonts/bebas-latin.woff2", "/fonts/nunito-latin.woff2"];

export const metadata = {
  metadataBase: new URL(BASE),
  // SEO P0 §5.1 — le titre faisait 111 caractères et la description 200 :
  // Google coupait les deux. `keywords` est retiré (ignoré depuis 2009, et
  // il annonçait Brossard sur les pages de Laval).
  title: {
    default: "Installation de lumières de Noël | Solution Lumière de Noël",
    template: `%s | ${company.titleSuffix}`,
  },
  description: DESCRIPTION,
  authors: [{ name: company.name }],
  // ⚠️ PAS DE CANONICAL ICI. Le layout racine est hérité par TOUTES les
  // pages, y compris le 404 et /simulateur/photo : un `canonical: "/"`
  // posé ici leur faisait déclarer l'accueil comme version officielle.
  // Chaque page indexable déclare le sien ; celui de l'accueil vit dans
  // app/page.jsx.
  openGraph: {
    type: "website",
    url: "/",
    siteName: company.name,
    title: "Installation de lumières de Noël | Solution Lumière de Noël",
    description: DESCRIPTION,
    images: [PHOTOS["blainville-01"].src],
    locale: "fr_CA",
  },
  twitter: {
    card: "summary_large_image",
    title: "Installation de lumières de Noël | Solution Lumière de Noël",
    description: DESCRIPTION,
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
        {/* LES POLICES SONT SERVIES PAR LE SITE ET PRÉCHARGÉES.
            Avant : Google Fonts, en « media=print puis onload » pour ne pas
            bloquer le rendu — mais deux domaines tiers, une feuille à lire
            avant de connaître les fichiers, et une police qui arrivait tard
            (le titre de /concours sautait à l'échange). Maintenant les
            fichiers partent dès le HTML, du même domaine, et le repli
            calibré de globals.css garde la place pendant l'attente. */}
        {POLICES.map((href) => (
          <link key={href} rel="preload" as="font" type="font/woff2" href={href} crossOrigin="anonymous" />
        ))}

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
            {/* ⚠️ LE PIXEL EST DIFFÉRÉ, SANS PERDRE UN ÉVÉNEMENT.
                fbevents.js et sa configuration coûtaient ~1,6 s de thread
                principal sur un téléphone (Lighthouse mobile, accueil,
                2026-10-26) : la moitié du temps de blocage de la page, en
                plein chargement, quand le visiteur commence à défiler.

                Le « stub » officiel est posé tout de suite : `fbq` existe,
                les appels (init, PageView, Lead, CallClick) s'empilent dans
                sa file. Seul le TÉLÉCHARGEMENT de fbevents.js attend : la fin
                du chargement de la page, puis un moment libre (au plus
                ~3,5 s). La bibliothèque vide la file en arrivant : rien ne
                se perd. `window.__chargerPixel` le force tout de suite —
                trackLead() s'en sert avant une redirection (lib/meta-lead-event.js). */}
            <Script id="meta-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{
              __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];var c=!1;function go(){if(c)return;c=!0;t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}f.__chargerPixel=go;function tard(){setTimeout(function(){(f.requestIdleCallback||function(k){setTimeout(k,1)})(go,{timeout:2000})},1500)}if(b.readyState==='complete')tard();else f.addEventListener('load',tard)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`,
            }} />
            {/* ⚠️ L'<img> du repli SANS JavaScript est écrite en TEXTE.
                En JSX, React la voyait comme une image et ajoutait dans le
                <head> un `<link rel="preload" as="image">` vers
                facebook.com/tr?…&noscript=1 — que le navigateur
                téléchargeait AVEC JavaScript actif : une requête PageView
                en trop vers Meta, et le cookie tiers « fr » qui coûtait 21 points en
                Bonnes pratiques à toutes les pages (Lighthouse, 2026-10-26). */}
            <noscript dangerouslySetInnerHTML={{
              __html: `<img height="1" width="1" style="display:none" alt="" src="https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1" />`,
            }} />
          </>
        )}

        {/* Google Ads — UNE balise pour tout le site (lib/google-ads.js).
            Aucune bannière de témoins sur le site : pas de Mode de
            consentement pour l'instant (voir le haut de lib/google-ads.js).
            La conversion « Request quote » ne part que des formulaires,
            après la réponse du CRM — jamais d'ici. */}
        <Script id="google-ads-lib" strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`} />
        <Script id="google-ads" strategy="afterInteractive" dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${GOOGLE_ADS_ID}');`,
        }} />

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
