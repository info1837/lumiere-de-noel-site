import Link from "next/link";
import { navy, ivory, gold, company } from "@/components/data";

// Règlement officiel du concours « Gagnez votre installation 2026 ».
// Lien obligatoire depuis le formulaire de la publicité Meta (Facebook /
// Instagram). Même gabarit que /confidentialite.
//
// ⚠️ Règlement fourni par l'organisateur le 2026-10-25 (aligné sur la
//    vidéo de la pub) : fin des inscriptions jeudi 5 novembre 2026, 23 h 59
//    (HE), tirage vendredi 6 novembre 2026 en direct sur Instagram, prix
//    jusqu'à 1 000 $, 4 villes, 15 % sur une réservation faite avant le
//    6 novembre 2026. Section RACJ retirée à la demande de l'organisateur.
//    Jamais de prix au pied linéaire ici.
const DESCRIPTION =
  "Règlement officiel du concours « Gagnez votre installation 2026 » de Solution Lumière de Noël inc. : admissibilité, prix, tirage du 6 novembre 2026.";

export const metadata = {
  title: "Règlement du concours — Gagnez votre installation 2026",
  description: DESCRIPTION,
  alternates: { canonical: "/concours" },
  openGraph: {
    type: "article",
    title: "Règlement du concours — Gagnez votre installation 2026 | Solution Lumière de Noël",
    description: DESCRIPTION,
    url: "/concours",
  },
};

const lien = { color: "#F0BA54", fontWeight: 600 };

const SECTIONS = [
  {
    t: "1. Organisateur",
    p: [
      <>
        Le concours « Gagnez votre installation 2026 » (le « concours ») est organisé par {company.name} (l'«
        organisateur »), entreprise établie à Blainville, au Québec. Téléphone :{" "}
        <a href={company.phoneHref} style={lien}>{company.phoneDisplay}</a> — courriel :{" "}
        <a href={company.emailHref} style={lien}>{company.email}</a>.
      </>,
    ],
  },
  {
    t: "2. Durée du concours",
    p: [
      "Les inscriptions sont acceptées jusqu'au jeudi 5 novembre 2026 à 23 h 59 (heure de l'Est). Toute participation reçue après cette heure n'est pas admissible.",
      "Le tirage aura lieu le vendredi 6 novembre 2026, en direct sur Instagram.",
    ],
  },
  {
    t: "3. Admissibilité",
    p: [
      "Le concours s'adresse aux résidents de Blainville, Sainte-Thérèse, Rosemère et Boisbriand, âgés de 18 ans et plus, propriétaires de la résidence inscrite ou ayant l'accord du propriétaire.",
      "Sont exclus les employés de l'organisateur et les personnes de leur foyer.",
    ],
  },
  {
    t: "4. Comment participer",
    p: [
      "Pour participer, remplissez le formulaire d'inscription accessible depuis la publicité du concours sur Facebook ou Instagram (Meta), en fournissant des renseignements exacts et complets.",
      "Aucun achat requis. Une seule participation par adresse; les participations en double sont annulées.",
      "Réserver une installation, ou non, n'influence pas les chances de gagner.",
    ],
  },
  {
    t: "5. Prix",
    p: [
      "Un (1) prix est offert : une installation de lumières de Noël sur la ligne de toit, d'une valeur pouvant atteindre 1 000 $ (jusqu'à 100 pieds), installée avant le 20 novembre 2026.",
      "L'entretien, le démontage et l'entreposage sont inclus.",
      "Le prix n'est pas échangeable en argent, n'est pas transférable et doit être accepté tel quel.",
    ],
  },
  {
    t: "6. Tirage et chances de gagner",
    p: [
      "Le vendredi 6 novembre 2026, un tirage au hasard sera effectué en direct sur Instagram parmi toutes les participations admissibles reçues pendant la durée du concours.",
      "Les chances de gagner dépendent du nombre de participations admissibles reçues.",
    ],
  },
  {
    t: "7. Réclamation du prix",
    p: [
      "La personne sélectionnée sera contactée par téléphone au numéro fourni lors de l'inscription. Pour être déclarée gagnante, elle doit :",
      "a) répondre correctement, sans aide, à une question d'habileté mathématique; b) signer le formulaire de déclaration et d'exonération de responsabilité transmis par l'organisateur; c) réclamer son prix dans les 7 jours suivant le premier contact.",
      "À défaut de respecter l'une de ces conditions, ou si la personne ne peut être jointe dans ce délai, elle perd son droit au prix et un nouveau tirage est effectué parmi les participations admissibles restantes.",
    ],
  },
  {
    t: "8. Rabais offert à tous les participants",
    p: [
      "Tous les participants obtiennent un rabais de 15 % sur une réservation faite avant le 6 novembre 2026.",
      "Si la personne gagnante a déjà réservé, la valeur du prix (jusqu'à 1 000 $) lui est remboursée.",
    ],
  },
  {
    t: "9. Renseignements personnels",
    p: [
      "Les renseignements recueillis servent à administrer le concours : vérifier l'admissibilité, effectuer le tirage, joindre la personne gagnante et appliquer le rabais aux participants.",
      "L'organisateur ne vous enverra des offres commerciales par message texte ou par courriel que si vous avez coché la case de consentement prévue à cet effet dans le formulaire. Vous pouvez vous désabonner en tout temps en répondant STOP à un message texte ou en cliquant sur le lien de désabonnement d'un courriel.",
      <>
        Pour en savoir plus, consultez notre{" "}
        <Link href="/confidentialite" style={lien}>politique de confidentialité</Link>.
      </>,
    ],
  },
  {
    t: "10. Facebook et Instagram",
    p: [
      "Ce concours n'est pas associé à Meta, Facebook ou Instagram.",
    ],
  },
];

