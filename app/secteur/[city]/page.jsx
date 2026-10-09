import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero, SectionTag, SectionTitle, CTAButton, Breadcrumb } from "@/components/ui";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/jsonld";
import QuoteForm from "@/components/QuoteForm";
import { cityHeroPhoto } from "@/components/photos";
import {
  services, cities, findCity, inCity,
  navy, offWhite, ivory, gold, charcoal, goldText, creme,
} from "@/components/data";

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

const cityFaq = (cityName) => [
  {
    q: `Desservez-vous tout le territoire de ${cityName}?`,
    a: `Oui — ${cityName} et les municipalités voisines. Si vous êtes en limite de secteur, demandez : on vous le dira franchement.`,
  },
  {
    q: `Combien coûte une installation à ${cityName}?`,
    a: `Le tarif débute à 1 000 $ pour une résidence et varie selon la grandeur de la propriété et le design. Le prix exact est confirmé après une courte consultation.`,
  },
  {
    q: `Quand devrais-je réserver pour ${cityName}?`,
    a: `Le plus tôt possible — idéalement en octobre. Les dates de novembre partent vite : réserver tôt garantit la vôtre avant les premières neiges.`,
  },
  {
    q: `Est-ce que le retrait est inclus?`,
    a: `Oui. On revient en janvier désinstaller toutes les lumières et on entrepose le matériel jusqu'à la prochaine saison. Aucun frais additionnel.`,
  },
];

export default function CityPage({ params }) {
  const c = findCity(params.city);
  if (!c) return notFound();
  const faqs = cityFaq(c.name);
  const otherCities = cities.filter((x) => x.slug !== c.slug);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", url: "/" },
          { name: "Zones desservies", url: "/secteur" },
          { name: c.name, url: `/secteur/${c.slug}` },
        ]}
      />
      <FaqJsonLd items={faqs} />

      <PageHero
        kicker={c.regionLabel}
        title={`Lumières de Noël ${inCity(c.name)}`}
        subtitle={c.intro}
        image={cityHeroPhoto(c.slug).src}
        imageAlt={cityHeroPhoto(c.slug).alt}
        ctaLabel="Réserver ma date"
      />

      {/* Intro */}
      <section style={{ background: offWhite }}>
        <div className="container">
          <Breadcrumb
            items={[
              { name: "Accueil", href: "/" },
              { name: c.name },
            ]}
          />
          <div style={{ maxWidth: 760 }}>
            <SectionTag>{c.regionLabel}</SectionTag>
            <SectionTitle>Notre service {inCity(c.name)}</SectionTitle>
            <p style={{ color: "#444", fontSize: 18, marginBottom: 18 }}>{c.body}</p>
            <CTAButton href="/soumission">Réserver ma date</CTAButton>
          </div>
        </div>
      </section>

      {/* Services pour cette ville (maillage interne — service × ville) */}
      {/* ⚠️ MÊMES LIENS, SANS LES CARTES À PHOTO.
          Trois cartes de 16/9 plus 24 px de padding : la page montrait ici
          les mêmes photos que l'accueil et /realisations, en plus petit.
          Les href et les textes d'ancrage sont identiques — le maillage
          service × ville, qui est la raison d'être de cette page côté SEO,
          ne perd rien. */}
      <section style={{ background: navy }}>
        <div className="container">
          <div className="section-entete">
            <SectionTag dark>Nos services {inCity(c.name)}</SectionTag>
            <SectionTitle light style={{ margin: 0 }}>Pour chaque type de propriété</SectionTitle>
          </div>
          <ul className="liste-liens liste-liens--large">
            {services.map((s) => (
              <li key={s.slug}>
                <Link href={`/secteur/${c.slug}/${s.slug}`}>
                  <span className="liste-liens__region">{s.kicker}</span>
                  <span className="liste-liens__nom">{s.title} {inCity(c.name)}</span>
                  <span className="liste-liens__note">
                    {s.forCity ? s.forCity(c.name) : s.intro}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ ciblée ville */}
      <section style={{ background: offWhite }}>
        <div className="container" style={{ maxWidth: 820 }}>
          <div style={{ textAlign: "center", marginBottom: 26 }}>
            <SectionTag>FAQ — {c.name}</SectionTag>
            <SectionTitle style={{ margin: "0 auto" }}>Vos questions sur {c.name}</SectionTitle>
            {/* "Vos questions sur X" reste grammatical pour toutes les zones. */}
          </div>
          {faqs.map((f, i) => (
            <details key={i} style={{ borderBottom: "1px solid #e5dfd0", padding: "20px 4px" }}>
              <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 17, color: charcoal, listStyle: "none" }}>
                {f.q}
              </summary>
              <p style={{ color: "#444", fontSize: 16, marginTop: 10 }}>{f.a}</p>
            </details>
          ))}
          {/* ⚠️ Le bouton qui était ici est parti : c'était le deuxième
              « Réserver ma date » de la page, et le formulaire est
              maintenant juste en dessous. Proposer un clic vers un
              formulaire qu'on va croiser trois centimètres plus bas, c'est
              ajouter une étape pour en retirer une. */}
        </div>
      </section>

      {/* LE formulaire de la page — le même QuoteForm que /soumission. */}
      <section id="soumission" style={{ background: creme }}>
        <div className="container bloc-formulaire">
          <div className="section-entete">
            <SectionTag>Réservation</SectionTag>
            <SectionTitle style={{ margin: "0 auto 14px" }}>Réservez votre date</SectionTitle>
            <p className="section-phrase section-phrase--clair">
              Nous confirmons votre place et votre prix après une courte consultation.
            </p>
          </div>
          {/* La ville de la page voyage dans la source : Yahir voit d'où
              vient la fiche sans avoir à deviner. */}
          <QuoteForm source={`Page ville — ${c.name}`} redirectSrc="ville" />
        </div>
      </section>

      {/* Autres zones desservies (maillage interne) */}
      <section className="snowy" style={{ background: navy, paddingTop: 60, paddingBottom: 60 }}>
        <div className="container" style={{ textAlign: "center" }}>
          <SectionTag dark>Aussi disponible dans</SectionTag>
          <SectionTitle light style={{ margin: "0 auto 22px" }}>Autres zones desservies</SectionTitle>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
            {otherCities.map((o) => (
              <Link key={o.slug} href={`/secteur/${o.slug}`} style={{
                padding: "10px 18px", borderRadius: 300, fontSize: 14,
                border: "1px solid rgba(233,220,192,0.3)",
                color: "rgba(243,233,210,0.9)", textDecoration: "none",
              }}>
                {o.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
