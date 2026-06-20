import Link from "next/link";
import { SectionTag, SectionTitle, CTAButton, Breadcrumb } from "@/components/ui";
import { BreadcrumbJsonLd } from "@/components/jsonld";
import { services, navy, offWhite, ivory, gold, charcoal, goldText } from "@/components/data";

export const metadata = {
  title: "Nos services",
  description:
    "Tous nos services au Québec : installation de lumières de Noël résidentielles, commerciales et municipales, ainsi qu'éclairage architectural permanent DEL. Service clé en main.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Nos services | Lumière de Noël inc.",
    description:
      "Lumières de Noël résidentielles, commerciales et municipales + éclairage architectural permanent. Service clé en main, retrait inclus.",
    url: "/services",
    images: ["/images/hero-accueil.jpg"],
  },
};

export default function ServicesIndex() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", url: "/" },
          { name: "Services", url: "/services" },
        ]}
      />

      <section className="snowy" style={{ background: navy, paddingTop: 140 }}>
        <div className="container">
          <Breadcrumb dark items={[{ name: "Accueil", href: "/" }, { name: "Services" }]} />
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <SectionTag dark>Nos services</SectionTag>
            <h1 style={{ color: ivory, marginBottom: 18 }}>Un seul fournisseur pour tout</h1>
            <p style={{ color: "rgba(243,233,210,0.82)", fontSize: 19, margin: "0 auto", maxWidth: 700 }}>
              Lumières de Noël (résidentiel, commercial, municipal) et éclairage architectural permanent —
              tout est conçu, installé, entretenu et retiré par notre équipe.
            </p>
          </div>

          <div className="grid-2" style={{ gap: 24 }}>
            {services.map((s) => (
              <Link key={s.slug} href={`/services/${s.slug}`} className="glow-card" style={{
                display: "block", textDecoration: "none",
                background: "#10202f", borderRadius: 16, overflow: "hidden",
                border: "1px solid rgba(233,220,192,0.16)",
              }}>
                <div style={{ aspectRatio: "16 / 9", background: "#0b1b2b" }}>
                  <img src={s.heroImage} alt={s.heroImageAlt} loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ padding: 26 }}>
                  <div style={{ color: gold, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>
                    {s.kicker}
                  </div>
                  <h2 style={{ color: ivory, marginBottom: 10, fontSize: 28 }}>{s.title}</h2>
                  <p style={{ color: "rgba(243,233,210,0.7)", fontSize: 15, marginBottom: 14 }}>{s.intro}</p>
                  <div style={{ color: gold, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Voir le service →
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 48 }}>
            <CTAButton href="/soumission" variant="gold">Soumission gratuite</CTAButton>
          </div>
        </div>
      </section>
    </>
  );
}
