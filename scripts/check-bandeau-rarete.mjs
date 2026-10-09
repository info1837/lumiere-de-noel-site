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
  t('🚨 « Octobre : 18 places restantes, −15 % »',
    m.segments[0] === 'Octobre : 18 places restantes, −15 %', m.segments[0]);
  t('🚨 « Novembre : 4 places »', m.segments[1] === 'Novembre : 4 places', m.segments[1]);
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
  t('🚨 « 1 place restante », au singulier',
    messageRarete(une).segments[0] === 'Octobre : 1 place restante', messageRarete(une).segments[0]);
  const deux = { ...OUVERT, mois: [OUVERT.mois[0], { ...OUVERT.mois[1], restantes: 1 }] };
  t('le second mois au singulier aussi',
    messageRarete(deux).segments[1] === 'Novembre : 1 place', messageRarete(deux).segments[1]);
  t('moisSansAnnee retire l\'année', moisSansAnnee('Octobre 2026') === 'Octobre');
  t('…et ne casse pas un nom sans année', moisSansAnnee('Octobre') === 'Octobre');
}

console.log('\n--- 2b. 🚨 « PLACES », jamais « dates » ---');
{
  // Une date, c'est un jour du calendrier. Ce qu'on vend, c'est une place
  // dans la saison : un client peut occuper le 14 novembre sans que le
  // 14 novembre disparaisse pour tout le monde. « 35 dates restantes »
  // laissait croire qu'il restait 35 JOURS ouvrables — un visiteur qui
  // compte les jours de novembre trouve autre chose et doute du chiffre.
  const m = messageRarete(OUVERT);
  t('🚨 plus aucune « date » dans la ligne',
    !/\bdates?\b/i.test(m.segments.join(' ')), m.segments.join(' · '));
  t('🚨 ni dans la version compacte',
    !/\bdates?\b/i.test((m.compacts || []).join(' ')), (m.compacts || []).join(' · '));
  t('le mot « places » est bien là', /places/.test(m.segments.join(' ')));
}

console.log('\n--- 2c. 🚨 ≤ 480 px : une seule ligne ---');
{
  const m = messageRarete(OUVERT);
  t('🚨 « Octobre −15 % · 35 places · Novembre 34 »',
    (m.compacts || []).join(' · ') === 'Octobre −15 % · 18 places · Novembre 4',
    (m.compacts || []).join(' · '));
  t('le rabais colle au mois, sans deux-points', /^Octobre −15 %$/.test((m.compacts || [])[0] || ''));
  t('🚨 le deuxième mois n\'a que son chiffre', /^Novembre \d+$/.test((m.compacts || [])[2] || ''));
  t('🚨 pas de « restantes » — c\'est ce qui faisait déborder', !/restantes/.test((m.compacts || []).join(' ')));

  const sansRabais = { ...OUVERT, rabais_octobre: 0, mois: OUVERT.mois.map((x) => ({ ...x, rabais: 0 })) };
  t('sans rabais, le mois reste seul', (messageRarete(sansRabais).compacts || [])[0] === 'Octobre',
    (messageRarete(sansRabais).compacts || [])[0]);
  const une = { ...OUVERT, mois: [{ ...OUVERT.mois[0], restantes: 1 }] };
  t('« 1 place » au singulier', (messageRarete(une).compacts || [])[1] === '1 place',
    (messageRarete(une).compacts || [])[1]);

  const css = lire('app/globals.css');
  const composant = lire('components/BandeauRarete.jsx');
  // ⚠️ IL N'Y A PLUS DEUX ÉCRITURES.
  //
  // Le composant rendait en parallèle une version « large » et une version
  // « compacte », le CSS cachant l'une ou l'autre. C'était deux
  // formulations de la même donnée dans le même HTML — donc deux occasions
  // de les faire diverger, et c'est exactement le défaut que ce fichier
  // traque. Maintenant lib/season.js compose UNE phrase en segments, et le
  // CSS ne fait que laisser tomber les derniers sur un petit écran.
  t('🚨 une SEULE écriture, en segments', /bandeau-rarete__seg/.test(composant)
    && !/bandeau-rarete__large/.test(composant) && !/bandeau-rarete__compact/.test(composant));
  t('🚨 la phrase est composée à UN endroit', /ligneSaison/.test(composant)
    && /export function ligneSaison/.test(lire('lib/season.js')));
  t('🚨 le CSS choisit ce qui tombe, pas le JavaScript',
    /@media \(max-width: 480px\)[\s\S]{0,700}\.bandeau-rarete__seg:nth-child\(n\+4\) \{ display: none; \}/.test(css));

  // ⚠️ La mention de fermeture DESCEND, elle ne disparaît pas. Elle est
  // passée du hero à la section de réservation, en bas de l'accueil : à
  // l'endroit exact où quelqu'un hésite devant le formulaire.
  t('🚨 la fermeture est dans la section de réservation',
    /Réservations fermées le \{fermeture\}/.test(lire('app/page.jsx')));
  t('🚨 …et elle n\'est plus dans le hero',
    !/hero-fermeture/.test(lire('components/Hero.jsx')));
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
  const saison = lire('lib/season.js');
  t('🚨 la phrase l\'inclut', /Réservations fermées le \$\{fermeture\}/.test(saison));
  t('…mais pas quand les réservations sont déjà fermées (deux messages contraires)',
    /rarete\.etat !== 'ferme'/.test(saison));
  t('🚨 le label de saison vient d\'une seule constante', /label: 'Saison 2026'/.test(saison));
}

