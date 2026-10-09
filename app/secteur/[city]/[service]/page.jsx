import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero, SectionTag, SectionTitle, CTAButton, Breadcrumb } from "@/components/ui";
import QuoteForm from "@/components/QuoteForm";
import { BreadcrumbJsonLd, ServiceJsonLd, FaqJsonLd } from "@/components/jsonld";
import { servicePhoto } from "@/components/photos";
import {
  services, cities, findCity, findService, inCity,
  navy, offWhite, ivory, gold, charcoal, goldText, creme,
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

const buildFaq = (cityName, serviceTitle) => [
  {
    q: `Faites-vous l'installation de ${serviceTitle.toLowerCase()} ${inCity(cityName)}?`,
    a: `Oui, ${cityName} est dans notre territoire. On planifie les installations par secteur pour limiter les déplacements — réserver tôt vous laisse le choix de la date.`,
  },
  {
    q: `Combien de temps prend l'installation ${inCity(cityName)}?`,
    a: `La plupart des résidences se font en une seule visite. Pour les projets commerciaux ou les grandes propriétés, on planifie selon vos besoins.`,
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
        image={servicePhoto(s.slug, c.slug)?.src}
        imageAlt={servicePhoto(s.slug, c.slug)?.alt}
        ctaLabel="Réserver ma date"
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
                <CTAButton href="/soumission">Réserver ma date</CTAButton>
              </div>
            </div>
            <div>
              <div style={{ borderRadius: 18, overflow: "hidden", aspectRatio: "4 / 3", background: "#11202f", marginBottom: 16 }}>
                {(() => { const ph = servicePhoto(s.slug, c.slug); return ph && (
                  <img src={ph.src} alt={ph.alt} loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />); })()}
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
          {/* ⚠️ Le bouton qui était ici est parti : troisième « Réserver
              ma date » de la page, et le formulaire est maintenant deux
              sections plus bas. */}
        </div>
      </section>

      {/* Autres services dans cette ville (maillage interne) */}
      {/* Mêmes href, mêmes textes d'ancrage — la boîte en moins. */}
      <section style={{ background: "#060E18" }}>
        <div className="container">
          <div className="section-entete">
            <SectionTag dark>Aussi {inCity(c.name)}</SectionTag>
            <SectionTitle light style={{ margin: 0 }}>Autres services disponibles</SectionTitle>
          </div>
          <ul className="liste-liens">
            {otherServicesInCity.map((o) => (
              <li key={o.slug}>
                <Link href={`/secteur/${c.slug}/${o.slug}`}>
                  <span className="liste-liens__region">{o.kicker}</span>
                  <span className="liste-liens__nom">{o.title} {inCity(c.name)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* LE formulaire — même QuoteForm que /soumission, source par page. */}
      <section id="soumission" style={{ background: creme }}>
        <div className="container bloc-formulaire">
          <div className="section-entete">
            <SectionTag>Réservation</SectionTag>
            <SectionTitle style={{ margin: "0 auto 14px" }}>Réservez votre date</SectionTitle>
            <p className="section-phrase section-phrase--clair">
              Nous confirmons votre place et votre prix après une courte consultation.
            </p>
          </div>
          <QuoteForm source={`Page ${s.title} — ${c.name}`} redirectSrc="ville-service" />
        </div>
      </section>
    </>
  );
}
