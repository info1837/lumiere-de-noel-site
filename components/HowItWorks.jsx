import { SectionTag, SectionTitle } from "@/components/ui";
import { processSteps, navy, offWhite, ivory, gold, charcoal } from "@/components/data";

// Section « Comment ça marche » — 5 étapes datées.
// Sert à répondre à "qu'est-ce qui se passe après que j'envoie le formulaire ?"
// avant que le visiteur quitte la page. Rendue sur / et /services.
//
// Deux variantes visuelles :
//   variant="dark"  — cartes sur fond navy, pour intercaler entre sections
//                     sombres (défaut).
//   variant="light" — cartes claires sur fond off-white.
export default function HowItWorks({ variant = "dark", showTitle = true }) {
  // ── variant="ligne" : la frise de l'accueil ────────────────────────
  //
  // Cinq cartes pour dire « on vient, on pose, on retire » faisaient cinq
  // boîtes de 24 px de padding et presque un écran entier de défilement,
  // pour une information qui tient sur une ligne. Ici : un filet, cinq
  // points, cinq mots. Le détail de chaque étape vit sur /services, qui
  // garde les cartes.
  if (variant === "ligne") {
    return (
      <section style={{ background: navy }}>
        <div className="container">
          {showTitle && (
            <div style={{ textAlign: "center", marginBottom: 46 }}>
              <SectionTag dark>Le parcours</SectionTag>
              <SectionTitle light style={{ margin: "0 auto" }}>
                De la consultation au rangement, c&apos;est nous.
              </SectionTitle>
            </div>
          )}
          <ol className="frise">
            {processSteps.map((s) => (
              <li key={s.num} className="frise-etape">
                <span className="frise-point" aria-hidden="true" />
                <span className="frise-mot">{s.court || s.title}</span>
                <span className="frise-quand">{s.when}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  const dark = variant === "dark";
  const bg = dark ? navy : offWhite;
  const cardBg = dark ? "#10202f" : "#fff";
  const cardBorder = dark ? "1px solid rgba(233,220,192,0.16)" : "1px solid #ece5d6";
  const titleColor = dark ? ivory : charcoal;
  const bodyColor = dark ? "rgba(243,233,210,0.78)" : "#3a3a3a";
  const whenColor = dark ? gold : "#8a6a1c";

  return (
    <section className={dark ? "snowy" : undefined} style={{ background: bg }}>
      <div className="container">
        {showTitle && (
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            {/* « De la soumission à l'entreposage » commençait par un mot
                d'administration. Le nouveau titre nomme le PARCOURS, et il
                commence par la consultation design — la seule étape où le
                client rencontre quelqu'un qui conçoit quelque chose pour
                lui. C'est ça qu'on vend. */}
            {dark
              ? <SectionTag dark>Le parcours</SectionTag>
              : <SectionTag>Le parcours</SectionTag>}
            <SectionTitle light={dark} style={{ margin: "0 auto" }}>
              Consultation design → Installation → Entretien → Retrait
            </SectionTitle>
          </div>
        )}
        <ol style={{
          listStyle: "none", padding: 0, margin: 0,
          display: "grid", gap: 18,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}>
          {processSteps.map((s) => (
            <li key={s.num} style={{
              background: cardBg, borderRadius: 14, padding: "24px 22px",
              border: cardBorder,
              display: "flex", flexDirection: "column", gap: 10,
              boxShadow: dark ? "none" : "0 6px 18px rgba(11,27,43,0.06)",
            }}>
              <div aria-hidden="true" style={{
                width: 44, height: 44, borderRadius: "50%",
                background: gold, color: charcoal,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: "0.04em",
                fontWeight: 700,
              }}>{s.num}</div>
              <div style={{
                fontSize: 12, fontWeight: 700, letterSpacing: "0.18em",
                textTransform: "uppercase", color: whenColor,
              }}>
                {s.when}
              </div>
              <h3 style={{ color: titleColor, fontSize: 20, margin: 0 }}>{s.title}</h3>
              <p style={{ color: bodyColor, fontSize: 15, margin: 0 }}>{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
