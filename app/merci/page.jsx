import Link from "next/link";
import Script from "next/script";
import { company, navy, ivory, gold, charcoal, offWhite } from "@/components/data";

// Page de remerciement — atterrissage post-envoi de formulaire.
// - Sert d'événement de conversion mesurable (GA4/Meta Pixel : /merci PageView).
// - Donne au visiteur une promesse claire ("Réponse en moins de 24 h") + les
//   prochaines étapes, ce qui réduit le doute juste après l'envoi.
export const metadata = {
  title: "Merci — nous vous répondons sous 24 h",
  description:
    "Votre demande est bien reçue. Un membre de l'équipe Solution Lumière de Noël inc. vous répond en moins de 24 h avec votre soumission gratuite.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/merci" },
};

const steps = [
  {
    n: "01",
    title: "Réponse en moins de 24 h",
    body: "On confirme la réception et on prend rendez-vous pour la visite d'évaluation — par téléphone ou courriel, selon votre préférence.",
  },
  {
    n: "02",
    title: "Visite d'évaluation gratuite",
    body: "On vient chez vous mesurer la propriété, comprendre votre vision et proposer un design personnalisé.",
  },
  {
    n: "03",
    title: "Soumission ferme, sans obligation",
    body: "Vous recevez un prix ferme, écrit — pas d'estimation vague. Vous décidez si vous allez de l'avant.",
  },
  {
    n: "04",
    title: "On réserve votre date",
    body: "Les dates de novembre partent en premier. Une fois votre date confirmée, on s'occupe de tout : matériel, installation, entretien, retrait et entreposage.",
  },
];

export default function MerciPage() {
  return (
    <>
      {/* Événement conversion — capté par n'importe quel outil (GA4, Vercel, Pixel)
          via le PageView natif ; on ajoute aussi un événement custom explicite. */}
      <Script id="merci-conversion" strategy="afterInteractive">
        {`
          if (typeof window !== 'undefined') {
            try {
              if (typeof window.fbq === 'function') { window.fbq('track', 'Lead'); }
              if (typeof window.gtag === 'function') { window.gtag('event', 'generate_lead'); }
              if (typeof window.va === 'function') { window.va('event', { name: 'lead_submitted' }); }
            } catch (e) { /* silent */ }
          }
        `}
      </Script>

      <section className="snowy" style={{ background: navy, paddingTop: 140, paddingBottom: 100 }}>
        <div className="container" style={{ textAlign: "center", maxWidth: 780 }}>
          <div style={{
            width: 76, height: 76, borderRadius: "50%",
            background: gold, color: charcoal,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 40, fontWeight: 700, marginBottom: 22,
            boxShadow: "0 10px 30px rgba(233,220,192,0.3)",
          }}>✓</div>
          <div style={{
            fontSize: 13, fontWeight: 700, letterSpacing: "0.2em",
            textTransform: "uppercase", color: "#E9DCC0", marginBottom: 16,
          }}>
            Demande reçue
          </div>
          <h1 style={{ color: ivory, marginBottom: 20 }}>
            Merci — on vous répond<br />en moins de 24 h
          </h1>
          <p style={{ color: "rgba(243,233,210,0.88)", fontSize: 19, margin: "0 auto 34px", maxWidth: 620 }}>
            Votre demande est bien arrivée. Un membre de l'équipe Solution Lumière de Noël inc.
            vous rappelle rapidement pour planifier votre visite d'évaluation
            gratuite — sans obligation.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
            <a href={company.phoneHref} style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "14px 26px", borderRadius: 300,
              background: gold, color: charcoal, textDecoration: "none",
              fontWeight: 700, fontSize: 16, letterSpacing: "0.03em",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24 11.36 11.36 0 0 0 3.57.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.57 1 1 0 0 1-.24 1.02z" />
              </svg>
              Ou appelez-nous : {company.phoneDisplay}
            </a>
          </div>
        </div>
      </section>

      <section style={{ background: offWhite }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, letterSpacing: "0.2em",
            textTransform: "uppercase", color: "#8a6a1c", marginBottom: 10, textAlign: "center",
          }}>
            Ce qui se passe ensuite
          </div>
          <h2 style={{ color: charcoal, textAlign: "center", marginBottom: 40 }}>
            4 étapes, une seule décision de votre part
          </h2>
          <ol style={{
            listStyle: "none", padding: 0, margin: 0,
            display: "grid", gap: 18,
          }}>
            {steps.map((s) => (
              <li key={s.n} style={{
                display: "grid", gridTemplateColumns: "auto 1fr", gap: 20,
                background: "#fff", borderRadius: 14, padding: "22px 24px",
                border: "1px solid #ece5d4",
                boxShadow: "0 6px 18px rgba(11,27,43,0.06)",
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: gold, color: charcoal,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontFamily: "'Bebas Neue', sans-serif", fontSize: 22,
                  letterSpacing: "0.04em",
                }}>{s.n}</div>
                <div>
                  <h3 style={{ color: charcoal, fontSize: 22, marginBottom: 6 }}>{s.title}</h3>
                  <p style={{ color: "#3a3a3a", margin: 0 }}>{s.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link href="/" style={{
              color: charcoal, textDecoration: "underline", fontWeight: 600, fontSize: 15,
            }}>
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
