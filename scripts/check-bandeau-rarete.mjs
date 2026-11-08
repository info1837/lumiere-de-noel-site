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

console.log('\n--- 2. 🚨 Rareté honnête : aucun compteur, aucun « complet » (2026-11-08) ---');
{
  const { ligneSaison } = await import(path.join(ROOT, 'lib/season.js'));
  const TEXTE = 'Places limitées — dernières installations le 12 décembre';
  const le8 = { maintenant: new Date('2026-11-08T15:00:00Z') };
  const m = messageRarete(OUVERT, le8);
  t('🚨 la phrase exacte', m?.texte === TEXTE, m?.texte);
  t('🚨 la ligne : « Saison 2026 · Places limitées — … »', ligneSaison(m)?.join(' · ') === `Saison 2026 · ${TEXTE}`,
    ligneSaison(m)?.join(' · '));
  // Le cas qui a fait mentir le site : le CRM disait 20 places prises sur 20.
  const pleine = { ...OUVERT, places_saison: 20, places_prises: 20, places_restantes: 0 };
  const mp = messageRarete(pleine, le8);
  t('🚨 20/20 au CRM → toujours « Places limitées », jamais « Complet »', mp?.texte === TEXTE && !/complet/i.test(JSON.stringify(mp)));
  const tousPleins = { ...OUVERT, mois: OUVERT.mois.map((x) => ({ ...x, restantes: 0, complet: true })) };
  t('🚨 mois pleins au CRM → pas de « Complet » non plus', messageRarete(tousPleins, le8)?.texte === TEXTE);
  const fermeCrm = { ...OUVERT, reservations_ouvertes: false };
  t('🚨 la date du CRM (20 novembre) ne ferme plus rien', messageRarete(fermeCrm, le8)?.texte === TEXTE);
  t('🚨 aucun chiffre de places', !/\d+ places?/.test(JSON.stringify(mp)));
  t('🚨 aucune liste d\'attente', !/attente/i.test(JSON.stringify(mp)));
  t('le 12 décembre, la ligne est encore là', messageRarete(OUVERT, { maintenant: new Date('2026-12-12T20:00:00Z') }) !== null);
  t('🚨 après le 12 décembre, plus rien', messageRarete(OUVERT, { maintenant: new Date('2026-12-13T12:00:00Z') }) === null);
  const resa = { ...OUVERT, rabais_reservation: 15 };
  t('le rabais d\'octobre reste une clause, quand le CRM le donne',
    ligneSaison(messageRarete(resa, le8)).includes('−15 % si réservé en octobre'));
  t('sans rabais, deux segments', ligneSaison(messageRarete({ ...OUVERT, rabais_reservation: 0 }, le8)).length === 2);
  t('la date se lit en français', dateEnFrancais('2026-12-12') === '12 décembre');

  const css = lire('app/globals.css');
  const composant = lire('components/BandeauRarete.jsx');
  t('🚨 une SEULE écriture, en segments', /bandeau-rarete__seg/.test(composant)
    && !/bandeau-rarete__large/.test(composant) && !/bandeau-rarete__compact/.test(composant));
  t('🚨 la phrase est composée à UN endroit', /ligneSaison/.test(composant)
    && /export function ligneSaison/.test(lire('lib/season.js')));
  t('🚨 le lien du bandeau mène au formulaire normal',
    /href="\/soumission" className="bandeau-rarete__lien"/.test(composant) && /Réservez votre date/.test(composant));
  t('🚨 plus de lien « Liste d\'attente »', !/liste-attente|Liste d.attente/.test(sansCommentaires(composant)));
  t('le CSS choisit ce qui tombe, pas le JavaScript',
    /@media \(max-width: 480px\)[\s\S]{0,700}\.bandeau-rarete__seg:nth-child\(n\+4\) \{ display: none; \}/.test(css));
  const accueil = lire('app/page.jsx');
  t('🚨 la section de réservation de l\'accueil répète la phrase', /\{rarete\.texte\}\. Réservez votre date\./.test(accueil));
  t('🚨 …et ne dit plus « Réservations fermées »', !/Réservations fermées/.test(accueil));
  t('…et elle n\'est pas dans le hero', !/hero-fermeture/.test(lire('components/Hero.jsx')));
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
  t('🚨 la barre est marine, pas ambre — le même marine que le fond de l\'entête',
    /\.bandeau-rarete \{[\s\S]{0,400}background: #0A1524;/.test(css)
    && /\.entete-fond \{[\s\S]{0,200}background: #0A1524;/.test(css));
  t('🚨 le texte est crème', /\.bandeau-rarete \{[\s\S]{0,460}color: #F0EADE;/.test(css));
  t('🚨 l\'ambre ne reste QUE sur la pastille',
    /\.bandeau-rarete__pastille \{[\s\S]{0,200}background: #F0BA54;/.test(css));
  t('🚨 14 px — une ligne discrète', /\.bandeau-rarete \{[\s\S]{0,520}font-size: 14px;/.test(css));
  // Contraste mesuré du nouveau couple.
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const lum = (h) => { const n = parseInt(h, 16); return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
  const a = lum('F0EADE'), b = lum('0A1524');
  const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  t('🚨 le contraste dépasse le AAA (7:1)', ratio >= 7, `${ratio.toFixed(2)}:1`);

  // Passe « effets sobres » (2026-10-26) : le bandeau est au premier
  // écran, donc rien n'y bouge. Le point garde sa lueur, plus sa respiration.
  t('🚨 le point devant le premier mois est allumé (lueur ambre)',
    /\.bandeau-rarete__pastille \{[\s\S]{0,400}box-shadow: 0 0 7px rgba\(240, 186, 84/.test(css));
  t('🚨 …et immobile : premier écran, aucune animation',
    !/\.bandeau-rarete__pastille \{[^}]*animation:/.test(css) && !/bandeau-respire/.test(css));

  // ⚠️ La hauteur se MESURE. Un chiffre en dur se trompait de 24 px sur
  // téléphone, et la pilule recouvrait la barre.
  const mesure = lire('components/MesureBandeau.jsx');
  t('🚨 la hauteur réelle est posée sur --bandeau-h', /setProperty\("--bandeau-h"/.test(mesure));
  t('🚨 elle se recalcule quand le texte se replie', /ResizeObserver/.test(mesure));
  t('…et quand les polices arrivent', /document\.fonts/.test(mesure));
  t('le composant est monté dans le bandeau', /<MesureBandeau \/>/.test(lire('components/BandeauRarete.jsx')));
}

console.log('\n--- 9. 🚨 Plus de liste d\'attente : le formulaire normal pour tous ---');
{
  const page = lire('app/soumission/page.jsx');
  const code = sansCommentaires(page);
  t('🚨 le paramètre n\'est plus lu', !/searchParams\?\.\["liste-attente"\]/.test(code));
  t('🚨 plus de source « Liste d\'attente »', !/Liste d'attente/.test(code));
  t('🚨 plus de « saison complète »', !/complète/.test(code));
  t('🚨 c\'est le QuoteForm normal', /<QuoteForm source=\{sourceFinale\}/.test(page)
    && /const sourceFormulaire = "Formulaire de soumission \(complet\)"/.test(page));
  t('un seul formulaire dans la page', (page.match(/<QuoteForm/g) || []).length === 1);
  const form = lire('components/QuoteForm.jsx');
  t('🚨 le consentement dérive toujours de la source', /consentement: `accordé le .*via \$\{source\}`/.test(form));
  t('🚨 l\'envoi vers /api/lead est intact', /fetch\("\/api\/lead"/.test(lire('components/data.js')));
  const pixel = lire('lib/meta-lead-event.js');
  t('🚨 le pixel et l\'event_id sont intacts', /eventID/.test(pixel) && /event_id/.test(pixel));
  const blog = lire('app/blog/posts.js');
  t('🚨 le blogue ne ferme plus les réservations le 20 novembre',
    !/réservations (sont fermées|ferment le 20 novembre|fermées pour la saison)/i.test(blog) && /12 décembre/.test(blog));
  t('🚨 le blogue n\'envoie plus à la liste d\'attente', !/liste d'attente/i.test(blog));
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
