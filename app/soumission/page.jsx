import Link from "next/link";
import QuoteForm from "@/components/QuoteForm";
import { SectionTag } from "@/components/ui";
import { company, navy, ivory, gold } from "@/components/data";

export const metadata = {
  title: "Soumission gratuite",
  description:
    "Demandez votre soumission gratuite pour l'installation de lumières de Noël ou d'éclairage architectural permanent au Québec. Réponse rapide, sans obligation.",
  alternates: { canonical: "/soumission" },
  openGraph: {
    title: "Soumission gratuite | Lumière de Noël inc.",
    description: "Estimation gratuite et sans obligation pour vos lumières de Noël ou votre éclairage permanent.",
    url: "/soumission",
    images: ["/images/hero-accueil.jpg"],
  },
};

export default function Soumission() {
  return (
    <section className="snowy" style={{ background: navy, paddingTop: 140 }}>
      <div className="container grid-2" style={{ alignItems: "start" }}>
        <div>
          <SectionTag dark>Soumission</SectionTag>
          <div style={{ marginBottom: 16 }}>
            <Link
              href="/renouvellement"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "8px 14px", borderRadius: 300,
                background: "rgba(233,220,192,0.14)",
                border: "1px solid rgba(233,220,192,0.4)",
                color: gold, textDecoration: "none",
                fontSize: 13, fontWeight: 700, letterSpacing: "0.04em",
              }}
            >
              Client de l'an dernier ? Passez par le formulaire de renouvellement →
            </Link>
          </div>
          <h1 style={{ color: ivory, marginBottom: 18 }}>Demande de soumission</h1>
          <p style={{ color: "rgba(243,233,210,0.82)", fontSize: 19, marginBottom: 26 }}>
            Décrivez votre projet — on vous rappelle rapidement avec une estimation claire,
            gratuite et sans obligation.
          </p>
          <div style={{ display: "grid", gap: 14, color: "rgba(243,233,210,0.85)", fontSize: 16 }}>
            <a href={company.phoneHref} style={{ color: gold, textDecoration: "none", fontWeight: 700, fontSize: 22, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em" }}>
              {company.phoneDisplay}
            </a>
            <a href={company.emailHref} style={{ color: "rgba(243,233,210,0.85)", textDecoration: "none" }}>
              {company.email}
            </a>
            <div style={{ color: "rgba(243,233,210,0.6)" }}>{company.region}</div>
          </div>
        </div>
        <div style={{ paddingBottom: 24 }}>
          <QuoteForm />
        </div>
      </div>
    </section>
  );
}
