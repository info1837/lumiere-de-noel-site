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
  t('🚨 les sections larges, de 72 à 108', /\.section-y-large \{ padding-top: 108px/.test(mq));
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
  t('🚨 la section garde UNE porte, sous la grille',
    /marginTop: 40 \}\}>\s*<CTAButton href="\/soumission" variant="gold">Réserver ma date<\/CTAButton>/.test(page));
  t('les paddings inline sont devenus des classes',
    !/paddingTop: 72, paddingBottom: 72/.test(page) &&
    !/paddingTop: 56, paddingBottom: 56/.test(page) &&
    !/paddingTop: 40, paddingBottom: 40/.test(page));
  t('…et les classes sont posées',
    /className="section-y-large"/.test(page) && /section-y-moyen/.test(page) && /className="section-y-serre"/.test(page));
  t('le corps des cartes porte sa classe', /className="carte-corps"/.test(page));
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
  t('🚨 un seul bouton dans le hero (bloc 1)',
    (hero.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').match(/<CTAButton[^>]*href=/g) || []).length === 1);
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
