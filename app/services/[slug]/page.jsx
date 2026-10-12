import { notFound } from "next/navigation";
import { SectionTag, SectionTitle, CTAButton } from "@/components/ui";
import { ServiceJsonLd, BreadcrumbJsonLd } from "@/components/jsonld";
import AppDemo from "@/components/AppDemo";
import {
  HeroPage, BandePhotos, CeQuiEstCompris, AvantApres, Parcours, FaqCourte,
  Reservation, PucesVilles, SectionAmbiances, MARINE, MARINE_PROFOND,
} from "@/components/sections";
import { services, findService, serviceArea, serviceOptions } from "@/components/data";

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }) {
  const s = findService(params.slug);
  if (!s) return {};
  return {
    title: s.seoTitle || s.h1 || s.title,
    description: s.metaDescription,
    alternates: { canonical: `/services/${s.slug}` },
    openGraph: {
      title: `${s.seoTitle || s.h1 || s.title} | Solution Lumière de Noël`,
      description: s.metaDescription,
      url: `/services/${s.slug}`,
      images: s.heroImage ? [s.heroImage] : undefined,
    },
  };
}

// =============================================================================
// LE GABARIT DE SERVICE — résidentiel, commercial, permanent (partie 3)
// =============================================================================
// L'ordre, et rien d'autre :
//   1. hero — vraie photo, H1, une phrase, deux boutons
//   2. la bande de trois vraies photos du service
//   3. ce qui est compris (le bloc de l'offre de l'accueil)
//   4. le comparateur sur un vrai chantier — quand une VRAIE paire existe
//      pour ce service (le résidentiel). Le permanent montre à cette place
//      la démo de l'application ; le commercial, son assurance.
//   5. le parcours en cinq points
//   6. la FAQ, cinq questions au plus
//   7. une rangée de villes, puis le formulaire court
// La longue liste « Zones desservies » est partie : une rangée de pastilles
// porte les MÊMES liens ville × service.
// =============================================================================
export default function ServicePage({ params }) {
  const s = findService(params.slug);
  if (!s) return notFound();

  // Le formulaire arrive avec LE service de cette page déjà choisi. La
  // valeur sort de `serviceOptions`, jamais d'une chaîne écrite ici.
  const motCle = s.slug.includes("commercial") ? /commercial/i
    : s.slug.includes("permanent") ? /permanent|architectural/i
    : /résidentiel|residentiel/i;
  const serviceInitial = serviceOptions.find((o) => motCle.test(o)) || null;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", url: "/" },
          { name: "Services", url: "/services" },
          { name: s.title, url: `/services/${s.slug}` },
        ]}
      />
      <ServiceJsonLd service={s} areaServed={serviceArea} urlPath={`/services/${s.slug}`} />

      <HeroPage
        photo={{ src: s.heroImage, alt: s.heroImageAlt }}
        kicker={s.kicker}
        titre={s.h1 || s.title}
        phrase={s.intro}
        filAriane={[{ name: "Accueil", href: "/" }, { name: "Services", href: "/services" }, { name: s.title }]}
      />

      {s.ambiances && <SectionAmbiances />}

      <BandePhotos cles={s.bande || []} />

      <CeQuiEstCompris compris={s.compris} />

      <AvantApres cle={s.paire} />

      {s.appDemo && <AppDemo />}

      {/* ⚠️ L'ASSURANCE, SUR LA PAGE COMMERCIALE SEULEMENT.
          Pour un propriétaire, c'est une ligne rassurante parmi d'autres.
          Pour un gestionnaire d'immeuble, c'est un CRITÈRE D'ACHAT : il ne
          peut pas signer sans preuve, et s'il doit la demander par courriel
          il appelle d'abord le concurrent qui l'affiche.

          Pas de cinquième carte dans la grille résidentielle : décision de
          Yahir (2026-09-30). Un bloc dédié, ici, où la question se pose. */}
      {s.slug === "lumieres-de-noel-commercial" && (
        <section style={{ background: MARINE }}>
          <div className="container bloc-etroit">
            <SectionTag dark>Assurance</SectionTag>
            <SectionTitle light style={{ margin: "0 auto 16px" }}>
              Assurance responsabilité en vigueur, preuve fournie sur demande
            </SectionTitle>
            <p className="section-phrase" style={{ margin: "0 auto 28px" }}>
              Nos équipes travaillent en hauteur sur vos façades, vos marquises et vos
              vitrines. La police est active pour toute la saison, et nous transmettons
              l’attestation directement à votre gestionnaire ou à votre service des achats.
            </p>
            <CTAButton href="/soumission?service=commercial" variant="creme">
              Demander notre preuve d’assurance
            </CTAButton>
          </div>
        </section>
      )}

      <Parcours />

      <FaqCourte items={s.faq} titre={`Vos questions — ${s.seoTitle || s.title}`} />

      <PucesVilles service={s} titre="Dans votre ville" fond={MARINE_PROFOND} />

      <Reservation source={`Page service — ${s.title}`} redirectSrc="service" serviceInitial={serviceInitial} />
    </>
  );
}
