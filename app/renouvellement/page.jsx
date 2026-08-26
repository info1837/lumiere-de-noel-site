import Link from "next/link";
import RenewalForm from "@/components/RenewalForm";
import { SectionTag } from "@/components/ui";
import { company, navy, ivory, gold, goldText } from "@/components/data";

export const metadata = {
  title: "Renouvellement — client de l'an passé",
  description:
    "Client de l'an passé ? Votre reconduction est plus simple et moins chère — généralement entre 70 % et 80 % du prix initial. Réservez votre date en moins d'une minute.",
  alternates: { canonical: "/renouvellement" },
  openGraph: {
    title: "Renouvellement — client de l'an passé | Lumière de Noël inc.",
    description: "Reconduction plus simple, à ~70–80 % du prix initial. Réservez votre date pour la saison 2026.",
    url: "/renouvellement",
    images: ["/images/hero-accueil.jpg"],
  },
};

const advantages = [
  {
    title: "~70 à 80 % du prix initial",
    body: "Le matériel et le design sont déjà là — la reconduction coûte typiquement 70 à 80 % du prix de la première saison.",
  },
  {
    title: "Aucune visite d'évaluation",
    body: "On connaît déjà votre propriété. On confirme la date, on arrive, on installe.",
  },
  {
    title: "Priorité sur les dates de novembre",
    body: "Les clients existants sont servis en premier — vous choisissez votre semaine avant l'ouverture publique.",
  },
  {
    title: "Retrait et entreposage inclus",
    body: "Comme l'an dernier : on garde votre matériel chez nous jusqu'à la prochaine saison.",
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
              Client de l'an passé ?<br />
              Votre reconduction est plus simple (et moins chère).
            </h1>
            <p style={{ color: "rgba(243,233,210,0.9)", fontSize: 19, marginBottom: 22, maxWidth: 560 }}>
              Beaucoup de nos clients reviennent chaque saison — et le prix baisse
              parce que le matériel et le design sont déjà faits. Comptez généralement
              entre <strong style={{ color: gold }}>70 % et 80 % du prix initial</strong>.
            </p>
            <p style={{ color: "rgba(243,233,210,0.78)", fontSize: 15, marginBottom: 28, maxWidth: 560 }}>
              Confirmez votre date en moins d'une minute — on vous rappelle avec le prix
              exact en moins de 24 h.
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
            4 raisons de réserver dès maintenant
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
