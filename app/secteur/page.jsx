import Link from "next/link";
import { SectionTag, CTAButton, Breadcrumb } from "@/components/ui";
import { BreadcrumbJsonLd } from "@/components/jsonld";
import { cities, inCity, navy, ivory, gold } from "@/components/data";
import { PHOTOS } from "@/components/photos";

export const metadata = {
  title: "Zones desservies — Grand Montréal",
  description:
    "Installation de lumières de Noël et d'éclairage architectural dans le Grand Montréal — Blainville, Terrebonne, Saint-Jérôme, Laval, Montréal et Rive-Sud.",
  alternates: { canonical: "/secteur" },
  openGraph: {
    title: "Zones desservies | Solution Lumière de Noël inc.",
    description: "Service complet dans le Grand Montréal — couronne nord, Laval, Montréal et Rive-Sud.",
    url: "/secteur",
    images: [PHOTOS["blainville-01"].src],
  },
};

export default function SecteurIndex() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", url: "/" },
          { name: "Zones desservies", url: "/secteur" },
        ]}
      />

      <section className="snowy" style={{ background: navy, paddingTop: 140 }}>
        <div className="container">
          <Breadcrumb dark items={[{ name: "Accueil", href: "/" }, { name: "Zones desservies" }]} />
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <SectionTag dark>Zones desservies</SectionTag>
            <h1 style={{ color: ivory, marginBottom: 18 }}>Du Grand Montréal aux Laurentides</h1>
            <p style={{ color: "rgba(243,233,210,0.82)", fontSize: 19, margin: "0 auto", maxWidth: 700 }}>
              Couronne nord, Laval, Île de Montréal, Rive-Sud — notre territoire couvre la grande région
              de Montréal. Votre ville n'est pas listée ? Appelez-nous, on dessert un large territoire.
            </p>
          </div>

          <div className="grid-3" style={{ gap: 22 }}>
            {cities.map((c) => (
              <Link key={c.slug} href={`/secteur/${c.slug}`} className="glow-card" style={{
                display: "block", textDecoration: "none",
                background: "#10202f", borderRadius: 16, overflow: "hidden",
                border: "1px solid rgba(233,220,192,0.16)",
              }}>
                <div style={{ aspectRatio: "4 / 3", background: "#0b1b2b" }}>
                  {c.image && <img src={c.image} alt={c.imageAlt} loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <div style={{ padding: 22 }}>
                  <div style={{ color: gold, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>
                    {c.regionLabel}
                  </div>
                  <h2 style={{ color: ivory, marginBottom: 8, fontSize: 26 }}>Lumières de Noël {inCity(c.name)}</h2>
                  <div style={{ color: gold, fontSize: 13, fontWeight: 700, marginTop: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Voir les détails →
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
