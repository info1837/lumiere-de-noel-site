// Le résultat du test de /formation : recalculé ici à partir des réponses
// (le navigateur ne décide ni du score ni du texte) et mis en forme pour Ops.

import { QUIZ } from './formation-quiz.js';

// Même règle que PASS dans app/formation/formation.html.
const PASS = QUIZ.length - 2;
const MAX_TELEGRAM = 4000;
const RETARD_MAX_MS = 14 * 24 * 3600 * 1000;

/** Nom d'une ligne, sans caractère de contrôle. '' si inutilisable. */
export function nettoyerNom(v) {
  if (typeof v !== 'string') return '';
  const nom = v.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
  return nom.length >= 2 ? nom : '';
}

/** Une réponse par question, ou null. */
export function corriger(reponses) {
  if (!Array.isArray(reponses) || reponses.length !== QUIZ.length) return null;
  if (!reponses.every((r, i) => Number.isInteger(r) && r >= 0 && r < QUIZ[i].o.length)) return null;
  const manquees = QUIZ.filter((q, i) => reponses[i] !== q.a).map((q) => q.q);
  const score = QUIZ.length - manquees.length;
  return { score, total: QUIZ.length, reussi: score >= PASS, manquees };
}

/** L'heure de fin : celle du téléphone si elle est plausible (envoi différé), sinon maintenant. */
export function dateFin(finiLe, maintenant = Date.now()) {
  const t = Date.parse(finiLe);
  return Number.isNaN(t) || t > maintenant + 5 * 60 * 1000 || t < maintenant - RETARD_MAX_MS
    ? new Date(maintenant)
    : new Date(t);
}

export function composerMessage({ nom, resultat, date }) {
  const quand = new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Toronto', dateStyle: 'long', timeStyle: 'short' }).format(date);
  return [
    '🎓 Formation installateur',
    '',
    `Nom : ${nom}`,
    `Résultat : ${resultat.reussi ? '✅ Réussi' : '❌ Échoué'}, ${resultat.score} / ${resultat.total}`,
    `Date : ${quand}`,
    '',
    resultat.manquees.length ? `Questions manquées (${resultat.manquees.length}) :` : 'Aucune question manquée.',
    ...resultat.manquees.map((q) => `• ${q}`),
  ].join('\n').slice(0, MAX_TELEGRAM);
}
