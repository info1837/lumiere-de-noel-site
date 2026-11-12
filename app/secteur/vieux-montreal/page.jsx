import { CTAButton, SectionTag, SectionTitle, Gallery } from "@/components/ui";
import { BreadcrumbJsonLd } from "@/components/jsonld";
import LienTelephone from "@/components/LienTelephone";
import { HeroPage, CeQuiEstCompris, FaqCourte, MARINE } from "@/components/sections";
import { GALERIE_VIEUX_MONTREAL } from "@/components/vieux-montreal";
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
// ⚠️ AUCUN NOM DE CLIENT. Ni dans le texte, ni dans les alt, ni dans le
// JSON-LD, ni dans les fichiers publics. Les clients : « hôtels,
// restaurants et boutiques du Vieux-Montréal », sans les compter. Pas de
// prix (sur soumission), pas de chiffre ni de témoignage inventés.
// =============================================================================

const SOUMISSION = "/soumission?service=commercial";
const TITRE = "Décoration des Fêtes pour les commerces du Vieux-Montréal";
const DESCRIPTION =
  "Décoration des Fêtes pour hôtels, restaurants et boutiques du Vieux-Montréal et du Vieux-Port : guirlandes, mini-lumières, jardinières. Sur soumission.";

export const metadata = {
  title: "Décoration des Fêtes — commerces du Vieux-Montréal",
  description: DESCRIPTION,
  alternates: { canonical: "/secteur/vieux-montreal" },
  openGraph: {
    title: `${TITRE} | Solution Lumière de Noël inc.`,
    description: DESCRIPTION,
    url: "/secteur/vieux-montreal",
    images: [GALERIE_VIEUX_MONTREAL[0].image],
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

      {/* Libellé court : sur téléphone, le bouton partage la ligne avec l'ampoule. */}
      <CeQuiEstCompris
        compris={COMPRIS}
        tag="Ce qu'on installe"
        titre="Entrées, vitrines et façades de pierre"
        cadre="installateur-vieux-montreal"
        bouton={{ href: SOUMISSION, texte: "Réserver ma date" }}
      />

      <section id="installations" style={{ background: MARINE }}>
        <div className="container">
          <div className="section-entete">
            <SectionTag dark>Nos installations</SectionTag>
            <SectionTitle light style={{ margin: "0 auto 14px" }}>Dans le Vieux-Montréal, cette saison</SectionTitle>
            <p className="section-phrase" style={{ margin: "0 auto" }}>
              Des rues pavées du Vieux-Montréal jusqu&apos;au Vieux-Port : quelques-unes
              des entrées et des vitrines que nous avons décorées.
            </p>
          </div>
          <Gallery items={GALERIE_VIEUX_MONTREAL} prechargees={0} />
        </div>
      </section>

      <FaqCourte items={FAQ} titre="Vos questions sur le Vieux-Montréal" tag="FAQ — Vieux-Montréal" />

      <section style={{ background: MARINE }}>
        <div className="container bloc-etroit">
          <SectionTag dark>Soumission</SectionTag>
          <SectionTitle light style={{ margin: "0 auto 16px" }}>Parlons de votre façade</SectionTitle>
          <p className="section-phrase" style={{ margin: "0 auto 28px" }}>
            Décrivez-nous votre commerce : on vous rappelle pour préparer une soumission écrite.
          </p>
          <CTAButton href={SOUMISSION} variant="creme">Demander une soumission</CTAButton>
          <p className="section-phrase" style={{ margin: "22px auto 0" }}>
            Vous préférez parler à quelqu&apos;un ? <LienTelephone style={{ color: "#F0BA54", fontWeight: 700, textDecoration: "none" }} />
          </p>
        </div>
      </section>
    </>
  );
}
