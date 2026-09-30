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

/** « Octobre 2026 » → « Octobre ». L'année n'apprend rien : on est dedans. */
export function moisSansAnnee(nom) {
  return String(nom || '').replace(/\s+\d{4}$/, '').trim() || null;
}

/**
 * Ce que le bandeau doit dire, ou null pour ne rien dire.
 *
 * ⚠️ Le mot « Octobre » apparaissait DEUX FOIS — une fois dans le mois
 * annoncé, une fois dans la mention du rabais (« Octobre 2026 : 35 dates
 * restantes · Octobre : −15 % »). Le rabais est maintenant collé au mois
 * qui y a droit, là où il se lit comme une raison de choisir ce mois-là.
 *
 * Trois états, et un seul chiffre par mois :
 *   · des dates restent    → « Octobre : 35 dates restantes, −15 % ·
 *                             Novembre : 34 dates »
 *   · tout est complet     → « Complet » + liste d'attente
 *   · réservations fermées → on le dit, sans chiffre
 */
export function messageRarete(dispos) {
  if (!dispos?.ok) return null;

  const mois = (dispos.mois || []);
  const ouverts = mois.filter((m) => m.restantes > 0);
  const rabais = Number(dispos.rabais_octobre) || 0;

  if (!dispos.reservations_ouvertes) {
    return {
      etat: 'ferme',
      segments: ['Réservations fermées pour la saison'],
      texte: 'Réservations fermées pour la saison',
      complet: true, listeAttente: true,
      fermetureLe: dispos.reservations_fermees_le || null,
    };
  }

  if (!ouverts.length) {
    return {
      etat: 'complet',
      segments: ['Complet pour cette saison'],
      texte: 'Complet pour cette saison',
      complet: true, listeAttente: true,
      fermetureLe: dispos.reservations_fermees_le || null,
    };
  }

  // ⚠️ « PLACES », pas « dates ».
  //
  // Une date, c'est un jour du calendrier. Ce qu'on vend, c'est une place
  // dans la saison : un client peut occuper le 14 novembre sans que le
  // 14 novembre disparaisse pour tout le monde. « 35 dates restantes »
  // laissait croire qu'il restait 35 JOURS ouvrables — un visiteur qui
  // compte les jours de novembre trouve autre chose et doute du chiffre.
  const segments = ouverts.map((m, i) => {
    const nom = moisSansAnnee(m.nom);
    // Le PREMIER mois porte « places restantes » en toutes lettres ; les
    // suivants disent juste « places ». Répéter « restantes » allonge la
    // ligne sans rien ajouter.
    const unite = i === 0
      ? `${m.restantes} ${m.restantes === 1 ? 'place restante' : 'places restantes'}`
      : `${m.restantes} ${m.restantes === 1 ? 'place' : 'places'}`;
    // Le rabais est COLLÉ au mois qui y a droit — pas répété à côté.
    const remise = m.rabais > 0 ? `, −${m.rabais} %` : '';
    return `${nom} : ${unite}${remise}`;
  });

  // ── La version d'un seul tenant, pour les petits écrans ────────────
  //
  // À 390 px, la ligne complète se replie sur trois niveaux et le bandeau
  // fait 88 px de haut — un quart de l'écran d'un téléphone, avant même
  // d'avoir vu la marque. Ici le rabais colle au mois, le mot « restantes »
  // saute, et le deuxième mois n'a que son chiffre :
  //
  //   ● Octobre −15 % · 35 places · Novembre 34
  //
  // La mention de fermeture, elle, descend sous le bouton du hero : elle
  // compte, mais pas au prix de trois lignes en haut de chaque page.
  const compacts = [];
  ouverts.forEach((m, i) => {
    const nom = moisSansAnnee(m.nom);
    if (i === 0) {
      compacts.push(m.rabais > 0 ? `${nom} −${m.rabais} %` : nom);
      compacts.push(`${m.restantes} ${m.restantes === 1 ? 'place' : 'places'}`);
    } else {
      compacts.push(`${nom} ${m.restantes}`);
    }
  });

  return {
    etat: 'ouvert',
    segments,
    compacts,
    // `texte` reste la première ligne : le hero n'en affiche qu'une.
    texte: segments[0],
    complet: false, listeAttente: false,
    restantes: ouverts[0].restantes,
    mois: moisSansAnnee(ouverts[0].nom),
    rabaisOctobre: rabais,
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
