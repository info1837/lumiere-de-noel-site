import { CTAButton, SectionTag, SectionTitle, Gallery } from "@/components/ui";
import { BreadcrumbJsonLd, VideoObjectJsonLd } from "@/components/jsonld";
import VideoParlee from "@/components/VideoParlee";
import LienTelephone from "@/components/LienTelephone";
import { HeroPage, CeQuiEstCompris, FaqCourte, Reservation, MARINE, MARINE_PROFOND } from "@/components/sections";
import { GALERIE_VIEUX_MONTREAL } from "@/components/vieux-montreal";
import { CAS_VIEUX_MONTREAL } from "@/components/medias-2026";
import { PHOTOS } from "@/components/photos";
import GaleriePhotos from "@/components/GaleriePhotos";
import { company } from "@/components/data";
import { MONTAGES } from "@/lib/hero-media";

// =============================================================================
// /secteur/vieux-montreal — les commerces du Vieux-Montréal (2026-11-12)
// =============================================================================
// Une page de secteur à part : pas une entrée de `cities` (pas de matrice
// ville × service, pas de pastille de ville), parce qu'elle ne parle qu'aux
// commerces. Même système que les autres pages : HeroPage, l'offre avec le
// cadre « ampoule », la galerie, la FAQ (JSON-LD FAQPage) et le fil d'Ariane
// (JSON-LD BreadcrumbList), comme /secteur/<ville>.
//
// VITRINE COMMERCIALE (2026-11-24, demande de Yahir) : trois études de cas
// NOMMÉES — Kyo, Modavie, Hôtel Place d'Armes et Brasserie 701
// (components/medias-2026.js → CAS_VIEUX_MONTREAL). Chaque cas ne décrit
// que ce qui se voit sur les images : aucune citation, aucun chiffre,
// aucune date. Pas de prix (sur soumission), aucune assurance.
// JSON-LD : LocalBusiness (le même @id que le layout) + Service + une
// ImageObject par image des études de cas.
// =============================================================================

const SOUMISSION = "/soumission?service=commercial";

// La vidéo promo (2026-11-13) : 30,7 s, 1280×720, AVEC le son (musique
// originale sous licence, piste AAC copiée telle quelle, jamais réencodée).
// Lancée par le visiteur seulement (VideoParlee paysage) : affiche + bouton,
// rien de téléchargé avant le clic, contrôles natifs ensuite, pas de boucle.
const PROMO = {
  src: "/videos/vieux-montreal-promo.mp4",
  affiche: "/videos/vieux-montreal-promo.jpg",
  titre: "Le Vieux-Montréal illuminé pour les Fêtes",
  description:
    "Une soirée dans les rues du Vieux-Montréal : entrées, vitrines et façades de pierre décorées de guirlandes et de mini-lumières blanc chaud par Solution Lumière de Noël.",
  duree: "PT31S",
  mise_en_ligne: "2026-11-13",
};
const TITRE = "Décoration des Fêtes pour les commerces du Vieux-Montréal";
const DESCRIPTION =
  "Décors des Fêtes du Kyo, du Modavie et de l'Hôtel Place d'Armes : guirlandes, mini-lumières et jardinières pour les commerces du Vieux-Montréal.";
const BASE = company.baseUrl;
const IMAGES_CAS = CAS_VIEUX_MONTREAL.map((c) => ({ ...c, images: c.photos.map((k) => ({ cle: k, ...PHOTOS[k] })) }));

export const metadata = {
  // ≤ 60 caractères, suffixe compris (2026-11-23) : avec le gabarit
  // « … | Solution Lumière de Noël », le titre faisait 77 caractères et
  // Google le coupait. `absolute` : les 50 caractères qui comptent, comme
  // les pages ville × service. scripts/check-seo.mjs mesure tous les titres.
  title: { absolute: "Décoration des Fêtes — commerces du Vieux-Montréal" },
  description: DESCRIPTION,
  alternates: { canonical: "/secteur/vieux-montreal" },
  openGraph: {
    title: `${TITRE} | Solution Lumière de Noël inc.`,
    description: DESCRIPTION,
    url: "/secteur/vieux-montreal",
    images: [IMAGES_CAS[0].images[0].src],
  },
};

