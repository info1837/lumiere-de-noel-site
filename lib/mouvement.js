// Les outils communs à tout ce qui bouge sur le site.
//
// Les règles (passe « effets sobres », 2026-10-26) :
//
//   1. LE DÉFILEMENT EST CELUI DU NAVIGATEUR. Aucun smooth-scroll en JS,
//      aucun scroll-snap, aucun parallaxe, et plus rien n'est piloté par
//      le défilement (le comparateur et la frise l'étaient).
//
//   2. RIEN NE BOUGE POUR QUI L'A DEMANDÉ. `prefers-reduced-motion:
//      reduce` = aucune animation, pas même un fondu. Le garde est ici
//      (`mouvementReduit`) et dans la feuille (un bloc global à la fin de
//      globals.css).
//
//   3. LE CONTENU NE DÉPEND JAMAIS DE JAVASCRIPT POUR ÊTRE VISIBLE.
//      L'état masqué n'existe que sous `html.mvt`, classe posée par JS :
//      sans JS, ou s'il tarde, la page s'affiche entière.
//
//   4. ON N'ANIME QUE transform / opacity. Tout le reste fait recalculer
//      la mise en page ou repeindre à chaque image.

/** Le visiteur a-t-il demandé qu'on arrête de bouger ? */
export function mouvementReduit() {
  if (typeof window === 'undefined') return true;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * La classe qui AUTORISE les états masqués.
 *
 * ⚠️ Sans elle, aucune règle `.rv` ne s'applique. Si le JS ne tourne pas
 * (erreur, bloqueur, réseau coupé en plein chargement), la classe n'est
 * jamais posée et tout le contenu reste visible.
 */
export const CLASSE_RACINE = 'mvt';
