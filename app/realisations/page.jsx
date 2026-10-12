import { SectionTag, SectionTitle, CTAButton } from "@/components/ui";
import GalerieRealisations from "@/components/GalerieRealisations";
import { noelPage as p, navy, ivory, CHANTIERS, CATEGORIES_CHANTIERS } from "@/components/data";
import { PHOTOS } from "@/components/photos";

// ⚠️ CETTE PAGE A SON PROPRE TITRE ET SON PROPRE H1.
// Elle portait ceux de l'accueil (« Installation de lumières de Noël | … »
// et « Installation de lumières de Noël au Québec ») : deux pages en
// concurrence sur la même requête, et un H1 qui ne disait pas ce que la
// page montre. Ici : des photos de vrais chantiers, et rien d'autre avant.
const TITRE = "Réalisations — vraies installations | Solution Lumière de Noël";

export const metadata = {
  title: { absolute: TITRE },
  description:
    "Nos installations de lumières de Noël en photos : Blainville, Saint-Jérôme, Mirabel, Mercier, Léry, Montréal. Résidentiel et commercial.",
  alternates: { canonical: "/realisations" },
  openGraph: {
    title: TITRE,
    description: "De vraies propriétés, de vraies installations — en photos.",
    url: "/realisations",
    images: [PHOTOS["blainville-01"].src],
  },
};

export default function Realisations() {
  return (
    <>
      <section style={{ background: navy, paddingTop: "clamp(124px, 18vh, 160px)" }}>
        <div className="container">
          <header style={{ maxWidth: 720, marginBottom: 32 }}>
            <SectionTag dark>Réalisations</SectionTag>
            <h1 style={{ color: ivory }}>De vraies propriétés, de vraies installations</h1>
            <p style={{ color: "rgba(240,234,222,0.82)", fontSize: 18, margin: "14px 0 0" }}>
              {p.intro}
            </p>
          </header>
          <GalerieRealisations chantiers={CHANTIERS} categories={CATEGORIES_CHANTIERS} />
        </div>
      </section>

      <section className="snowy" style={{ background: "#060E18" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <SectionTag dark>Prêt pour les Fêtes ?</SectionTag>
          <SectionTitle light style={{ margin: "0 auto 26px" }}>
            Réservez votre installation dès maintenant
          </SectionTitle>
          <p style={{ color: "rgba(243,233,210,0.75)", fontSize: 18, margin: "0 auto 30px", maxWidth: 560 }}>
            Les places de la saison sont limitées — les meilleures dates partent vite.
          </p>
          <CTAButton href="/soumission" variant="creme">Réserver ma date</CTAButton>
        </div>
      </section>
    </>
  );
}
