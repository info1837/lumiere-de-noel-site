import Link from "next/link";
import { company, navy, gold, ivory } from "@/components/data";

// =============================================================================
// Barre des quatre objections — directement sous le hero
// =============================================================================
// POURQUOI ELLE EXISTE
// Un visiteur qui n'appelle pas ne se dit pas « c'est laid ». Il se dit : est-ce
// que je devrai remonter dans l'échelle en janvier ? qu'est-ce qui arrive si une
// ampoule brûle ? combien, à peu près ? est-ce qu'ils viennent chez moi ?
// Quatre questions, quatre réponses, avant qu'il ait à chercher.
//
// RÈGLE DE CONTENU — NE PAS L'ASSOUPLIR
// Chaque carte ne dit que ce qui est déjà vrai et déjà publié ailleurs sur le
// site. La formulation de la garantie est reprise MOT POUR MOT de data.js
// (« Rappels sans frais et illimités, de la pose au retrait ») : elle ne doit
// jamais être élargie. Aucune mention d'assurance ici tant que la police n'est
// pas active — voir les marqueurs // ASSURANCE dans le dépôt.
// =============================================================================

const CARTES = [
  {
    titre: "Tout inclus",
    detail: "Pose, entretien pendant la saison, retrait en janvier et entreposage — dans le même prix.",
    href: "/services",
    lien: "Ce qui est compris",
    icone: (
      <><path d="M20 7h-9L9 4H4a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1z" />
      <path d="M8 13l3 3 5-5" /></>
    ),
  },
  {
    // Formulation reprise telle quelle de data.js. Ne pas élargir.
    titre: "Rappels sans frais",
    detail: "Illimités, de la pose au retrait. Une ampoule brûlée ou une section décrochée, on repasse.",
    href: "/services",
    lien: "Comment ça marche",
    icone: (
      <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></>
    ),
  },
  {
    titre: `Dès ${company.priceFrom}`,
    detail: "Prix ferme et écrit avant qu'on installe quoi que ce soit. Aucune surprise en janvier.",
    href: "/calculatrice",
    lien: "Calculer mon prix",
    icone: (
      <><path d="M12 2v20" /><path d="M17 6.5c0-1.9-2.2-3-5-3s-5 1.1-5 3 2.2 2.8 5 3.3 5 1.4 5 3.4-2.2 3.3-5 3.3-5-1.4-5-3.3" /></>
    ),
  },
  {
    titre: "Rive-Sud, Montréal, Rive-Nord",
    detail: "On se déplace chez vous pour mesurer et confirmer le prix — la soumission est gratuite.",
    href: "/secteur",
    lien: "Voir les villes",
    icone: (
      <><path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.6" /></>
    ),
  },
];

export default function ObjectionBar() {
  return (
    <section aria-label="Ce qui est compris" style={{ background: navy, paddingTop: 0 }}>
      <div className="container">
        <ul className="objection-bar">
          {CARTES.map((c) => (
            <li key={c.titre}>
              <Link href={c.href} className="objection-card">
                <svg className="objection-icone" width="26" height="26" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                  aria-hidden="true">{c.icone}</svg>
                <h2 className="objection-titre">{c.titre}</h2>
                <p className="objection-detail">{c.detail}</p>
                <span className="objection-lien">
                  {c.lien}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
