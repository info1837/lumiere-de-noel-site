import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero, SectionTag, SectionTitle, CTAButton, Breadcrumb } from "@/components/ui";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/jsonld";
import { cityHeroPhoto, servicePhoto } from "@/components/photos";
import {
  services, cities, findCity, inCity,
  navy, offWhite, ivory, gold, charcoal, goldText,
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
    a: `Le tarif débute à 1 000 $ pour une résidence et varie selon la grandeur de la propriété et le design. Soumission gratuite avec estimation claire.`,
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
        ctaLabel="Soumission gratuite"
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
            <CTAButton href="/soumission">Soumission gratuite</CTAButton>
          </div>
        </div>
      </section>

      {/* Services pour cette ville (maillage interne — service × ville) */}
      <section className="snowy" style={{ background: navy }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <SectionTag dark>Nos services {inCity(c.name)}</SectionTag>
            <SectionTitle light style={{ margin: "0 auto" }}>Pour chaque type de propriété</SectionTitle>
          </div>
          <div className="grid-2">
            {services.map((s) => (
              <Link key={s.slug} href={`/secteur/${c.slug}/${s.slug}`} className="glow-card" style={{
                display: "block", textDecoration: "none",
                background: "#10202f", borderRadius: 16, overflow: "hidden",
                border: "1px solid rgba(233,220,192,0.16)",
              }}>
                <div style={{ aspectRatio: "16 / 9", background: "#0b1b2b" }}>
                  {(() => { const ph = servicePhoto(s.slug, c.slug); return ph && (
                    <img src={ph.src} alt={ph.alt} loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />); })()}
                </div>
                <div style={{ padding: 24 }}>
                  <div style={{ color: gold, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>
                    {s.kicker}
                  </div>
                  <h3 style={{ color: ivory, marginBottom: 8, fontSize: 26 }}>{s.title} {inCity(c.name)}</h3>
                  <p style={{ color: "rgba(243,233,210,0.7)", fontSize: 15, margin: 0 }}>
                    {s.forCity ? s.forCity(c.name) : s.intro}
                  </p>
                  <div style={{ color: gold, fontSize: 13, fontWeight: 700, marginTop: 14, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Voir les détails →
                  </div>
                </div>
              </Link>
            ))}
          </div>
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
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <CTAButton href="/soumission">Soumission gratuite</CTAButton>
          </div>
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