console.log('\n--- 6. 🚨 Lecture côté SERVEUR, rafraîchie chaque heure ---');
{
  const lecteur = lire('lib/disponibilites.js');
  t('🚨 une heure', FRAICHEUR_SECONDES === 3600);
  t('🚨 le fetch passe par `revalidate`', /next: \{ revalidate: FRAICHEUR_SECONDES \}/.test(lecteur));
  t('🚨 il ne bloque pas le rendu indéfiniment', /AbortSignal\.timeout/.test(lecteur));
  const composant = lire('components/BandeauRarete.jsx');
  // ⚠️ Ce n'est plus le BANDEAU qui lit, c'est le LAYOUT — il a besoin de
  // la réponse pour décider s'il pose `avec-bandeau` sur le <body>. Deux
  // lectures donneraient deux réponses possibles : une barre sans décalage,
  // ou un décalage sans barre.
  t('🚨 le layout lit côté serveur', /export default async function RootLayout/.test(lire('app/layout.jsx')));
  t('🚨 le bandeau reçoit la donnée du layout',
    /export default function BandeauRarete\(\{ rarete \}\)/.test(composant)
    && !/lireDisponibilites/.test(composant));
  // ⚠️ CE TEST INTERDISAIT « use client », AU MOTIF DU CORS DU CRM.
  //
  // Le motif était juste : le navigateur ne PEUT pas lire la route du CRM,
  // elle n'autorise que le domaine d'Operatr. Mais il ne lit pas le CRM —
  // il lit /api/disponibilites, sur NOTRE domaine, qui relaie côté serveur.
  // Le CORS n'entre donc pas en jeu.
  //
  // Et cette resynchronisation répare le défaut que ce fichier n'avait pas
  // vu : le cache de PAGE de Next est par route, donc l'accueil et
  // /simulateur portaient deux instantanés différents du même chiffre
  // (« 26 places » ici, « 30 places » là). Un rendu serveur seul ne peut
  // pas corriger ça.
  t('🚨 le lecteur, lui, reste côté serveur', !/use client/.test(lecteur));
  t('🚨 le navigateur passe par NOTRE domaine, jamais par le CRM',
    /fetch\("\/api\/disponibilites"/.test(composant) && !/palencia-crm/.test(composant));
  t('🚨 le relais same-origin existe et ne devine rien',
    /messageRarete\(await lireDisponibilites\(\)\)/.test(lire('app/api/disponibilites/route.js')));
  t('🚨 pas de resynchronisation quand le serveur n\'avait RIEN — sinon la barre se poserait sans décalage',
    /if \(!rarete\) return;/.test(composant));
  t('🚨 en cas de panne réseau, le lecteur rend null', /catch \{\s*return null;\s*\}/.test(lecteur));
  let leve = false;
  try { await lireDisponibilites(); } catch { leve = true; }
  t('🚨 il ne lève jamais, même sans réseau', !leve);
}

console.log('\n--- 7. 🚨 Le bandeau est AU-DESSUS de l\'entête, jamais recouvert ---');
{
  const layout = lire('app/layout.jsx');
  const css = lire('app/globals.css');
  t('🚨 il est monté', /<BandeauRarete rarete=\{rarete\} \/>/.test(layout));
  t('🚨 AVANT la NavBar', layout.indexOf('<BandeauRarete') < layout.indexOf('<NavBar />'));

  // ⚠️ L'entête est une pilule `position: fixed`. Un bandeau dans le flux
  // normal défilait, et la pilule lui passait dessus dès le premier geste.
  t('🚨 le bandeau est FIXE en haut',
    /\.bandeau-rarete \{[\s\S]{0,220}position: fixed;[\s\S]{0,120}top: 0;/.test(css));
  t('🚨 il passe au-dessus de la pilule (z-index)',
    /\.bandeau-rarete \{[\s\S]{0,400}z-index: 200;/.test(css));
  t('🚨 …mais sous le tiroir mobile, qui doit tout couvrir',
    /\.tiroir[\s\S]{0,200}z-index: 10\d\d/.test(css) || /z-index: 1090/.test(css));
  t('🚨 l\'entête est décalée de la hauteur du bandeau',
    /body\.avec-bandeau \.entete-pilule \{[\s\S]{0,120}calc\(var\(--bandeau-h\) \+ var\(--entete-encart\)\)/.test(css));
  t('🚨 le contenu aussi', /body\.avec-bandeau \{ padding-top: var\(--bandeau-h\); \}/.test(css));
  t('les ancres n\'atterrissent pas sous la barre', /scroll-margin-top: calc\(var\(--bandeau-h\)/.test(css));

  // ⚠️ La classe n'est posée QUE si le CRM a répondu : sans bandeau,
  // aucun décalage et aucun espace vide en haut de page.
  t('🚨 la classe dépend de la réponse du CRM',
    /className=\{rarete \? "avec-bandeau" : undefined\}/.test(layout));

  t('l\'animation se coupe si le visiteur la refuse',
    /prefers-reduced-motion[\s\S]{0,120}animation: none/.test(css));
}

console.log('\n--- 8. 🚨 Lisible : ambre plein, marine, 15 px ---');
{
  const css = lire('app/globals.css');
  // ⚠️ L'APLAT AMBRE EST PARTI, ET C'EST LE POINT.
  //
  // L'ambre est la couleur de la lumière sur ce site — la chose qu'on
  // vend. Employée en fond pleine largeur, elle se mettait à signifier
  // « avertissement » : une bande jaune en haut de chaque page ressemble à
  // un message du navigateur, pas à une marque haut de gamme. Elle ne
  // reste que sur la pastille, où elle brille.
  t('🚨 la barre est marine, pas ambre',
    /\.bandeau-rarete \{[\s\S]{0,400}background: #081220;/.test(css));
  t('🚨 le texte est crème', /\.bandeau-rarete \{[\s\S]{0,460}color: #F0EADE;/.test(css));
  t('🚨 l\'ambre ne reste QUE sur la pastille',
    /\.bandeau-rarete__pastille \{[\s\S]{0,200}background: #F0BA54;/.test(css));
  t('🚨 14 px — une ligne discrète', /\.bandeau-rarete \{[\s\S]{0,520}font-size: 14px;/.test(css));
  // Contraste mesuré du nouveau couple.
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const lum = (h) => { const n = parseInt(h, 16); return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
  const a = lum('F0EADE'), b = lum('081220');
  const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  t('🚨 le contraste dépasse le AAA (7:1)', ratio >= 7, `${ratio.toFixed(2)}:1`);

  t('🚨 le point respire devant le premier mois', /\.bandeau-rarete__pastille \{[\s\S]{0,400}animation: bandeau-respire/.test(css));
  t('…lentement (2,8 s), pas en alarme', /bandeau-respire 2\.8s/.test(css));

  // ⚠️ La hauteur se MESURE. Un chiffre en dur se trompait de 24 px sur
  // téléphone, et la pilule recouvrait la barre.
  const mesure = lire('components/MesureBandeau.jsx');
  t('🚨 la hauteur réelle est posée sur --bandeau-h', /setProperty\("--bandeau-h"/.test(mesure));
  t('🚨 elle se recalcule quand le texte se replie', /ResizeObserver/.test(mesure));
  t('…et quand les polices arrivent', /document\.fonts/.test(mesure));
  t('le composant est monté dans le bandeau', /<MesureBandeau \/>/.test(lire('components/BandeauRarete.jsx')));
}

console.log('\n--- 9. 🚨 La liste d\'attente passe par le MÊME envoi ---');
{
  const page = lire('app/soumission/page.jsx');
  t('🚨 le paramètre est lu', /liste-attente/.test(page));
  t('🚨 seule la SOURCE change', /Liste d'attente — site Lumière/.test(page));
  // `sourceFinale` remplace `sourceFormulaire` : /soumission distingue
  // maintenant une arrivée depuis le simulateur (fiche préremplie) d'une
  // arrivée directe. La liste d'attente, elle, passe toujours par la MÊME
  // variable et le MÊME formulaire.
  t('🚨 c\'est le même QuoteForm', /<QuoteForm source=\{sourceFinale\}/.test(page)
    && /sourceFormulaire/.test(page));
  t('un seul formulaire dans la page', (page.match(/<QuoteForm/g) || []).length === 1);
  const form = lire('components/QuoteForm.jsx');
  t('🚨 le consentement dérive toujours de la source', /consentement: `accordé le .*via \$\{source\}`/.test(form));
  t('🚨 l\'envoi vers /api/lead est intact', /fetch\("\/api\/lead"/.test(lire('components/data.js')));
  const pixel = lire('lib/meta-lead-event.js');
  t('🚨 le pixel et l\'event_id sont intacts', /eventID/.test(pixel) && /event_id/.test(pixel));
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
