import { notFound } from "next/navigation";
import { BreadcrumbJsonLd, ServiceJsonLd } from "@/components/jsonld";
import {
  HeroPage, AProposVille, CeQuiEstCompris, Parcours, FaqCourte, Reservation, PucesVilles,
  MARINE_PROFOND,
} from "@/components/sections";
import { servicePhoto, heroVilleService, cadre } from "@/components/photos";
import {
  services, cities, findCity, findService, inCity, cleService, faqVilleService, serviceOptions,
} from "@/components/data";

// Génère les combinaisons service × ville en statique.
export function generateStaticParams() {
  const params = [];
  for (const c of cities) {
    for (const s of services) {
      params.push({ city: c.slug, service: s.slug });
    }
  }
  return params;
}

function metaVilleService(court, cityIn, phrase) {
  const p = phrase.charAt(0).toLowerCase() + phrase.slice(1);
  const d = `${court} ${cityIn} : ${p}`;
  return d.length <= 155 ? d : d.slice(0, 154).replace(/[\s,;:—-]+\S*$/, "") + "…";
}

export function generateMetadata({ params }) {
  const c = findCity(params.city);
  const s = findService(params.service);
  if (!c || !s) return {};
  const cityIn = inCity(c.name);
  // SEO P0 §5.1 — titre ≤ 60 c. suffixe compris : `seoTitle` est la forme
  // courte du service (« Lumières de Noël résidentielles »), sans le tiret
  // ni le mot « Lumières de Noël » répété deux fois dans la même phrase.
  const court = s.seoTitle || s.title;
  const title = `${court} ${cityIn}`;
  return {
    title: { absolute: title },
    // 2026-11-24 : la phrase locale de la ville pour CE service (parService),
    // donc une meta propre à chaque page — plus un gabarit où seul le nom change.
    description: metaVilleService(court, cityIn, c.parService[cleService(s.slug)]),
    alternates: { canonical: `/secteur/${c.slug}/${s.slug}` },
    openGraph: {
      title: `${title} | Solution Lumière de Noël`,
      description: `Lumières de Noël ${cityIn} — pose, entretien et retrait inclus. Un nombre limité de propriétés chaque saison.`,
      url: `/secteur/${c.slug}/${s.slug}`,
      images: [cadre(servicePhoto(s.slug, c.slug))?.src].filter(Boolean),
    },
  };
}

// =============================================================================
// LE GABARIT VILLE × SERVICE (partie 3)
// =============================================================================
// Le gabarit de service, appliqué à une ville : hero (photo GÉNÉRIQUE du
// service — la photo de la ville est dans « À propos » ; pour le résidentiel,
// la générique de CETTE ville, la même que sa carte sur /secteur/{ville} :
// six pages, six photos), ce qui est compris,
// « À propos de {ville} », le parcours, la FAQ (deux questions de la ville,
// une du service), les autres villes pour CE service, le formulaire.
// =============================================================================
export default function CityServicePage({ params }) {
  const c = findCity(params.city);
  const s = findService(params.service);
  if (!c || !s) return notFound();

  const faqs = faqVilleService(c, s);
  const cle = cleService(s.slug);
  const heroPhoto = heroVilleService(s.slug, c.slug);   // jamais la photo d'une autre ville
  const serviceInitial = serviceOptions.find((o) =>
    (cle === "commercial" ? /commercial/i : cle === "permanent" ? /permanent|architectural/i : /résidentiel|residentiel/i).test(o)) || null;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", url: "/" },
          { name: c.name, url: `/secteur/${c.slug}` },
          { name: s.title, url: `/secteur/${c.slug}/${s.slug}` },
        ]}
      />
      <ServiceJsonLd service={s} areaServed={[c.name]} urlPath={`/secteur/${c.slug}/${s.slug}`} />

      {/* Sans photo libre (permanent des villes ajoutées le 2026-11-24, règle
          des 8 pages) : le montage vidéo des pages de ville. */}
      <HeroPage
        photo={heroPhoto || undefined}
        montage={!heroPhoto}
        kicker={`${c.regionLabel} — ${c.name}`}
        titre={`${s.seoTitle || s.title} ${inCity(c.name)}`}
        phrase={c.parService[cle]}
        filAriane={[{ name: "Accueil", href: "/" }, { name: c.name, href: `/secteur/${c.slug}` }, { name: s.seoTitle || s.title }]}
      />

      <CeQuiEstCompris compris={s.compris} />

      <AProposVille ville={c} />

      <Parcours />

      <FaqCourte items={faqs} titre={`${s.seoTitle || s.title} ${inCity(c.name)}`} />

      {/* La démo de l'application reste sur la page du service : répétée sur
          six pages de ville, c'était 30 % de texte identique de l'une à
          l'autre (check-pages-locales). */}
      <PucesVilles service={s} court exclure={c.slug} titre={`${s.seoTitle || s.title}, ailleurs`} fond={MARINE_PROFOND} />

      <Reservation source={`Page ${s.title} — ${c.name}`} redirectSrc="ville-service" serviceInitial={serviceInitial} />
    </>
  );
}
