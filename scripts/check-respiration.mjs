// La page respire : rythme vertical mobile, cartes moins serrées, une idée
// par section, et un champ qui arrive AVEC son étiquette.
//
//   node scripts/check-respiration.mjs
//
// Mesuré à 390 px avant : nos sections tenaient sur 56 px de marge haut/bas,
// celles de palenciaservicesexterieur.com sur 80. Le ×1,5 tombe à 84.

import fs from 'fs';
import path from 'path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
let pass = 0, fail = 0;
const t = (nom, ok, d = '') => { console.log(`  ${ok ? '✅' : '❌'} ${nom}${d ? ` — ${d}` : ''}`); ok ? pass++ : fail++; };
const lire = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const css = lire('app/globals.css');
const page = lire('app/page.jsx');
const hero = lire('components/Hero.jsx');
// Mes propres commentaires citent les valeurs d'avant : les lire ferait passer
// des assertions sur du texte explicatif. (Déjà arrivé trois fois.)
const cssNu = css.replace(/\/\*[\s\S]*?\*\//g, '');

console.log('\n--- 1. 🚨 Le rythme vertical mobile, ×1,5 ---');
{
  const mq = cssNu.slice(cssNu.lastIndexOf('@media (max-width: 767.98px)'));
  t('🚨 le bloc mobile existe', mq.length > 40);
  t('🚨 les sections passent de 56 à 84 px',
    /section \{ padding-top: 84px; padding-bottom: 84px; \}/.test(mq));
  // 108 → 128 px : la refonte « soustraction » demande ≥ 120 px entre deux
  // sections au bureau, puisqu'il n'y a plus de cartes pour marquer les
  // séparations. C'est le blanc qui les fait maintenant.
  t('🚨 les sections larges, de 80 à 128', /\.section-y-large \{ padding-top: 128px/.test(mq));
  t('🚨 les serrées, de 40 à 60', /\.section-y-serre \{ padding-top: 60px/.test(mq));
  t('🚨 la bande de confiance suit', /\.trust-section\s+\{ padding-bottom: 108px; \}/.test(mq));
  // ⚠️ La cascade : ces classes sont définies plus haut dans le fichier. Un
  // bloc mobile placé AVANT elles serait repris mot pour mot par la suite.
  t('🚨 le bloc mobile est APRÈS les définitions qu\'il surcharge',
    cssNu.lastIndexOf('@media (max-width: 767.98px)') > cssNu.lastIndexOf('.trust-card {'));
  t('🚨 …et après .hero-card',
    cssNu.lastIndexOf('@media (max-width: 767.98px)') > cssNu.lastIndexOf('.hero-card { max-width'));
}

console.log('\n--- 2. 🚨 Les cartes desserrent ---');
{
  const mq = cssNu.slice(cssNu.lastIndexOf('@media (max-width: 767.98px)'));
  t('🚨 .trust-card : 28/24 → 32/26', /\.trust-card\s+\{ padding: 32px 26px; \}/.test(mq));
  t('🚨 .hero-card : 24 → 30/22', /\.hero-card\s+\{ padding: 30px 22px; \}/.test(mq));
  t('🚨 le corps des cartes de service : 24 → 30/24', /\.carte-corps \{ padding: 30px 24px; \}/.test(mq));
  t('🚨 .hero-card garde une marge de base (le inline est parti)',
    /\.hero-card \{ max-width: 440px; padding: 24px; \}/.test(cssNu));
  t('…et le style inline ne la court-circuite plus', !/borderRadius: 16, padding: 24,/.test(hero));
}

console.log('\n--- 3. 🚨 Une idée par section ---');
{
  // Trois cartes de service portaient le MÊME bouton vers le MÊME endroit.
  t('🚨 plus de bouton par carte de service',
    !/variant="outlineLight" style=\{\{ padding: "13px 24px", fontSize: 13, alignSelf: "flex-start" \}\}/.test(page));
  // ⚠️ LA GRILLE DE CARTES DE SERVICE N'EST PLUS SUR L'ACCUEIL.
  // Elle demandait au visiteur de choisir un rayon avant d'avoir vu une
  // maison illuminée. Les trois pages existent toujours (nav + pied de
  // page), et /services garde ses cartes. Ce qui est vérifié ici, c'est
  // qu'elle n'est pas revenue — et que « Réserver ma date » ne dépasse pas
  // trois occurrences sur la page.
  t('🚨 plus de grille de cartes de service sur l\'accueil',
    !/serviceCards\.map/.test(page));
  const portes = (page.match(/Réserver ma date/g) || []).length;
  t('🚨 « Réserver ma date » au plus 3 fois dans la page', portes <= 3, `${portes}`);
  t('les paddings inline sont devenus des classes',
    !/paddingTop: 72, paddingBottom: 72/.test(page) &&
    !/paddingTop: 56, paddingBottom: 56/.test(page) &&
    !/paddingTop: 40, paddingBottom: 40/.test(page));
  // ⚠️ Les classes `section-y-*` ne sont plus POSÉES sur l'accueil : chaque
  // section utilise le rythme de base de `section { padding: clamp(...) }`,
  // qui vaut maintenant 72→128 px. Les classes restent définies et servent
  // aux pages internes (/soumission, /simulateur, /calculatrice) ; les
  // vérifier ici reviendrait à exiger un réglage fin là où le réglage par
  // défaut est devenu le bon.
  t('🚨 le rythme de base porte la page',
    /section \{ padding: clamp\(72px, 9vw, 128px\) 24px; \}/.test(cssNu));
  t('🚨 aucune carte bordée sur l\'accueil — sauf le formulaire',
    !/className="glow-card"/.test(page) && !/className="carte-corps"/.test(page));
}

console.log('\n--- 4. 🚨 Un champ arrive avec son étiquette ---');
{
  t('🚨 les champs de formulaire ont leur propre marge d\'ancrage',
    /form :is\(input, select, textarea, button\)\[id\]/.test(cssNu));
  t('🚨 elle dégage 72 px de plus que l\'entête',
    /scroll-margin-top: calc\(var\(--bandeau-h, 0px\) \+ var\(--entete-h\) \+ 72px\)/.test(cssNu));
  // ⚠️ body.avec-bandeau [id] pèse (0,2,1). Un sélecteur qui ne compte que des
  // éléments perd, silencieusement : la règle existe et ne s'applique jamais.
  t('🚨 le [id] final lui donne le poids de battre la règle d\'ancre',
    /body\.avec-bandeau form :is\(input, select, textarea, button\)\[id\] \{/.test(cssNu));
  t('🚨 les Select sur mesure sont couverts (ce sont des <button>)',
    /:is\(input, select, textarea, button\)/.test(cssNu));
  t('la règle d\'ancre générale est intacte',
    /body\.avec-bandeau \[id\] \{ scroll-margin-top: calc\(var\(--bandeau-h\) \+ var\(--entete-h\) \+ 12px\); \}/.test(cssNu));
}

console.log('\n--- 5. Ce à quoi on ne touche pas ---');
{
  t('🚨 le pixel est intact', /eventID/.test(lire('lib/meta-lead-event.js')));
  t('🚨 l\'envoi vers /api/lead est intact', /fetch\("\/api\/lead"/.test(lire('components/data.js')));
  t('🚨 le bandeau de rareté est intact', /<BandeauRarete/.test(lire('app/layout.jsx')));
  t('🚨 la barre du bas reste conditionnelle (bloc 2)',
    /mobile-bottom-bar\$\{visible \? " est-visible" : ""\}/.test(lire('app/ClientLayout.jsx')));
  // Deux, depuis la refonte : « Réserver ma date » et « Voir ma maison
  // illuminée ». Voir scripts/check-moins-de-boutons.mjs, qui porte le
  // raisonnement complet.
  t('🚨 deux boutons dans le hero, pas trois',
    (hero.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').match(/<CTAButton[^>]*href=/g) || []).length === 2);
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
