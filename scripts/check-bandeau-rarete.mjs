// Le bandeau de rareté — il n'existe que s'il est vrai.
//
//   node scripts/check-bandeau-rarete.mjs
//
// Une promesse de rareté fausse se retourne contre le reste de la page. Le
// client qui lit « 3 dates restantes » et obtient un rendez-vous en deux
// jours apprend que le chiffre était du décor — et il doute ensuite du prix.
//
// Le cas qui compte : quand le CRM ne répond pas, il n'y a AUCUN bandeau.
// Pas de squelette, pas de « quelques dates encore disponibles ».

import fs from 'fs';
import path from 'path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
let pass = 0, fail = 0;
const t = (nom, ok, d = '') => { console.log(`  ${ok ? '✅' : '❌'} ${nom}${d ? ` — ${d}` : ''}`); ok ? pass++ : fail++; };
const lire = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
// ⚠️ Les commentaires CITENT les formulations interdites pour expliquer
// pourquoi elles le sont. Les comparer comme du code faisait échouer le
// test sur sa propre documentation — la troisième fois que ça m'arrive.
const sansCommentaires = (x) => x
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/^\s*\/\/.*$/gm, '');

const { messageRarete, moisSansAnnee, dateEnFrancais, FRAICHEUR_SECONDES, lireDisponibilites } =
  await import(path.join(ROOT, 'lib/disponibilites.js'));

const OUVERT = {
  ok: true, capacite_semaine: 8, reservations_fermees_le: '2026-11-20',
  reservations_ouvertes: true, rabais_octobre: 15,
  mois: [
    { cle: '2026-10', nom: 'Octobre 2026', capacite: 23, planifiees: 5, restantes: 18, complet: false, rabais: 15 },
    { cle: '2026-11', nom: 'Novembre 2026', capacite: 34, planifiees: 30, restantes: 4, complet: false, rabais: 0 },
  ],
};
// ⚠️ Pas de décembre dans cette fixture, et c'est le point : la route ne
// l'envoie plus depuis que la fermeture des réservations borne la liste
// (CRM #225). Le site affiche ce qu'on lui donne — il n'invente rien et
// ne filtre rien. Deux règles « pas décembre », une ici et une dans le
// CRM, finiraient par diverger.

console.log('\n--- 1. 🚨 Sans réponse du CRM, AUCUN bandeau ---');
{
  t('🚨 ok:false → rien à dire', messageRarete({ ok: false, raison: 'capacite_non_configuree' }) === null);
  t('🚨 null → rien à dire', messageRarete(null) === null);
  t('undefined → rien à dire', messageRarete(undefined) === null);
  const composant = lire('components/BandeauRarete.jsx');
  t('🚨 le composant rend null quand il n\'a pas de message', /if \(!msg\) return null;/.test(composant));
  t('🚨 aucun nombre écrit en dur dans le composant',
    !/\d+ dates? restantes?/.test(sansCommentaires(composant)), 'pas de chiffre littéral');
  t('🚨 aucun texte de repli du genre « quelques dates »',
    !/quelques|plusieurs dates|bientôt complet/i.test(sansCommentaires(composant)));
  const lecteur = lire('lib/disponibilites.js');
  t('🚨 le lecteur rend null en cas d\'échec, jamais un objet par défaut',
    /return null;/.test(lecteur) && !/restantes: \d/.test(lecteur));
}

console.log('\n--- 2. 🚨 Un segment par mois, le rabais collé au sien ---');
{
  const m = messageRarete(OUVERT);
  t('🚨 « Octobre : 18 dates restantes, −15 % »',
    m.segments[0] === 'Octobre : 18 dates restantes, −15 %', m.segments[0]);
  t('🚨 « Novembre : 4 dates »', m.segments[1] === 'Novembre : 4 dates', m.segments[1]);
  t('🚨 « Octobre » n\'apparaît QU\'UNE FOIS dans toute la ligne',
    (m.segments.join(' · ').match(/Octobre/g) || []).length === 1, m.segments.join(' · '));
  t('🚨 plus d\'année dans les noms de mois — on est dedans',
    !/\d{4}/.test(m.segments.join(' ')), m.segments.join(' · '));
  t('seul le premier dit « restantes » en toutes lettres',
    /restantes/.test(m.segments[0]) && !/restantes/.test(m.segments[1]));

  const octComplet = { ...OUVERT, mois: [{ ...OUVERT.mois[0], restantes: 0, complet: true }, OUVERT.mois[1]] };
  const m2 = messageRarete(octComplet);
  t('🚨 octobre complet → il disparaît, novembre passe en tête',
    m2.segments.length === 1 && /^Novembre/.test(m2.segments[0]), m2.segments.join(' · '));
  t('🚨 …et son rabais part avec lui — on ne peut plus le tenir',
    !/%/.test(m2.segments.join(' ')), m2.segments.join(' · '));

  const une = { ...OUVERT, mois: [{ ...OUVERT.mois[0], restantes: 1, rabais: 0 }] };
  t('🚨 « 1 date restante », au singulier',
    messageRarete(une).segments[0] === 'Octobre : 1 date restante', messageRarete(une).segments[0]);
  const deux = { ...OUVERT, mois: [OUVERT.mois[0], { ...OUVERT.mois[1], restantes: 1 }] };
  t('le second mois au singulier aussi',
    messageRarete(deux).segments[1] === 'Novembre : 1 date', messageRarete(deux).segments[1]);
  t('moisSansAnnee retire l\'année', moisSansAnnee('Octobre 2026') === 'Octobre');
  t('…et ne casse pas un nom sans année', moisSansAnnee('Octobre') === 'Octobre');
}

