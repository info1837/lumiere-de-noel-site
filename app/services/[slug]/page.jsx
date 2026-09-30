import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero, SectionTag, SectionTitle, CTAButton, Breadcrumb } from "@/components/ui";
import { ServiceJsonLd, BreadcrumbJsonLd } from "@/components/jsonld";
import {
  services, cities, findService, serviceArea, inCity,
  navy, offWhite, ivory, gold, charcoal, goldText,
} from "@/components/data";

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

export default function ServicePage({ params }) {
  const s = findService(params.slug);
  if (!s) return notFound();

  const otherServices = services.filter((x) => x.slug !== s.slug);

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

      <PageHero
        kicker={s.kicker}
        title={s.h1 || s.title}
        subtitle={s.intro}
        image={s.heroImage}
        imageAlt={s.heroImageAlt}
        ctaLabel="Réserver ma date"
      />

      {/* Intro + bullets */}
      <section style={{ background: offWhite }}>
        <div className="container">
          <Breadcrumb
            items={[
              { name: "Accueil", href: "/" },
              { name: s.title },
            ]}
          />
          <div className="grid-2" style={{ alignItems: "start" }}>
            <div>
              <SectionTag>Ce qui est inclus</SectionTag>
              <SectionTitle>Service complet, sans surprise</SectionTitle>
              <p style={{ color: "#444", fontSize: 18, marginBottom: 22 }}>{s.body}</p>
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
            {/* Le volet municipal n'a AUCUNE photo (heroImage: null). Sans ce
                garde, React rend <img> sans src : une image cassée. On ne
                réserve alors même pas le cadre — pas de trou décoratif. */}
            {s.heroImage && (
              <div style={{ borderRadius: 18, overflow: "hidden", aspectRatio: "4 / 3", background: "#11202f" }}>
                <img src={s.heroImage} alt={s.heroImageAlt} loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ⚠️ L'ASSURANCE, SUR LA PAGE COMMERCIALE SEULEMENT.
          Pour un propriétaire, c'est une ligne rassurante parmi d'autres.
          Pour un gestionnaire d'immeuble, c'est un CRITÈRE D'ACHAT : il ne
          peut pas signer sans preuve, et s'il doit la demander par courriel
          il appelle d'abord le concurrent qui l'affiche.

          Pas de cinquième carte dans la grille résidentielle : décision de
          Yahir (2026-09-30). Un bloc dédié, ici, où la question se pose. */}
      {s.slug === "lumieres-de-noel-commercial" && (
        <section style={{ background: offWhite }}>
          <div className="container" style={{ maxWidth: 820 }}>
            <div style={{
              background: "#fff", border: "1px solid rgba(11,27,43,0.12)", borderRadius: 16,
              padding: "30px 30px 26px", textAlign: "left",
            }}>
              <SectionTag>Assurance</SectionTag>
              <h2 style={{ color: charcoal, fontSize: 28, margin: "10px 0 12px" }}>
                Assurance responsabilité en vigueur, preuve fournie sur demande
              </h2>
              <p style={{ color: "#5a5a58", fontSize: 17, lineHeight: 1.65, margin: "0 0 22px" }}>
                Nos équipes travaillent en hauteur sur vos façades, vos marquises et vos
                vitrines. La police est active pour toute la saison, et nous transmettons
                l’attestation directement à votre gestionnaire ou à votre service des achats.
              </p>
              <CTAButton href="/soumission?service=commercial" variant="gold">
                Demander notre preuve d’assurance
              </CTAButton>
            </div>
          </div>
        </section>
      )}

      {/* Villes desservies pour ce service (maillage interne — service × ville) */}
      <section className="snowy" style={{ background: navy }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <SectionTag dark>Zones desservies</SectionTag>
            <SectionTitle light style={{ margin: "0 auto" }}>{s.title} — partout dans le Grand Montréal</SectionTitle>
          </div>
          <div className="grid-3">
            {cities.map((c) => (
              <Link key={c.slug} href={`/secteur/${c.slug}/${s.slug}`} className="glow-card" style={{
                display: "block", textDecoration: "none",
                background: "#10202f", borderRadius: 14, padding: 22,
                border: "1px solid rgba(233,220,192,0.18)",
              }}>
                <div style={{ color: gold, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>
                  {c.regionLabel}
                </div>
                <div style={{ color: ivory, fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: "0.03em", marginBottom: 8 }}>
                  {s.title} {inCity(c.name)}
                </div>
                <div style={{ color: "rgba(243,233,210,0.65)", fontSize: 14 }}>
                  Voir les détails →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Autres services */}
      <section style={{ background: offWhite }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <SectionTag>Nos autres services</SectionTag>
            <SectionTitle style={{ margin: "0 auto" }}>Un seul fournisseur pour tout</SectionTitle>
          </div>
          <div className="grid-3">
            {otherServices.map((o) => (
              <Link key={o.slug} href={`/services/${o.slug}`} className="glow-card-light" style={{
                display: "block", textDecoration: "none",
                background: "#fff", borderRadius: 14, padding: 22,
                border: "1px solid #ece5d6",
              }}>
                <div style={{ color: goldText, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>
                  {o.kicker}
                </div>
                <div style={{ color: charcoal, fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: "0.03em", marginBottom: 8 }}>
                  {o.title}
                </div>
                <div style={{ color: "#555", fontSize: 14 }}>Voir le service →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="snowy" style={{ background: navy }}>
        <div className="container" style={{ textAlign: "center" }}>
          <SectionTag dark>Prêt à commencer ?</SectionTag>
          <SectionTitle light style={{ margin: "0 auto 22px" }}>Réservez votre date</SectionTitle>
          <CTAButton href="/soumission" variant="gold">Réserver ma date</CTAButton>
        </div>
      </section>
    </>
  );
}
