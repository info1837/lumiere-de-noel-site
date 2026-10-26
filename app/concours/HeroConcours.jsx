import RevelationLumiere from "@/components/RevelationLumiere";
import { paireAvantApres } from "@/components/photos";
import { VILLES_CONCOURS, TIRAGE_COURT } from "@/lib/concours";

// Le haut de /concours : la maison de Léry, avant / après, sous le titre.
//
// ⚠️ LES TEXTES SONT PAR-DESSUS LE CURSEUR, MAIS LE DOIGT PASSE À TRAVERS.
// Les deux voiles (haut : titre ; bas : bouton) sont en `pointer-events:
// none` : un glisser commencé sur le titre déplace quand même la couture.
// Seul le bouton reprend les clics.
//
// ⚠️ L'« AVANT » EST UNE SIMULATION et l'étiquette le dit (même paire et
// mêmes étiquettes que l'accueil) : c'est la vraie photo de Léry, lumières
// retirées. Le côté « Après » est la photographie du chantier.
export default function HeroConcours() {
  const paire = paireAvantApres("avant-lery");
  return (
    <section className="concours-hero" aria-labelledby="concours-titre" data-sans-apparition>
      <RevelationLumiere
        photo={paire.apres}
        photoAvant={paire.avant}
        etiquetteAvant="Avant (simulation)"
        etiquetteApres="Après · réel, Léry"
        altAvant="Une grande maison le soir, sans aucune lumière de Noël — simulation"
        altApres="La même maison avec l'installation réelle de lumières de Noël, à Léry"
        hauteur="var(--concours-hero-h)"
        tailles="100vw"
        prioritaire
        pilote={false}
        depart={50}
      />
      <div className="concours-hero__haut">
        <p className="concours-hero__kicker">Concours 2026</p>
        <h1 id="concours-titre" className="concours-hero__titre">
          Ça pourrait être votre maison, gratuitement cet hiver!
        </h1>
        <p className="concours-hero__sous">
          {VILLES_CONCOURS.join(" · ")} — Tirage le {TIRAGE_COURT}
        </p>
      </div>
      <div className="concours-hero__bas">
        <a href="#participer" className="concours-bouton">Je participe</a>
        <span className="concours-hero__indice" aria-hidden="true">← Glissez pour illuminer →</span>
      </div>
    </section>
  );
}
