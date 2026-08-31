import CalculatriceToiture from "@/components/CalculatriceToiture";
import { SectionTag } from "@/components/ui";
import { company, navy, ivory } from "@/components/data";

export const metadata = {
  title: "Calculatrice — le prix de vos lumières de Noël",
  description:
    "Tracez votre ligne de toit sur l'image satellite et voyez votre prix. Installation, entretien, retrait et entreposage inclus.",
  alternates: { canonical: "/calculatrice" },
  openGraph: {
    title: "Calculatrice — le prix de vos lumières de Noël | Solution Lumière de Noël inc.",
    description: "Votre prix à l'écran, en deux minutes.",
    url: "/calculatrice",
  },
};

export default function CalculatricePage() {
  return (
    <section className="snowy" style={{ background: navy, paddingTop: 140 }}>
      <div className="container grid-2" style={{ alignItems: "start" }}>
        <div>
          <SectionTag dark>Calculatrice</SectionTag>
          <h1 style={{ color: ivory, marginBottom: 18 }}>Votre prix, à l'écran</h1>
          <p style={{ color: "rgba(243,233,210,0.85)", fontSize: 19, marginBottom: 22, maxWidth: 560 }}>
            Tracez votre ligne de toit sur l'image satellite. Vous voyez le prix tout de suite —
            installation, entretien pendant la saison, retrait en janvier et entreposage compris.
          </p>
          <p style={{ color: "rgba(243,233,210,0.7)", fontSize: 15, marginBottom: 26, maxWidth: 560 }}>
            Colonnes, arbres et arbustes s'évaluent sur place : ils ne changent pas le prix affiché.
          </p>
          <div style={{ display: "grid", gap: 10, color: "rgba(243,233,210,0.85)", fontSize: 16 }}>
            <a href={company.phoneHref} style={{ color: "#E9DCC0", textDecoration: "none", fontWeight: 700 }}>
              {company.phoneDisplay}
            </a>
            <div style={{ color: "rgba(243,233,210,0.6)" }}>{company.region}</div>
          </div>
        </div>
        <div style={{ paddingBottom: 24 }}>
          <CalculatriceToiture />
        </div>
      </div>
    </section>
  );
}
