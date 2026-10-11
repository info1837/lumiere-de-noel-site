import { notFound } from "next/navigation";
import { BreadcrumbJsonLd, ServiceJsonLd } from "@/components/jsonld";
import {
  HeroPage, AProposVille, CeQuiEstCompris, Parcours, FaqCourte, Reservation, PucesVilles,
  MARINE_PROFOND,
} from "@/components/sections";
import { servicePhoto } from "@/components/photos";
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
    description:
      `${court} ${cityIn} : pose, entretien et retrait inclus, matériel DEL commercial fourni. Projets à partir de 1 000 $.`,
    alternates: { canonical: `/secteur/${c.slug}/${s.slug}` },
    openGraph: {
      title: `${title} | Solution Lumière de Noël`,
      description: `Lumières de Noël ${cityIn} — pose, entretien et retrait inclus. Un nombre limité de propriétés chaque saison.`,
      url: `/secteur/${c.slug}/${s.slug}`,
      images: [servicePhoto(s.slug, c.slug)?.src].filter(Boolean),
    },
  };
}

// =============================================================================
// LE GABARIT VILLE × SERVICE (partie 3)
// =============================================================================
// Le gabarit de service, appliqué à une ville : hero (photo GÉNÉRIQUE du
// service — la photo de la ville est dans « À propos »), ce qui est compris,
// « À propos de {ville} », le parcours, la FAQ (deux questions de la ville,
// une du service), les autres villes pour CE service, le formulaire.
// =============================================================================
export default function CityServicePage({ params }) {
  const c = findCity(params.city);
  const s = findService(params.service);
  if (!c || !s) return notFound();

  const faqs = faqVilleService(c, s);
  const cle = cleService(s.slug);
  const heroPhoto = servicePhoto(s.slug);   // sans ville : la générique du service
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

      <HeroPage
        photo={heroPhoto}
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
