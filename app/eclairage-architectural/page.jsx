import { PageHero, SectionTag, SectionTitle, FaqAccordion, Gallery, CTAButton } from "@/components/ui";
import AppDemo from "@/components/AppDemo";
import { eclairagePage as p, navy, offWhite, ivory, gold, charcoal } from "@/components/data";
import { PHOTOS } from "@/components/photos";

export const metadata = {
  title: "Éclairage architectural permanent",
  description:
    "Système d'éclairage DEL architectural permanent : installé une fois, illuminez votre propriété toute l'année via une application. Résidentiel, commercial et municipal au Québec. Soumission gratuite.",
  alternates: { canonical: "/eclairage-architectural" },
  openGraph: {
    title: "Éclairage architectural permanent | Lumière de Noël inc.",
    description: "DEL discrètes installées une seule fois — un éclairage pour chaque occasion, toute l'année.",
    url: "/eclairage-architectural",
    images: [PHOTOS["permanent-hero"].src],
  },
};

export default function EclairageArchitectural() {
  return (
    <>
      {/* SEO : rich results FAQ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: p.faq.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
      <PageHero
        kicker={p.heroKicker}
        title={p.heroTitle}
        subtitle={p.heroSubtitle}
        image={p.heroImage}
        imageAlt={p.heroImageAlt}
        ctaLabel="Soumission gratuite"
      />

      {/* Section caractéristique */}
      <section style={{ background: offWhite }}>
        <div className="container grid-2">
          <div>
            <SectionTag>Éclairage permanent DEL</SectionTag>
            <SectionTitle>{p.feature.title}</SectionTitle>
            {/* DRAFT COPY */}
            <p style={{ color: "#444", fontSize: 18, marginBottom: 22 }}>{p.feature.body}</p>
            <ul style={{ listStyle: "none" }}>
              {p.feature.points.map((pt, i) => (
                <li key={i} style={{ display: "flex", gap: 10, marginBottom: 12, color: charcoal, fontSize: 16 }}>
                  <span className="bulb bulb--tw" aria-hidden="true" style={{ marginTop: 5 }} />{pt}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 26 }}>
              <CTAButton href="/soumission">Soumission gratuite</CTAButton>
            </div>
          </div>
          <div style={{ borderRadius: 18, overflow: "hidden", aspectRatio: "4 / 3", background: "#11202f" }}>
            <img src={PHOTOS["permanent-detail"].src} alt={PHOTOS["permanent-detail"].alt}
              loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>
      </section>

      {/* Démo interactive de l'application */}
      <AppDemo />

      {/* Pourquoi choisir */}
      <section className="snowy" style={{ background: navy }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <SectionTag dark>Pourquoi choisir l'éclairage permanent</SectionTag>
            <SectionTitle light style={{ margin: "0 auto" }}>Un investissement, illuminé toute l'année</SectionTitle>
          </div>
          <div className="grid-4">
            {p.whyChoose.map((w, i) => (
              <div key={i} className="glow-card" style={{ background: "#10202f", borderRadius: 14, padding: 26, border: "1px solid rgba(233,220,192,0.12)" }}>
                <div aria-hidden="true" style={{
                  width: 44, height: 44, borderRadius: "50%", marginBottom: 16,
                  background: gold, display: "flex", alignItems: "center", justifyContent: "center",
                  color: charcoal, fontFamily: "'Bebas Neue', sans-serif", fontSize: 20,
                }}>
                  {i + 1}
                </div>
                <h3 style={{ color: ivory, fontSize: 20, marginBottom: 8 }}>{w.title}</h3>
                <p style={{ color: "rgba(243,233,210,0.72)", fontSize: 15 }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Galerie */}
      <section style={{ background: offWhite }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <SectionTag>Réalisations</SectionTag>
            <SectionTitle style={{ margin: "0 auto" }}>Projets d'éclairage architectural</SectionTitle>
          </div>
          <Gallery items={p.gallery} />
        </div>
      </section>

      {/* FAQ (8 questions) */}
      <section className="snowy" style={{ background: navy }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <SectionTag dark>FAQ</SectionTag>
            <SectionTitle light style={{ margin: "0 auto" }}>Vos questions sur l'éclairage permanent</SectionTitle>
          </div>
          <FaqAccordion items={p.faq} dark />
          <div style={{ textAlign: "center", marginTop: 44 }}>
            <CTAButton href="/soumission" variant="gold">Soumission gratuite</CTAButton>
          </div>
        </div>
      </section>
    </>
  );
}