const COMPRIS = {
  texte:
    "On habille vos entrées, vos vitrines et vos fenêtres en arc. La pose se fait hors de vos heures d'ouverture, avec une nacelle au besoin, et on retire tout en janvier.",
  items: [
    "Mini-lumières blanc chaud",
    "Guirlandes et verdure aux entrées",
    "Rideaux de lumières en vitrine",
    "Jardinières illuminées",
  ],
  prix: "Sur soumission",
  prixNote: "prix ferme, écrit",
};

const FAQ = [
  { q: "Installez-vous en dehors de nos heures d'ouverture?", a: "Oui. La pose se planifie hors des heures d'ouverture, le soir ou tôt le matin, pour que votre clientèle ne voie que le résultat." },
  { q: "Les rues sont étroites et les façades hautes. Comment travaillez-vous?", a: "Avec une nacelle quand la hauteur l'exige, et l'accès se prévoit avant de venir. Le travail en hauteur est fait par notre propre équipe, avec harnais." },
  { q: "L'entretien est-il compris?", a: "Oui. Une lumière brûle ou une section tombe : un appel et on repasse sans frais pendant toute la saison." },
  { q: "Combien coûte un décor pour un commerce?", a: "C'est sur soumission : le prix dépend de la façade, de la hauteur et de l'envergure du décor. Il est confirmé par écrit après un court appel." },
  { q: "Qui retire le décor?", a: "Nous, en janvier. Le retrait fait partie du service." },
];

