import Link from "next/link";
import RenewalForm from "@/components/RenewalForm";
import { SectionTag } from "@/components/ui";
import { company, navy, ivory, gold, goldText } from "@/components/data";
import { PHOTOS } from "@/components/photos";

export const metadata = {
  title: "Renouvellement",
  description:
    "Vous étiez client l'an dernier ? On connaît déjà votre propriété et votre matériel est chez nous. Réservez votre date pour la saison 2026.",
  alternates: { canonical: "/renouvellement" },
  openGraph: {
    title: "Renouvellement | Solution Lumière de Noël",
    description: "On connaît déjà votre propriété. Réservez votre date pour la saison 2026.",
    url: "/renouvellement",
    images: [PHOTOS["blainville-01"].src],
  },
};

// ⚠️ AUCUN PRIX, AUCUN POURCENTAGE, AUCUNE PRIORITÉ sur cette page.
// La version précédente promettait « 70 à 80 % du prix initial » et que
// « les clients existants sont servis en premier » : le premier est un
// engagement de prix public qu'on pourrait se voir réclamer, le second un
// rang qu'on ne peut pas garantir. Ce qui reste ci-dessous est vrai sans
// rien promettre. Ne pas y remettre de chiffre.
const advantages = [
  {
    title: "On connaît déjà votre propriété",
    body: "Pas de visite d'évaluation à reprendre : le design est fait, les attaches sont posées. On confirme la date, on arrive, on installe.",
  },
  {
    title: "Votre matériel est déjà chez nous",
    body: "On l'a retiré en janvier et entreposé depuis. Rien à ressortir du garage, rien à racheter.",
  },
  {
    title: "Les ajustements sont simples",
    body: "Une section à ajouter, une couleur à changer, un arbre de plus ? Dites-le dans le formulaire, on en tient compte dans votre prix.",
  },
  {
    title: "Réserver tôt garantit votre date",
    body: "Les semaines de novembre partent en premier. Plus tôt vous confirmez, plus vous avez le choix.",
  },
];

export default function RenouvellementPage() {
  return (
    <>
      <section className="snowy" style={{ background: navy, paddingTop: 140, paddingBottom: 60 }}>
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div>
            <SectionTag dark>Renouvellement</SectionTag>
            <h1 style={{ color: ivory, marginBottom: 20 }}>
              Vous étiez client l'an dernier ?<br />
              Réservez votre date.
            </h1>
            <p style={{ color: "rgba(243,233,210,0.9)", fontSize: 19, marginBottom: 22, maxWidth: 560 }}>
              Le design est déjà conçu, les attaches sont en place et votre matériel est
              entreposé chez nous. Reconduire, c'est confirmer une date.
            </p>
            <p style={{ color: "rgba(243,233,210,0.78)", fontSize: 15, marginBottom: 28, maxWidth: 560 }}>
              Remplissez le formulaire — on vous rappelle avec votre prix de reconduction.
            </p>
            <div style={{ display: "grid", gap: 12, color: "rgba(243,233,210,0.85)", fontSize: 15 }}>
              <a href={company.phoneHref} style={{
                color: gold, textDecoration: "none", fontWeight: 700, fontSize: 22,
                fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em",
              }}>
                {company.phoneDisplay}
              </a>
              <a href={company.emailHref} style={{ color: "rgba(243,233,210,0.85)", textDecoration: "none" }}>
                {company.email}
              </a>
              <div style={{ color: "rgba(243,233,210,0.6)" }}>
                Pas encore client ? <Link href="/soumission" style={{ color: "rgba(243,233,210,0.9)", textDecoration: "underline" }}>Soumission gratuite</Link>.
              </div>
            </div>
          </div>
          <div style={{ paddingBottom: 24 }}>
            <RenewalForm />
          </div>
        </div>
      </section>

      <section style={{ background: "#fff" }}>
        <div className="container" style={{ maxWidth: 1000 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, letterSpacing: "0.2em",
            textTransform: "uppercase", color: goldText, marginBottom: 10, textAlign: "center",
          }}>
            Pourquoi reconduire
          </div>
          <h2 style={{ textAlign: "center", marginBottom: 40 }}>
            Ce qui change quand vous revenez
          </h2>
          <div className="grid-2" style={{ alignItems: "stretch" }}>
            {advantages.map((a) => (
              <div key={a.title} className="glow-card-light" style={{
                background: "#fff", border: "1px solid #ece5d4", borderRadius: 14,
                padding: 26,
              }}>
                <h3 style={{ fontSize: 22, marginBottom: 8 }}>{a.title}</h3>
                <p style={{ margin: 0, color: "#3a3a3a" }}>{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