export default function Concours() {
  return (
    // Pas de <main> ici : le layout en pose déjà un (un seul par page).
    <>
      <section style={{ background: navy, color: ivory, padding: "clamp(110px,14vw,150px) 24px 60px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: gold, marginBottom: 12 }}>
            Règlement officiel
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2.4rem,5vw,3.6rem)", lineHeight: 1.05, margin: 0 }}>
            Concours « Gagnez votre installation 2026 » — Règlement officiel
          </h1>
          <p style={{ marginTop: 14, opacity: 0.85, fontSize: 17 }}>
            Inscriptions jusqu'au jeudi 5 novembre 2026 à 23 h 59 (HE) · Tirage le vendredi 6 novembre 2026
          </p>
        </div>
      </section>

      <section style={{ background: "#060E18", padding: "clamp(48px,7vw,72px) 24px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          {SECTIONS.map((s) => (
            <div key={s.t} style={{ marginBottom: 34 }}>
              <h2 style={{ fontSize: "clamp(1.25rem,2.4vw,1.6rem)", color: ivory, marginBottom: 12 }}>{s.t}</h2>
              {s.placeholder && (
                <p
                  data-a-completer="racj"
                  style={{
                    background: "#FFF4D6", border: "2px dashed #C9962B", borderRadius: 10,
                    padding: "12px 16px", color: "#5C4410", fontWeight: 700,
                    fontSize: 15, lineHeight: 1.6, marginBottom: 12,
                  }}
                >
                  {s.placeholder}
                </p>
              )}
              {s.p.map((par, i) => (
                <p key={i} style={{ color: "rgba(240,234,222,0.8)", fontSize: 16, lineHeight: 1.8, marginBottom: 12 }}>{par}</p>
              ))}
            </div>
          ))}

          <div style={{ background: "#0F1E33", borderRadius: 16, padding: 24, border: "1px solid rgba(240,234,222,0.12)" }}>
            <div style={{ fontWeight: 700, marginBottom: 10, color: ivory }}>{company.name}</div>
            <div style={{ color: "rgba(240,234,222,0.8)", fontSize: 16, lineHeight: 1.9 }}>
              Blainville, Québec<br />
              <a href={company.phoneHref} style={{ color: "#F0BA54", fontWeight: 600 }}>{company.phoneDisplay}</a><br />
              <a href={company.emailHref} style={{ color: "#F0BA54", fontWeight: 600 }}>{company.email}</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
