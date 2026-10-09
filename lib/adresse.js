// Ce qu'on peut tirer d'une adresse — et ce qu'on refuse de deviner.
//
// Fonction pure, dans lib/ plutôt que dans le composant, pour une raison
// pratique : un fichier « use client » en JSX ne s'importe pas depuis
// Node, donc la règle « si on ne sait pas, on ne devine pas » ne serait
// vérifiable que par une expression régulière lancée sur du texte. Ici,
// scripts/check-lead-simulateur.mjs l'appelle pour de vrai.

/**
 * La ville, extraite de l'adresse.
 *
 * ⚠️ POURQUOI C'EST NÉCESSAIRE.
 *
 * Le CRM a une colonne `city`, et Sophie B s'en sert. Le 2026-09-27, le
 * formulaire du hero collectait la ville et la route d'intake la jetait :
 * la fiche arrivait avec city = null, et Sophie redemandait une
 * information que le client venait d'écrire. Le simulateur ne pose plus
 * de question « Ville » — il a l'adresse complète, qui la contient.
 *
 * Places rend « 118 rue des Érables, Blainville, QC J7C 3M2 » : la ville
 * est le segment juste avant celui qui commence par « QC ». On part de
 * « QC » plutôt que de compter les virgules, parce qu'une adresse avec un
 * numéro d'appartement en porte une de plus.
 *
 * ⚠️ ET SI ON NE SAIT PAS, ON NE DEVINE PAS. Une adresse tapée à la main
 * sans « QC » rend une chaîne vide : mieux vaut une ville absente, que
 * Sophie demandera, qu'une mauvaise ville, qu'elle croira.
 */
export function villeDeAdresse(adresse) {
  const parts = String(adresse || '').split(',').map((x) => x.trim()).filter(Boolean);
  const i = parts.findIndex((x) => /^(QC|Qu[ée]bec)\b/i.test(x));
  return i > 0 ? parts[i - 1].slice(0, 120) : '';
}
