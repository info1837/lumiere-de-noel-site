// Les outils communs à tout ce qui bouge sur le site.
//
// Trois règles tiennent tout le reste :
//
//   1. RIEN NE SE DÉPLACE POUR QUI L'A DEMANDÉ. `prefers-reduced-motion:
//      reduce` n'est pas un réglage de confort : c'est une consigne
//      médicale pour une partie des visiteurs. Ce qu'elle proscrit, c'est
//      le DÉPLACEMENT — glissement, zoom, balayage, défilement automatique.
//      Un fondu d'opacité ne déplace rien : il reste (300 ms), sinon le
//      site paraît mort à quiconque a coché « Réduire les animations ».
//      Le tri se fait dans la feuille, sous `@media
//      (prefers-reduced-motion: reduce)` — une seule source de vérité.
//
//   2. LE CONTENU NE DÉPEND JAMAIS DE JAVASCRIPT POUR ÊTRE VISIBLE.
//      L'état masqué est posé par JS (classe sur <html>), donc sans JS
//      la page s'affiche entière. C'est l'inverse qui est courant, et
//      c'est l'inverse qui casse.
//
//   3. ON N'ANIME QUE transform / opacity / filter / clip-path.
//      Tout le reste fait recalculer la mise en page à chaque image —
//      et fait sauter le CLS, qu'on veut à zéro.

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
 * ⚠️ Sans elle, aucune règle `.reveal--*` ne s'applique. C'est la
 * garantie de la règle 2 : si le JS ne tourne pas (erreur, bloqueur,
 * réseau coupé en plein chargement), la classe n'est jamais posée et
 * tout le contenu reste visible. Un site dont le texte dépend d'un
 * script pour exister est un site qui disparaît un jour sans prévenir.
 */
export const CLASSE_RACINE = 'mvt';

/**
 * Un abonnement au défilement, limité à une image par frame.
 *
 * `scroll` se déclenche beaucoup plus souvent que l'écran ne se
 * rafraîchit. Sans ce garde-fou, on calcule dix fois pour afficher une
 * fois — et sur un téléphone, ça se sent tout de suite.
 *
 * @param {(y:number) => void} auDefilement
 * @returns {() => void} pour se désabonner
 */
export function surDefilement(auDefilement) {
  if (typeof window === 'undefined') return () => {};
  let enAttente = false;
  const tick = () => {
    enAttente = false;
    auDefilement(window.scrollY || window.pageYOffset || 0);
  };
  const ecouter = () => {
    if (enAttente) return;
    enAttente = true;
    requestAnimationFrame(tick);
  };
  window.addEventListener('scroll', ecouter, { passive: true });
  window.addEventListener('resize', ecouter, { passive: true });
  ecouter(); // une première mesure, sans attendre un geste
  return () => {
    window.removeEventListener('scroll', ecouter);
    window.removeEventListener('resize', ecouter);
  };
}

/** Borne une valeur entre deux limites. */
export const borner = (v, min, max) => Math.min(max, Math.max(min, v));

/**
 * La progression d'un élément à travers l'écran, de 0 à 1.
 *
 * 0 quand son haut touche le bas de l'écran, 1 quand son bas touche le
 * haut. C'est la mesure qui sert à « piloter » une animation au
 * défilement plutôt qu'à la déclencher.
 */
export function progressionDansEcran(el, { debut = 0, fin = 1 } = {}) {
  const r = el.getBoundingClientRect();
  const h = window.innerHeight || 1;
  // 0 → l'élément arrive par le bas ; 1 → il sort par le haut.
  const brut = (h - r.top) / (h + r.height);
  const plage = Math.max(0.0001, fin - debut);
  return borner((brut - debut) / plage, 0, 1);
}
