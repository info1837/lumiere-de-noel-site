import { SectionTag, SectionTitle, Stars } from "@/components/ui";
import { reviews, REVIEWS_PENDING, aggregateRating, googleReviewUrl } from "@/components/reviews";
import { charcoal, offWhite, ivory, gold } from "@/components/data";

// Bloc témoignages — ne rend RIEN tant que REVIEWS_PENDING est true ou que
// le tableau reviews est vide. C'est volontaire : on ne veut pas de faux
// avis (Google et les visiteurs les repèrent).
//
// Props :
//   limit    — nombre d'avis à afficher (défaut 3, pour un rangée)
//   variant  — "light" (fond off-white, texte sombre) ou "dark" (fond navy)
//   showTitle — cacher le titre pour intégrer dans une autre section
export default function Testimonials({ limit = 3, variant = "light", showTitle = true }) {
  if (REVIEWS_PENDING || !reviews || reviews.length === 0) return null;

  const shown = reviews.slice(0, limit);
  const dark = variant === "dark";
  const bg = dark ? "#0b1b2b" : offWhite;
  const cardBg = dark ? "#10202f" : "#fff";
  const cardBorder = dark ? "1px solid rgba(233,220,192,0.16)" : "1px solid #ece5d6";
  const bodyColor = dark ? "rgba(243,233,210,0.86)" : "#2a2a2a";
  const authorColor = dark ? ivory : charcoal;

  return (
    <section style={{ background: bg }}>
      <div className="container">
        {showTitle && (
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            {dark ? <SectionTag dark>Ce qu'ils en disent</SectionTag> : <SectionTag>Ce qu'ils en disent</SectionTag>}
            <SectionTitle light={dark} style={{ margin: "0 auto" }}>
              De vrais clients, de vraies propriétés
            </SectionTitle>
            {aggregateRating && (
              <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 10, color: dark ? ivory : charcoal, fontWeight: 700 }}>
                <Stars size={18} />
                <span>{aggregateRating.value.toFixed(1)} · {aggregateRating.count} avis</span>
              </div>
            )}
          </div>
        )}
        <div style={{
          display: "grid", gap: 20,
          gridTemplateColumns: `repeat(auto-fit, minmax(260px, 1fr))`,
        }}>
          {shown.map((r, i) => (
            <figure key={i} style={{
              background: cardBg, borderRadius: 14, padding: 26,
              border: cardBorder,
              display: "flex", flexDirection: "column", gap: 14, margin: 0,
            }}>
              <Stars size={16} />
              <blockquote style={{ margin: 0, fontStyle: "italic", color: bodyColor, fontSize: 16, lineHeight: 1.6 }}>
                « {r.text} »
              </blockquote>
              <figcaption style={{ marginTop: "auto", color: authorColor, fontSize: 14, fontWeight: 700 }}>
                {r.name}
                {r.city && <span style={{ fontWeight: 500, color: dark ? "rgba(243,233,210,0.6)" : "#666" }}> · {r.city}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
        {googleReviewUrl && (
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <a href={googleReviewUrl} target="_blank" rel="noopener" style={{
              color: dark ? gold : "#8A6A1C",
              textDecoration: "none", fontWeight: 700, fontSize: 14,
              letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              Voir tous nos avis Google →
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
