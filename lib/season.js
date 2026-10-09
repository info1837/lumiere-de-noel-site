import { dateEnFrancais } from '@/lib/disponibilites';

// Les faits ÉDITORIAUX de la saison — et la SEULE façon de les écrire.
//
// ⚠️ CE FICHIER NE CONTIENT PAS LE NOMBRE DE PLACES.
//
// Les places restantes viennent du CRM (lib/disponibilites.js) et de nulle
// part ailleurs. Les figer ici donnerait un chiffre constant sur toutes les
// pages — ce qui réglerait l'incohérence en remplaçant un nombre vrai par un
// nombre faux. Le reste du dossier explique pourquoi on ne devine jamais ce
// chiffre : une rareté inventée, une fois repérée, fait douter du prix.
//
// Ce qu'on fixe ici, c'est ce qui est vraiment éditorial : le nom de la
// saison, et la FORME de la phrase. Avant, chaque surface composait la
// sienne — le bandeau écrivait « Octobre : 26 places restantes · Novembre :
// 34 places », le hero répétait la première moitié, et /simulateur affichait
// un instantané plus vieux d'une heure. Trois écritures du même fait, donc
// trois occasions de se contredire.
//
// Maintenant : une fonction, une phrase, lue partout.

/** La saison en cours. Le seul endroit où l'année est écrite. */
export const SAISON = {
  annee: 2026,
  label: 'Saison 2026',
};

/**
 * La ligne de saison, en segments — ou null quand il n'y a rien de vrai à
 * dire.
 *
 * « Saison 2026 · 26 places restantes · Réservations fermées le 20 novembre »
 *
 * Le nombre vient du CRM ; le label et l'ordre viennent d'ici. Une seule
 * fonction, donc le bandeau, le hero et /simulateur ne peuvent plus
 * s'écrire différemment.
 */
export function ligneSaison(rarete) {
  if (!rarete) return null;

  const segments = [SAISON.label];

  if (rarete.etat === 'ferme') {
    segments.push('Réservations fermées pour la saison');
  } else if (rarete.etat === 'complet') {
    segments.push('Complet pour cette saison');
  } else {
    // UN seul chiffre dans la ligne : celui du premier mois ouvert.
    // L'ancienne version listait tous les mois (« Octobre : 26 places
    // restantes · Novembre : 34 places ») et la barre faisait trois lignes
    // à 390 px. Le deuxième mois n'a jamais fait réserver personne.
    const n = rarete.restantes;
    if (typeof n === 'number' && n > 0) {
      segments.push(`${n} ${n === 1 ? 'place restante' : 'places restantes'}`);
    }
    // Le rabais, quand il existe, en UNE clause — pas trois pastilles.
    if (rarete.rabaisOctobre > 0 && rarete.mois) {
      segments.push(`${rarete.mois} : −${rarete.rabaisOctobre} %`);
    }
  }

  const fermeture = dateEnFrancais(rarete.fermetureLe);
  if (fermeture && rarete.etat !== 'ferme') {
    segments.push(`Réservations fermées le ${fermeture}`);
  }

  return segments.length > 1 ? segments : null;
}

/**
 * La même chose, en une chaîne. Pour les endroits qui n'ont pas de place
 * pour des segments (attributs, textes de secours).
 */
export function texteSaison(rarete) {
  const segs = ligneSaison(rarete);
  return segs ? segs.join(' · ') : null;
}