console.log('\n--- 3. 🚨 DÉCEMBRE ne doit jamais apparaître ---');
{
  // La route ne l'envoie plus (PR #225). Le site ne doit pas non plus le
  // fabriquer : il n'affiche QUE ce qu'on lui donne.
  const m = messageRarete(OUVERT);
  t('🚨 aucun « Décembre » dans le bandeau', !/Décembre/i.test(m.segments.join(' ')), m.segments.join(' · '));
  t('🚨 le site affiche exactement ce que la route envoie — ni plus, ni moins',
    m.segments.length === OUVERT.mois.filter((x) => x.restantes > 0).length, `${m.segments.length}`);
  const composant = lire('components/BandeauRarete.jsx');
  t('🚨 aucun mois écrit en dur dans le composant',
    !/Octobre|Novembre|Décembre/.test(sansCommentaires(composant)));
  const lecteur = lire('lib/disponibilites.js');
  t('🚨 ni dans le lecteur — sauf la table des noms de mois',
    !/Décembre/.test(sansCommentaires(lecteur).replace(/'décembre'/g, '')));
}

console.log('\n--- 4. 🚨 Complet, et la liste d\'attente ---');
{
  const complet = { ...OUVERT, mois: OUVERT.mois.map((m) => ({ ...m, restantes: 0, complet: true })) };
  const m = messageRarete(complet);
  t('🚨 « Complet pour cette saison »', /Complet/.test(m.texte), m.texte);
  t('🚨 la liste d\'attente s\'ouvre', m.listeAttente === true);
  t('aucun chiffre quand tout est complet', !/\d/.test(m.texte), m.texte);

  const ferme = { ...OUVERT, reservations_ouvertes: false };
  const f = messageRarete(ferme);
  t('🚨 réservations fermées → on le dit', /fermées/.test(f.texte), f.texte);
  t('…et la liste d\'attente reste offerte', f.listeAttente === true);
  t('aucun chiffre non plus', !/\d/.test(f.texte));
}

console.log('\n--- 5. « Réservations fermées le 20 novembre » ---');
{
  t('🚨 la date se lit en français', dateEnFrancais('2026-11-20') === '20 novembre', String(dateEnFrancais('2026-11-20')));
  t('sans zéro devant le jour', dateEnFrancais('2026-10-05') === '5 octobre', String(dateEnFrancais('2026-10-05')));
  t('une date illisible ne rend rien', dateEnFrancais('bientôt') === null && dateEnFrancais(null) === null);
  const composant = lire('components/BandeauRarete.jsx');
  t('🚨 le composant l\'affiche', /Réservations fermées le \{fermeture\}/.test(composant));
  t('…mais pas quand tout est complet (ce serait deux messages contraires)',
    /!msg\.complet && \(/.test(composant));
}

console.log('\n--- 6. 🚨 Lecture côté SERVEUR, rafraîchie chaque heure ---');
{
  const lecteur = lire('lib/disponibilites.js');
  t('🚨 une heure', FRAICHEUR_SECONDES === 3600);
  t('🚨 le fetch passe par `revalidate`', /next: \{ revalidate: FRAICHEUR_SECONDES \}/.test(lecteur));
  t('🚨 il ne bloque pas le rendu indéfiniment', /AbortSignal\.timeout/.test(lecteur));
  const composant = lire('components/BandeauRarete.jsx');
  t('🚨 le composant est asynchrone (donc serveur)', /export default async function BandeauRarete/.test(composant));
  t('aucun "use client" — le CORS du CRM refuserait le navigateur',
    !/use client/.test(composant) && !/use client/.test(lecteur));
  t('🚨 en cas de panne réseau, le lecteur rend null', /catch \{\s*return null;\s*\}/.test(lecteur));
  let leve = false;
  try { await lireDisponibilites(); } catch { leve = true; }
  t('🚨 il ne lève jamais, même sans réseau', !leve);
}

console.log('\n--- 7. Le bandeau est au-dessus de l\'entête ---');
{
  const layout = lire('app/layout.jsx');
  t('🚨 il est monté', /<BandeauRarete \/>/.test(layout));
  t('🚨 AVANT la NavBar', layout.indexOf('<BandeauRarete />') < layout.indexOf('<NavBar />'));
  const css = lire('app/globals.css');
  t('il a son style', /\.bandeau-rarete \{/.test(css));
  t('🚨 aucune hauteur réservée quand il n\'existe pas',
    !/\.bandeau-rarete \{[^}]*min-height/.test(css));
  t('l\'animation se coupe si le visiteur la refuse',
    /prefers-reduced-motion[\s\S]{0,120}animation: none/.test(css));
}

console.log('\n--- 8. 🚨 La liste d\'attente passe par le MÊME envoi ---');
{
  const page = lire('app/soumission/page.jsx');
  t('🚨 le paramètre est lu', /liste-attente/.test(page));
  t('🚨 seule la SOURCE change', /Liste d'attente — site Lumière/.test(page));
  t('🚨 c\'est le même QuoteForm', /<QuoteForm source=\{sourceFormulaire\}/.test(page));
  t('un seul formulaire dans la page', (page.match(/<QuoteForm/g) || []).length === 1);
  const form = lire('components/QuoteForm.jsx');
  t('🚨 le consentement dérive toujours de la source', /consentement: `accordé le .*via \$\{source\}`/.test(form));
  t('🚨 l\'envoi vers /api/lead est intact', /fetch\("\/api\/lead"/.test(lire('components/data.js')));
  const pixel = lire('lib/meta-lead-event.js');
  t('🚨 le pixel et l\'event_id sont intacts', /eventID/.test(pixel) && /event_id/.test(pixel));
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
