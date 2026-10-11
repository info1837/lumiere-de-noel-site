import Link from "next/link";
import { navy, ivory, gold, charcoal, offWhite, textMuted, company, cities } from "@/components/data";

// Règlement officiel du concours « Gagnez votre installation 2026 ».
// Lien obligatoire depuis le formulaire de la publicité Meta (Facebook /
// Instagram). Même gabarit que /confidentialite.
//
// ⚠️ Le texte DOIT rester aligné sur la config du concours dans le CRM :
//    fin des inscriptions 31 octobre 2026 23 h 59 (HE), tirage 1er novembre
//    2026, 15 % de rabais aux participants jusqu'au 15 novembre 2026.
//    Jamais de prix au pied linéaire ici. La ligne RACJ est un espace
//    réservé que l'organisateur remplit lui-même.
const DESCRIPTION =
  "Règlement officiel du concours « Gagnez votre installation 2026 » de Solution Lumière de Noël inc. : admissibilité, prix, tirage du 1er novembre 2026.";

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

const lien = { color: charcoal, fontWeight: 600 };
const villes = cities.map((c) => c.name);

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
      "Les inscriptions sont acceptées jusqu'au 31 octobre 2026 à 23 h 59 (heure de l'Est). Toute participation reçue après cette heure n'est pas admissible.",
      "Le tirage aura lieu le 1er novembre 2026.",
    ],
  },
  {
    t: "3. Admissibilité",
    p: [
      <>
        Le concours s'adresse aux résidents du Québec âgés de 18 ans et plus dont l'adresse de la propriété
        inscrite se trouve dans la zone desservie par l'organisateur ({company.region}, notamment{" "}
        {villes.join(", ")}). Voir la liste des{" "}
        <Link href="/secteur" style={lien}>zones desservies</Link>.
      </>,
      "Sont exclus les employés, représentants et mandataires de l'organisateur, ainsi que les personnes avec qui ils sont domiciliés.",
    ],
  },
  {
    t: "4. Comment participer",
    p: [
      "Pour participer, remplissez le formulaire d'inscription accessible depuis la publicité du concours sur Facebook ou Instagram (Meta), en fournissant des renseignements exacts et complets.",
      "Aucun achat requis. Une seule participation par adresse de propriété est acceptée; les participations en double sont annulées.",
    ],
  },
  {
    t: "5. Prix",
    p: [
      "Un (1) prix est offert : une installation de lumières de Noël d'une valeur pouvant atteindre 1 500 $.",
      "Le prix comprend l'installation pour la saison 2026, selon une conception standard établie par l'organisateur, ainsi que l'entretien et le retrait selon l'offre en vigueur. Toute portion de la valeur non utilisée n'est pas remboursable.",
      "Le prix n'est pas échangeable en argent, n'est pas transférable et doit être accepté tel quel.",
    ],
  },
  {
    t: "6. Tirage et chances de gagner",
    p: [
      "Le 1er novembre 2026, un tirage au hasard sera effectué parmi toutes les participations admissibles reçues pendant la durée du concours.",
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
      "Tous les participants admissibles reçoivent un rabais de 15 % sur une installation de lumières de Noël réservée au plus tard le 15 novembre 2026. Ce rabais n'est pas monnayable et ne peut être jumelé à aucune autre promotion.",
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
    t: "10. Régie des alcools, des courses et des jeux (Québec)",
    placeholder:
      "[À COMPLÉTER — Déclaration à la Régie des alcools, des courses et des jeux (RACJ) : numéro/mention à insérer par l'organisateur.]",
    p: [
      "Un différend quant à l'organisation ou à la conduite d'un concours publicitaire peut être soumis à la Régie des alcools, des courses et des jeux afin qu'il soit tranché. Un différend quant à l'attribution d'un prix peut être soumis à la Régie uniquement aux fins d'une intervention pour tenter de le régler.",
    ],
  },
  {
    t: "11. Facebook et Instagram",
    p: [
      "Ce concours n'est aucunement commandité, appuyé, administré ou associé à Facebook ou Instagram (Meta).",
    ],
  },
];

export default function Concours() {
  return (
    <main>
      <section style={{ background: navy, color: ivory, padding: "clamp(110px,14vw,150px) 24px 60px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: gold, marginBottom: 12 }}>
            Règlement officiel
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2.4rem,5vw,3.6rem)", lineHeight: 1.05, margin: 0 }}>
            Concours « Gagnez votre installation 2026 » — Règlement officiel
          </h1>
          <p style={{ marginTop: 14, opacity: 0.85, fontSize: 17 }}>
            Inscriptions jusqu'au 31 octobre 2026 à 23 h 59 (HE) · Tirage le 1er novembre 2026
          </p>
        </div>
      </section>

      <section style={{ background: offWhite, padding: "clamp(48px,7vw,72px) 24px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          {SECTIONS.map((s) => (
            <div key={s.t} style={{ marginBottom: 34 }}>
              <h2 style={{ fontSize: "clamp(1.25rem,2.4vw,1.6rem)", color: charcoal, marginBottom: 12 }}>{s.t}</h2>
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
                <p key={i} style={{ color: textMuted, fontSize: 16, lineHeight: 1.8, marginBottom: 12 }}>{par}</p>
              ))}
            </div>
          ))}

          <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e6e0d0" }}>
            <div style={{ fontWeight: 700, marginBottom: 10, color: charcoal }}>{company.name}</div>
            <div style={{ color: textMuted, fontSize: 16, lineHeight: 1.9 }}>
              Blainville, Québec<br />
              <a href={company.phoneHref} style={{ color: charcoal, fontWeight: 600 }}>{company.phoneDisplay}</a><br />
              <a href={company.emailHref} style={{ color: charcoal, fontWeight: 600 }}>{company.email}</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
