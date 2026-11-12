import RevelationLumiere from "@/components/RevelationLumiere";
import { paireAvantApres } from "@/components/photos";
import Link from "next/link";
import { TIRAGE_TEXTE } from "@/lib/concours";

// Le haut de /concours : la maison de Léry, avant / après, sous le titre.
// Concours TERMINÉ (2026-11-11) : le titre le dit, le bouton mène à la
// réservation (plus de formulaire).
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
        <p className="concours-hero__kicker">Concours 2026 · terminé</p>
        <h1 id="concours-titre" className="concours-hero__titre">
          Le concours est terminé — merci d&apos;avoir participé!
        </h1>
        <p className="concours-hero__sous">
          Tirage fait le {TIRAGE_TEXTE}, en direct sur Instagram.
        </p>
      </div>
      <div className="concours-hero__bas">
        <Link href="/soumission" className="concours-bouton">Réserver ma date</Link>
        <span className="concours-hero__indice" aria-hidden="true">← Glissez pour illuminer →</span>
      </div>
    </section>
  );
}
