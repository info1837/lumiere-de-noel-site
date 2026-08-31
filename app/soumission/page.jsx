import Link from "next/link";
import QuoteForm from "@/components/QuoteForm";
import Testimonials from "@/components/Testimonials";
import { SectionTag } from "@/components/ui";
import { company, homePortfolio, navy, ivory, gold, offWhite, charcoal } from "@/components/data";
import { PHOTOS } from "@/components/photos";

export const metadata = {
  title: "Soumission gratuite",
  description:
    "Demandez votre soumission gratuite pour l'installation de lumières de Noël ou d'éclairage architectural permanent au Québec. Réponse en moins de 24 h, sans obligation.",
  alternates: { canonical: "/soumission" },
  openGraph: {
    title: "Soumission gratuite | Solution Lumière de Noël inc.",
    description: "Estimation gratuite et sans obligation pour vos lumières de Noël ou votre éclairage permanent.",
    url: "/soumission",
    images: [PHOTOS["blainville-01"].src],
  },
};

// Colonne de gauche — mini-étapes après l'envoi (réduit le doute).
const nextSteps = [
  { n: "01", title: "Réponse sous 24 h", body: "On confirme la réception et on prend rendez-vous pour la visite." },
  { n: "02", title: "Visite d'évaluation", body: "On mesure la propriété, on comprend votre vision, on chiffre." },
  { n: "03", title: "Soumission ferme", body: "Prix écrit, sans surprise. Vous décidez si vous allez de l'avant." },
];

export default function Soumission() {
  // 2 photos représentatives (Rive-Nord + Rive-Sud) pour la colonne de gauche.
  const leftPhotos = [homePortfolio[0], homePortfolio[2]];

  return (
    <>
      <section className="snowy" style={{ background: navy, paddingTop: 140 }}>
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div>
            <SectionTag dark>Soumission</SectionTag>
            {/* Le client de l'an dernier n'a pas besoin d'une soumission : il a
                besoin d'une date. Chemin le plus court vers la vente la plus
                rentable de la saison. */}
            <div style={{ marginBottom: 16 }}>
              <Link href="/renouvellement" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "8px 14px", borderRadius: 300,
                background: "rgba(233,220,192,0.14)",
                border: "1px solid rgba(233,220,192,0.4)",
                color: gold, textDecoration: "none",
                fontSize: 13, fontWeight: 700, letterSpacing: "0.04em",
              }}>
                Vous étiez client l'an dernier ? Réservez votre date →
              </Link>
            </div>
            <h1 style={{ color: ivory, marginBottom: 18 }}>Demande de soumission</h1>
            <p style={{ color: "rgba(243,233,210,0.86)", fontSize: 19, marginBottom: 20 }}>
              Décrivez votre projet — on vous rappelle en moins de 24 h avec une estimation claire,
              gratuite et sans obligation.
            </p>

            {/* Rappel garantie — argument de réassurance sur la page de conversion */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "10px 16px", borderRadius: 10,
              background: "rgba(233,220,192,0.10)",
              border: "1px solid rgba(233,220,192,0.28)",
              color: gold, fontSize: 14, fontWeight: 700, marginBottom: 26,
            }}>
              <span aria-hidden="true">✓</span>
              Ampoule brûlée ou section tombée ? On repasse sans frais, autant de fois qu'il le faut — de la pose au retrait.
            </div>

            <div style={{ display: "grid", gap: 14, color: "rgba(243,233,210,0.85)", fontSize: 16, marginBottom: 34 }}>
              <a href={company.phoneHref} style={{ color: gold, textDecoration: "none", fontWeight: 700, fontSize: 22, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em" }}>
                {company.phoneDisplay}
              </a>
              <a href={company.emailHref} style={{ color: "rgba(243,233,210,0.85)", textDecoration: "none" }}>
                {company.email}
              </a>
              <div style={{ color: "rgba(243,233,210,0.6)" }}>{company.region}</div>
            </div>

            {/* 2 photos de réalisations — preuve visuelle tout de suite à côté du formulaire */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 30,
            }}>
              {leftPhotos.map((it, i) => (
                <figure key={i} style={{
                  position: "relative", borderRadius: 12, overflow: "hidden",
                  aspectRatio: "4 / 3", margin: 0,
                  border: "1px solid rgba(233,220,192,0.16)",
                }}>
                  <img src={it.image} alt={it.alt} loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {it.caption && (
                    <figcaption style={{
                      position: "absolute", left: 0, right: 0, bottom: 0,
                      padding: "20px 12px 8px",
                      background: "linear-gradient(to top, rgba(6,18,31,0.85), transparent)",
                      color: ivory, fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 16, letterSpacing: "0.04em",
                    }}>{it.caption}</figcaption>
                  )}
                </figure>
              ))}
            </div>

            {/* Ce qui se passe ensuite — mini-parcours de 3 étapes */}
            <div>
              <div style={{
                fontSize: 12, fontWeight: 700, letterSpacing: "0.2em",
                textTransform: "uppercase", color: gold, marginBottom: 14,
              }}>
                Ce qui se passe ensuite
              </div>
              <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
                {nextSteps.map((s) => (
                  <li key={s.n} style={{
                    display: "grid", gridTemplateColumns: "auto 1fr", gap: 14,
                    padding: "14px 16px", borderRadius: 10,
                    background: "rgba(233,220,192,0.06)",
                    border: "1px solid rgba(233,220,192,0.14)",
                  }}>
                    <div aria-hidden="true" style={{
                      width: 36, height: 36, borderRadius: "50%", background: gold, color: charcoal,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "'Bebas Neue', sans-serif", fontSize: 17, fontWeight: 700, letterSpacing: "0.04em",
                    }}>{s.n}</div>
                    <div>
                      <div style={{ color: ivory, fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{s.title}</div>
                      <div style={{ color: "rgba(243,233,210,0.7)", fontSize: 14 }}>{s.body}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div style={{ paddingBottom: 24 }}>
            <QuoteForm />
          </div>
        </div>
      </section>

      {/* Témoignages — invisible tant que REVIEWS_PENDING = true dans reviews.js */}
      <Testimonials limit={6} variant="light" />
    </>
  );
}
