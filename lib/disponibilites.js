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

/** La dernière installation de la saison (éditorial, dit par Yahir le 2026-11-08). */
export const SAISON_DERNIERE_INSTALLATION = '2026-12-12';

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

/** « Octobre 2026 » → « Octobre ». L'année n'apprend rien : on est dedans. */
export function moisSansAnnee(nom) {
  return String(nom || '').replace(/\s+\d{4}$/, '').trim() || null;
}

/**
 * Ce que le bandeau doit dire, ou null pour ne rien dire.
 *
 * ⚠️ PLUS DE COMPTEUR, PLUS D'ÉTAT « COMPLET » (2026-11-08, Yahir).
 *
 * Le compteur de la saison (`places_restantes`) affichait 20/20 et le site
 * basculait en « Complet » + liste d'attente alors que la saison ne l'était
 * pas. On ne montre plus de chiffre : la rareté dite est vraie sans en
 * inventer un — « Places limitées — dernières installations le 12 décembre ».
 * La date est éditoriale (lib/season.js) ; le CRM ne sert plus qu'à savoir
 * s'il répond (rien à dire quand il se tait) et à porter le rabais d'octobre.
 * Passé la dernière installation, la ligne disparaît d'elle-même.
 */
export function messageRarete(dispos, { maintenant = new Date() } = {}) {
  if (!dispos?.ok) return null;
  const derniere = SAISON_DERNIERE_INSTALLATION;
  if (maintenant.toISOString().slice(0, 10) > derniere) return null;

  const rabais = Number.isFinite(dispos.rabais_reservation) ? dispos.rabais_reservation : 0;
  const texte = `Places limitées — dernières installations le ${dateEnFrancais(derniere)}`;
  return {
    etat: 'ouvert',
    segments: [texte],
    texte,
    rabaisOctobre: rabais,
    derniereInstallation: derniere,
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
