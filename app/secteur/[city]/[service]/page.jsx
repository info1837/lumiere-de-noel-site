import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero, SectionTag, SectionTitle, CTAButton, Breadcrumb } from "@/components/ui";
import { BreadcrumbJsonLd, ServiceJsonLd, FaqJsonLd } from "@/components/jsonld";
import {
  services, cities, findCity, findService, inCity,
  navy, offWhite, ivory, gold, charcoal, goldText,
} from "@/components/data";

// Génère les 6 × 4 = 24 combinaisons service × ville en statique.
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
  const title = `${s.title} ${cityIn}`;
  return {
    title,
    description:
      `${s.title} ${cityIn} — service clé en main avec matériel professionnel fourni. ${s.metaDescription.split(".")[0]}.`,
    alternates: { canonical: `/secteur/${c.slug}/${s.slug}` },
    openGraph: {
      title: `${title} | Lumière de Noël inc.`,
      description: `Installation par notre équipe ${cityIn}. Retrait inclus. Soumission gratuite.`,
      url: `/secteur/${c.slug}/${s.slug}`,
      images: [s.heroImage],
    },
  };
}

const buildFaq = (cityName, serviceTitle) => [
  {
    q: `Faites-vous l'installation de ${serviceTitle.toLowerCase()} ${inCity(cityName)}?`,
    a: `Oui. ${cityName} fait partie de notre territoire principal — nos équipes y sont sur la route plusieurs jours par semaine en saison.`,
  },
  {
    q: `Combien de temps prend l'installation ${inCity(cityName)}?`,
    a: `La plupart des résidences sont complétées en une journée. Pour les projets commerciaux ou les grandes propriétés, on planifie selon vos besoins.`,
  },
  {
    q: `Le matériel est-il inclus?`,
    a: `Oui. Lumières DEL de qualité commerciale, attaches, minuteries — tout est fourni, installé, entretenu et retiré par notre équipe.`,
  },
];

export default function CityServicePage({ params }) {
  const c = findCity(params.city);
  const s = findService(params.service);
  if (!c || !s) return notFound();

  const faqs = buildFaq(c.name, s.title);
  const otherServicesInCity = services.filter((x) => x.slug !== s.slug);

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
      <FaqJsonLd items={faqs} />

      <PageHero
        kicker={`${c.regionLabel} — ${c.name}`}
        title={`${s.title} ${inCity(c.name)}`}
        subtitle={s.forCity ? s.forCity(c.name) : s.intro}
        image={s.heroImage}
        imageAlt={s.heroImageAlt}
        ctaLabel="Soumission gratuite"
      />

      <section style={{ background: offWhite }}>
        <div className="container">
          <Breadcrumb
            items={[
              { name: "Accueil", href: "/" },
              { name: c.name, href: `/secteur/${c.slug}` },
              { name: s.title },
            ]}
          />
          <div className="grid-2" style={{ alignItems: "start" }}>
            <div>
              <SectionTag>Service {inCity(c.name)}</SectionTag>
              <SectionTitle>{s.h1 || s.title} — {c.name}</SectionTitle>
              {/* Contenu propre à CHAQUE combinaison ville × service (anti contenu mince).
                  forCity() + le corps unique de la ville évitent les 24 pages quasi-identiques. */}
              <p style={{ color: "#444", fontSize: 18, marginBottom: 18 }}>
                {s.forCity ? s.forCity(c.name) : s.intro}
              </p>
              <p style={{ color: "#444", fontSize: 17, marginBottom: 16 }}>{c.body}</p>
              <p style={{ color: "#444", fontSize: 17, marginBottom: 22 }}>{s.body}</p>
              <ul style={{ listStyle: "none" }}>
                {s.bullets.map((b, i) => (
                  <li key={i} style={{ display: "flex", gap: 10, marginBottom: 12, color: charcoal, fontSize: 16 }}>
                    <span className="bulb bulb--tw" aria-hidden="true" style={{ marginTop: 5 }} />{b}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 26 }}>
                <CTAButton href="/soumission">Soumission gratuite</CTAButton>
              </div>
            </div>
            <div>
              <div style={{ borderRadius: 18, overflow: "hidden", aspectRatio: "4 / 3", background: "#11202f", marginBottom: 16 }}>
                <img src={s.heroImage} alt={s.heroImageAlt} loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ background: "#fff", border: "1px solid #ece5d6", borderRadius: 14, padding: 20 }}>
                <div style={{ color: goldText, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>
                  À propos de {c.name}
                </div>
                <p style={{ color: "#444", fontSize: 15, margin: 0 }}>{c.intro}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ ciblée service × ville */}
      <section className="snowy" style={{ background: navy }}>
        <div className="container" style={{ maxWidth: 820 }}>
          <div style={{ textAlign: "center", marginBottom: 26 }}>
            <SectionTag dark>FAQ</SectionTag>
            <SectionTitle light style={{ margin: "0 auto" }}>{s.title} {inCity(c.name)}</SectionTitle>
          </div>
          {faqs.map((f, i) => (
            <details key={i} style={{ borderBottom: "1px solid rgba(233,220,192,0.18)", padding: "20px 4px" }}>
              <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 17, color: ivory, listStyle: "none" }}>
                {f.q}
              </summary>
              <p style={{ color: "rgba(243,233,210,0.78)", fontSize: 16, marginTop: 10 }}>{f.a}</p>
            </details>
          ))}
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <CTAButton href="/soumission" variant="gold">Réserver ma date</CTAButton>
          </div>
        </div>
      </section>

      {/* Autres services dans cette ville (maillage interne) */}
      <section style={{ background: offWhite }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <SectionTag>Aussi {inCity(c.name)}</SectionTag>
            <SectionTitle style={{ margin: "0 auto" }}>Autres services disponibles</SectionTitle>
          </div>
          <div className="grid-3">
            {otherServicesInCity.map((o) => (
              <Link key={o.slug} href={`/secteur/${c.slug}/${o.slug}`} className="glow-card-light" style={{
                display: "block", textDecoration: "none",
                background: "#fff", borderRadius: 14, padding: 22,
                border: "1px solid #ece5d6",
              }}>
                <div style={{ color: goldText, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>
                  {o.kicker}
                </div>
                <div style={{ color: charcoal, fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: "0.03em", marginBottom: 6 }}>
                  {o.title} {inCity(c.name)}
                </div>
                <div style={{ color: "#555", fontSize: 14 }}>Voir les détails →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
