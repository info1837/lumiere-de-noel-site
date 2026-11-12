import { notFound } from "next/navigation";
import { ServiceJsonLd, BreadcrumbJsonLd } from "@/components/jsonld";
import AppDemo from "@/components/AppDemo";
import {
  HeroPage, BandePhotos, CeQuiEstCompris, AvantApres, Parcours, FaqCourte,
  Reservation, PucesVilles, SectionAmbiances, LienVieuxMontreal, MARINE_PROFOND,
} from "@/components/sections";
import { services, findService, serviceArea, serviceOptions } from "@/components/data";
import { MONTAGES } from "@/lib/hero-media";

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
//      la démo de l'application.
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
  // Page commerciale : le hero vidéo du Vieux-Montréal (lib/hero-media.js),
  // et la ligne de positionnement, une seule fois, vers /secteur/vieux-montreal.
  const commercial = s.slug === "lumieres-de-noel-commercial";

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
        montage={commercial ? MONTAGES.vieuxMontreal : false}
      />

      {s.ambiances && <SectionAmbiances />}

      <BandePhotos cles={s.bande || []} />

      {commercial && (
        <LienVieuxMontreal
          tag="Fier partenaire des commerces du Vieux-Montréal"
          phrase="Hôtels, restaurants et boutiques du Vieux-Montréal nous confient leurs entrées et leurs vitrines pour les Fêtes."
        />
      )}

      <CeQuiEstCompris compris={s.compris} cadre={s.cadre} />

      <AvantApres cle={s.paire} />

      {s.appDemo && <AppDemo />}

      <Parcours />

      <FaqCourte items={s.faq} titre={`Vos questions — ${s.seoTitle || s.title}`} />

      <PucesVilles service={s} titre="Dans votre ville" fond={MARINE_PROFOND} />

      <Reservation source={`Page service — ${s.title}`} redirectSrc="service" serviceInitial={serviceInitial} />
    </>
  );
}