export default function VieuxMontreal() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", url: "/" },
          { name: "Zones desservies", url: "/secteur" },
          { name: "Vieux-Montréal", url: "/secteur/vieux-montreal" },
        ]}
      />

      <VideoObjectJsonLd
        name={PROMO.titre}
        description={PROMO.description}
        thumbnail={PROMO.affiche}
        contentUrl={PROMO.src}
        duration={PROMO.duree}
        uploadDate={PROMO.mise_en_ligne}
        pageUrl="/secteur/vieux-montreal"
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
              "@id": `${BASE}/#business`,
              name: company.name,
              telephone: company.phoneHref.replace("tel:", ""),
              email: company.email,
              url: `${BASE}/`,
              areaServed: [{ "@type": "Place", name: "Vieux-Montréal" }, { "@type": "City", name: "Montréal" }],
            },
            {
              "@type": "Service",
              "@id": `${BASE}/secteur/vieux-montreal#service`,
              serviceType: "Décoration des Fêtes et installation de lumières de Noël commerciales",
              name: TITRE,
              description: DESCRIPTION,
              provider: { "@id": `${BASE}/#business` },
              areaServed: { "@type": "Place", name: "Vieux-Montréal" },
              url: `${BASE}/secteur/vieux-montreal`,
              offers: { "@type": "Offer", priceCurrency: "CAD", description: "Sur soumission, prix ferme écrit." },
              image: IMAGES_CAS.flatMap((c) => c.images.map((i) => `${BASE}${i.src}`)),
            },
            ...IMAGES_CAS.flatMap((c) => c.images.map((i) => ({
              "@type": "ImageObject",
              contentUrl: `${BASE}${i.src}`,
              url: `${BASE}${i.src}`,
              width: i.largeur,
              height: i.hauteur,
              caption: i.alt,
              contentLocation: { "@type": "Place", name: `${c.nom}, ${c.lieu}` },
              creator: { "@id": `${BASE}/#business` },
            }))),
          ],
        }) }}
      />

      <HeroPage
        kicker="Fier partenaire des commerces du Vieux-Montréal"
        titre={TITRE}
        phrase="Hôtels, restaurants et boutiques du Vieux-Montréal et du Vieux-Port : guirlandes, verdure et mini-lumières blanc chaud, posées hors de vos heures d'ouverture."
        filAriane={[{ name: "Accueil", href: "/" }, { name: "Secteurs", href: "/secteur" }, { name: "Vieux-Montréal" }]}
        montage={MONTAGES.vieuxMontreal}
        preuve={false}
        boutons={
          <>
            <CTAButton href={SOUMISSION} variant="creme">Demander une soumission</CTAButton>
            <CTAButton href="#installations" variant="outlineCreme">Voir nos installations</CTAButton>
          </>
        }
      />

      <section style={{ background: MARINE }} aria-labelledby="promo-titre">
        <div className="container">
          <div className="section-entete">
            <SectionTag dark>En vidéo</SectionTag>
            <SectionTitle light id="promo-titre" style={{ margin: "0 auto 14px" }}>Le Vieux-Montréal, illuminé</SectionTitle>
            <p className="section-phrase" style={{ margin: "0 auto" }}>
              Trente secondes dans les rues du Vieux-Montréal, entre les entrées et les
              vitrines que nous avons décorées. Montez le son.
            </p>
          </div>
          <div className="bloc-video-paysage">
            <VideoParlee paysage src={PROMO.src} affiche={PROMO.affiche} titre={PROMO.titre} />
          </div>
        </div>
      </section>

      {/* Libellé court : sur téléphone, le bouton partage la ligne avec l'ampoule. */}
      <CeQuiEstCompris
        compris={COMPRIS}
        tag="Ce qu'on installe"
        titre="Entrées, vitrines et façades de pierre"
        cadre="installateur-vieux-montreal"
        bouton={{ href: SOUMISSION, texte: "Réserver ma date" }}
      />

      <section id="installations" style={{ background: MARINE }} aria-labelledby="cas-titre">
        <div className="container">
          <div className="section-entete">
            <SectionTag dark>Études de cas — saison 2026</SectionTag>
            <SectionTitle light id="cas-titre" style={{ margin: "0 auto 14px" }}>Trois façades du Vieux-Montréal</SectionTitle>
            <p className="section-phrase" style={{ margin: "0 auto" }}>
              Ce qu&apos;on a installé cette saison, tel qu&apos;on le voit sur les images tournées sur place.
            </p>
          </div>
          {IMAGES_CAS.map((c) => (
            <article key={c.id} className="etude-cas" id={`cas-${c.id}`}>
              <header className="etude-cas__entete">
                <SectionTag dark>{c.lieu}</SectionTag>
                <h3>{c.nom}</h3>
                <p>{c.description}</p>
              </header>
              <GaleriePhotos photos={c.images} />
            </article>
          ))}
        </div>
      </section>

      <section style={{ background: MARINE_PROFOND }}>
        <div className="container">
          <div className="section-entete">
            <SectionTag dark>Ailleurs dans le Vieux-Montréal</SectionTag>
            <SectionTitle light style={{ margin: "0 auto 14px" }}>D&apos;autres entrées et vitrines</SectionTitle>
          </div>
          <Gallery items={GALERIE_VIEUX_MONTREAL} prechargees={0} />
        </div>
      </section>

      <FaqCourte items={FAQ} titre="Vos questions sur le Vieux-Montréal" tag="FAQ — Vieux-Montréal" />

      <section style={{ background: MARINE }}>
        <div className="container bloc-etroit">
          <SectionTag dark>Commerces du Vieux-Montréal</SectionTag>
          <SectionTitle light style={{ margin: "0 auto 16px" }}>Parlons de votre façade</SectionTitle>
          <p className="section-phrase" style={{ margin: "0 auto 28px" }}>
            Hôtel, restaurant ou boutique : appelez-nous ou remplissez le formulaire ci-dessous,
            et on prépare une soumission écrite pour votre vitrine. Les places de la saison sont limitées.
          </p>
          <p className="section-phrase" style={{ margin: "0 auto 22px", fontSize: 22 }}>
            <LienTelephone style={{ color: "#F0BA54", fontWeight: 700, textDecoration: "none" }} />
          </p>
          <CTAButton href="#reserver" variant="creme">Remplir le formulaire</CTAButton>
        </div>
      </section>

      <Reservation source="Page Vieux-Montréal — commerces" redirectSrc="ville" serviceInitial="Lumière de Noël (commercial / municipal)" titre="Soumission pour votre commerce" />
    </>
  );
}
