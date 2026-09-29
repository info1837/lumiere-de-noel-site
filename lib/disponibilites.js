// Les dates qui restent — lues dans le CRM, jamais inventées.
//
// ⚠️ LECTURE CÔTÉ SERVEUR, obligatoirement.
//
// Deux raisons, et aucune n'est un choix de style :
//   1. La route du CRM n'autorise en CORS que le domaine d'Operatr. Un
//      fetch depuis le navigateur du visiteur serait bloqué, et le
//      bandeau ne s'afficherait jamais — sans erreur visible.
//   2. Un fetch serveur avec `revalidate` donne le rafraîchissement
//      horaire demandé sans frapper le CRM à chaque visiteur.
//
// ⚠️ SI LA ROUTE NE RÉPOND PAS, ON NE DEVINE PAS.
// Pas de nombre de repli, pas de « quelques dates ». On rend null, et le
// bandeau ne s'affiche pas du tout. Une promesse de rareté fausse se
// retourne contre le reste de la page, y compris contre le prix.

// L'adresse est surchargeable pour pouvoir VOIR le bandeau rendu dans un
// navigateur : en production la capacité n'est pas encore configurée, donc
// la route répond « rien à dire » et le bandeau n'existe pas. Sans cette
// variable, la seule chose vérifiable serait son absence.
const URL_DISPOS = process.env.CRM_DISPOS_URL
  || 'https://palencia-crm.vercel.app/api/public/lumiere/disponibilites';

/** Une heure, comme demandé. */
export const FRAICHEUR_SECONDES = 3600;

/**
 * Les disponibilités, ou null.
 *
 * Ne lève jamais : une page qui plante parce que le CRM tousse serait
 * pire que la même page sans bandeau.
 */
export async function lireDisponibilites() {
  try {
    const rep = await fetch(URL_DISPOS, {
      next: { revalidate: FRAICHEUR_SECONDES },
      // Le CRM peut être lent au réveil ; on ne bloque pas le rendu pour
      // un bandeau décoratif.
      signal: AbortSignal.timeout(4000),
    });
    if (!rep.ok) return null;
    const d = await rep.json();
    if (!d || d.ok !== true || !Array.isArray(d.mois)) return null;
    return d;
  } catch {
    return null;
  }
}

/**
 * Ce que le bandeau doit dire, ou null pour ne rien dire.
 *
 * Trois états, et un seul chiffre par état :
 *   · des dates restent      → « Novembre 2026 : 4 dates restantes »
 *   · tout est complet       → « Complet » + liste d'attente
 *   · réservations fermées   → on le dit, sans chiffre
 */
export function messageRarete(dispos) {
  if (!dispos?.ok) return null;

  const mois = (dispos.mois || []);
  const ouvert = mois.find((m) => m.restantes > 0) || null;
  const rabais = Number(dispos.rabais_octobre) || 0;
  const octobre = mois.find((m) => m.cle.endsWith('-10') && m.restantes > 0) || null;

  if (!dispos.reservations_ouvertes) {
    return {
      etat: 'ferme',
      texte: 'Réservations fermées pour la saison',
      complet: true,
      listeAttente: true,
      fermetureLe: dispos.reservations_fermees_le || null,
    };
  }

  if (!ouvert) {
    return {
      etat: 'complet',
      texte: 'Complet pour cette saison',
      complet: true,
      listeAttente: true,
      fermetureLe: dispos.reservations_fermees_le || null,
    };
  }

  const pluriel = ouvert.restantes === 1 ? 'date restante' : 'dates restantes';
  return {
    etat: 'ouvert',
    texte: `${ouvert.nom} : ${ouvert.restantes} ${pluriel}`,
    // Le rabais ne s'annonce que si octobre a ENCORE des dates. L'annoncer
    // sur un octobre complet serait une offre qu'on ne peut plus tenir.
    rabais: octobre && rabais > 0 ? `Octobre : −${rabais} %` : null,
    complet: false,
    listeAttente: false,
    restantes: ouvert.restantes,
    mois: ouvert.nom,
    fermetureLe: dispos.reservations_fermees_le || null,
  };
}

/** « 2026-11-20 » → « 20 novembre ». */
export function dateEnFrancais(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'][Number(m[2]) - 1];
  if (!mois) return null;
  return `${Number(m[3])} ${mois}`;
}
