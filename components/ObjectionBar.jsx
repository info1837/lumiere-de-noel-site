import Link from "next/link";
import { company, navy } from "@/components/data";
// Fiche Google de PALENCIA SERVICES EXTÉRIEUR, pas de Lumière de Noël.
// Elle est définie ici et NON dans components/reviews.js : ce fichier-là
// décrit les avis de Solution Lumière de Noël (encore vides), et y mettre
// la fiche de Palencia ferait passer ses 100+ avis pour ceux de Lumière
// dans le JSON-LD et le bloc témoignages. La carte, elle, dit noir sur
// blanc à qui ils appartiennent.
const AVIS_PALENCIA_URL =
  "https://www.google.com/maps/place/?q=place_id:ChIJmbIPyln3rKoR21twSo9uBis";

// =============================================================================
// Les quatre cartes de confiance — chevauchant le bas du hero
// =============================================================================
// POURQUOI ELLES EXISTENT
// Un visiteur qui n'appelle pas ne se dit pas « c'est laid ». Il se dit : ça
// coûte combien ? qui sont ces gens ? qu'est-ce qui arrive si une ampoule
// brûle ? est-ce que je remonte dans l'échelle en janvier ? Quatre questions,
// quatre réponses, avant qu'il ait à chercher.
//
// RÈGLE DE CONTENU — NE PAS L'ASSOUPLIR
// Chaque carte ne dit que ce qui est déjà vrai et déjà publié ailleurs sur le
// site. La formulation de la garantie est reprise MOT POUR MOT de data.js
// (« Rappels sans frais et illimités, de la pose au retrait ») : elle ne doit
// jamais être élargie. Les 100+ avis sont ceux de Palencia Services Extérieur
// — c'est écrit sur la carte, en toutes lettres, parce que les attribuer à
// Lumière de Noël serait faux. Aucune mention d'assurance ici tant que la
// police n'est pas active — voir les marqueurs // ASSURANCE dans le dépôt.
// =============================================================================

const CARTES = [
  {
    badge: [{ t: "100+" }, { t: "AVIS", or: false }],
    badgeSuffixe: { t: "5 ★", or: true },
    sous: "Par l'équipe de Palencia Services Extérieur",
    phrase: "Même équipe, même standard depuis 2023 sur la Rive-Nord.",
    lien: "Voir les avis",
    href: AVIS_PALENCIA_URL,
    externe: true,
  },
  {
    badge: [{ t: "Dès" }, { t: company.priceFrom, or: true }],
    sous: "Prix ferme, écrit avant l'installation",
    phrase: "Aucune surprise en janvier.",
    lien: "Calculer mon prix",
    href: "/calculatrice",
  },
  {
    badge: [{ t: "Tout" }, { t: "inclus" }],
    sous: "Pose · entretien · retrait · entreposage",
    phrase: "Un seul prix, de la pose au rangement.",
    lien: "Ce qui est compris",
    href: "/#inclus",
  },
  {
    badge: [{ t: "0 $", or: true }, { t: "Rappels" }],
    sous: "Illimités, de la pose au retrait",
    phrase: "Une ampoule brûlée, une section décrochée : on repasse.",
    lien: "Comment ça marche",
    href: "/#processus",
  },
];

function Badge({ mots, suffixe }) {
  return (
    <div className="trust-badge">
      {mots.map((m, i) => (
        <span key={i} className={m.or ? "trust-badge-or" : undefined}>{m.t}{i < mots.length - 1 ? " " : ""}</span>
      ))}
      {suffixe && <span className="trust-badge-suffixe trust-badge-or">{suffixe.t}</span>}
    </div>
  );
}

export default function ObjectionBar() {
  return (
    <section aria-label="Ce qui est compris" className="trust-section" style={{ background: navy }}>
      <div className="trust-container">
        <ul className="trust-grid">
          {CARTES.map((c) => (
            <li key={c.sous}>
              <article className="trust-card">
                <Badge mots={c.badge} suffixe={c.badgeSuffixe} />
                <p className="trust-sous">{c.sous}</p>
                <p className="trust-phrase">{c.phrase}</p>
                {c.externe ? (
                  <a className="trust-pill" href={c.href} target="_blank" rel="noopener noreferrer">{c.lien}</a>
                ) : (
                  <Link className="trust-pill" href={c.href}>{c.lien}</Link>
                )}
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
