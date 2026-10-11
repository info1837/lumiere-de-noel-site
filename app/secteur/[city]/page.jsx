import { notFound } from "next/navigation";
import { BreadcrumbJsonLd } from "@/components/jsonld";
import {
  HeroPage, AProposVille, CartesServices, CeQuiEstCompris, Parcours, FaqCourte,
  Reservation, PucesVilles,
} from "@/components/sections";
import { PHOTOS, cityHeroPhoto } from "@/components/photos";
import { cities, findCity, inCity, findService } from "@/components/data";

export function generateStaticParams() {
  return cities.map((c) => ({ city: c.slug }));
}

export function generateMetadata({ params }) {
  const c = findCity(params.city);
  if (!c) return {};
  return {
    title: `Lumières de Noël ${inCity(c.name)}`,
    description: c.metaDescription,
    alternates: { canonical: `/secteur/${c.slug}` },
    openGraph: {
      title: `Installation de lumières de Noël ${inCity(c.name)} | Solution Lumière de Noël inc.`,
      description: c.metaDescription,
      url: `/secteur/${c.slug}`,
      images: [cityHeroPhoto(c.slug).src],
    },
  };
}

// =============================================================================
// LE GABARIT DE VILLE (partie 3)
// =============================================================================
// Le gabarit de service, plus « À propos de {ville} » (les lignes locales
// et la VRAIE photo de la ville) et les trois services en cartes compactes.
//
// ⚠️ LE HERO PORTE UNE PHOTO GÉNÉRIQUE, ET C'EST VOULU. La photo de la
// ville vit dans « À propos » : la mettre aussi en haut montrerait la même
// maison deux fois sur une page. Et la bande de photos du service n'est pas
// reprise ici : elle nomme d'autres villes, et une page de ville ne montre
// jamais la maison d'ailleurs (check-photos, check-pages-locales).
// =============================================================================
export default function CityPage({ params }) {
  const c = findCity(params.city);
  if (!c) return notFound();
  const residentiel = findService("lumieres-de-noel-residentiel");

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", url: "/" },
          { name: "Zones desservies", url: "/secteur" },
          { name: c.name, url: `/secteur/${c.slug}` },
        ]}
      />

      <HeroPage
        photo={PHOTOS["arbre-enrubanne"]}
        kicker={c.regionLabel}
        titre={`Lumières de Noël ${inCity(c.name)}`}
        phrase={c.intro}
        filAriane={[{ name: "Accueil", href: "/" }, { name: "Secteurs", href: "/secteur" }, { name: c.name }]}
      />

      <AProposVille ville={c} />

      <CartesServices ville={c} />

      <CeQuiEstCompris compris={residentiel.compris} />

      <Parcours />

      <FaqCourte items={c.faq} titre={`Vos questions sur ${c.name}`} tag={`FAQ — ${c.name}`} />

      <PucesVilles exclure={c.slug} titre="Autres zones desservies" />

      {/* La ville de la page voyage dans la source : Yahir voit d'où vient
          la fiche sans avoir à deviner. */}
      <Reservation source={`Page ville — ${c.name}`} redirectSrc="ville" />
    </>
  );
}
