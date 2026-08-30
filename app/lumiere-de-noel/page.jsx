import { PageHero, SectionTag, SectionTitle, Gallery, CTAButton } from "@/components/ui";
import { noelPage as p, offWhite, navy } from "@/components/data";
import { PHOTOS } from "@/components/photos";

export const metadata = {
  title: "Installation de lumières de Noël",
  description:
    "Installation clé en main de lumières de Noël au Québec — conception, pose, entretien et retrait. Résidentiel, commercial et municipal. Portfolio de projets. Soumission gratuite.",
  alternates: { canonical: "/lumiere-de-noel" },
  openGraph: {
    title: "Installation de lumières de Noël | Lumière de Noël inc.",
    description: "On conçoit, installe, entretient et retire vos lumières de Noël. Vous profitez des Fêtes.",
    url: "/lumiere-de-noel",
    images: [PHOTOS["blainville-01"].src],
  },
};

export default function LumiereDeNoel() {
  return (
    <>
      <PageHero
        kicker={p.heroKicker}
        title={p.heroTitle}
        subtitle={p.heroSubtitle}
        image={p.heroImage}
        imageAlt={p.heroImageAlt}
        ctaLabel="Soumission gratuite"
      />

      <section id="realisations" style={{ background: offWhite, scrollMarginTop: 100 }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 36, maxWidth: 720, marginLeft: "auto", marginRight: "auto" }}>
            <SectionTag>Portfolio</SectionTag>
            <SectionTitle style={{ margin: "0 auto 14px" }}>Nos réalisations à travers le Québec</SectionTitle>
            {/* DRAFT COPY */}
            <p style={{ color: "#444", fontSize: 18, margin: "0 auto" }}>{p.intro}</p>
          </div>
          <Gallery items={p.gallery} />
        </div>
      </section>

      <section className="snowy" style={{ background: navy }}>
        <div className="container" style={{ textAlign: "center" }}>
          <SectionTag dark>Prêt pour les Fêtes ?</SectionTag>
          <SectionTitle light style={{ margin: "0 auto 26px" }}>
            Réservez votre installation dès maintenant
          </SectionTitle>
          <p style={{ color: "rgba(243,233,210,0.75)", fontSize: 18, margin: "0 auto 30px", maxWidth: 560 }}>
            Soumission gratuite et sans obligation. Les meilleures dates partent vite.
          </p>
          <CTAButton href="/soumission" variant="gold">Soumission gratuite</CTAButton>
        </div>
      </section>
    </>
  );
}
