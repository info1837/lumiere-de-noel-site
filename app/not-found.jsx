import Link from "next/link";
import { CTAButton } from "@/components/ui";
import { company, navy, ivory, gold } from "@/components/data";

export const metadata = {
  title: "Page introuvable",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <section style={{
      background: navy, minHeight: "78vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 24px 80px",
    }}>
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(4rem, 14vw, 9rem)",
        color: gold, lineHeight: 1, letterSpacing: "0.04em",
      }}>
        Oups !
      </div>
      <h1 style={{ color: ivory, marginTop: 14 }}>Cette page n'existe pas</h1>
      <p style={{ color: "rgba(243,233,210,0.8)", fontSize: 18, margin: "16px auto 30px", maxWidth: 460 }}>
        Mais on peut quand même illuminer votre propriété. 🎄
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
        <CTAButton href="/soumission" variant="gold">Soumission gratuite</CTAButton>
        <CTAButton href="/" variant="outlineLight">Retour à l'accueil</CTAButton>
      </div>
      <p style={{ marginTop: 28 }}>
        <a href={company.phoneHref || undefined} style={{ color: gold, textDecoration: "none", fontWeight: 700 }}>
          Ou appelez-nous : {company.phoneDisplay}
        </a>
      </p>
    </section>
  );
}
