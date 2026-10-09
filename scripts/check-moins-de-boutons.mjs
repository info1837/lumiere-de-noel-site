// Moins de portes au premier écran.
//
//   node scripts/check-moins-de-boutons.mjs
//
// À 390 px, le premier écran portait CINQ appels à l'action en même temps :
// la pilule téléphone de l'entête, « Réserver ma date », « Appeler … », et
// les deux de la barre du bas. Cinq portes côte à côte, ce n'est pas un
// choix, c'est une hésitation.

import fs from 'fs';
import path from 'path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
let pass = 0, fail = 0;
const t = (nom, ok, d = '') => { console.log(`  ${ok ? '✅' : '❌'} ${nom}${d ? ` — ${d}` : ''}`); ok ? pass++ : fail++; };
const lire = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const sansCommentaires = (x) => x
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const css = lire('app/globals.css');
const layout = lire('app/ClientLayout.jsx');
const hero = lire('components/Hero.jsx');
const heroCode = sansCommentaires(hero);

console.log('\n--- 1. 🚨 L\'entête : logo + menu, rien d\'autre ---');
{
  t('🚨 la pilule téléphone est marquée', /className="header-tel"/.test(layout));
  t('🚨 elle disparaît sous 1024 px', /\.header-tel \{ display: none !important; \}/.test(css));
  t('…dans le même bloc que le CTA de l\'entête',
    /@media \(max-width: 1023\.98px\)[\s\S]{0,400}\.header-tel \{ display: none/.test(css));
  t('🚨 elle reste sur BUREAU — le numéro n\'est pas supprimé', /company\.phoneHref/.test(layout));
  t('le hamburger reste', /header-hamburger/.test(layout));
}

console.log('\n--- 2. 🚨 DEUX portes dans le hero, jamais trois ---');
{
  // ⚠️ CE TEST EXIGEAIT UN SEUL BOUTON. Il a été retourné sciemment.
  //
  // Le défaut d'origine était CINQ appels à l'action sur le premier écran
  // à 390 px. Passer à un seul l'a réglé — mais a aussi enterré le
  // simulateur, qui est la seule chose du site qu'aucun concurrent du coin
  // n'offre. Deux boutons de poids DIFFÉRENTS ne refont pas le défaut de
  // cinq boutons identiques : l'un décide, l'autre fait voir.
  //
  // Ce qui reste verrouillé : le total. Deux, et la porte du téléphone
  // n'est plus au premier écran.
  const boutons = heroCode.match(/<CTAButton[^>]*href=/g) || [];
  t('🚨 exactement deux boutons', boutons.length === 2, `${boutons.length}`);
  t('🚨 le primaire est « Réserver ma date », en crème',
    /<CTAButton href="\/soumission" variant="creme">Réserver ma date<\/CTAButton>/.test(heroCode));
  t('🚨 le secondaire mène au simulateur, en contour',
    /<CTAButton href="\/simulateur" variant="outlineCreme">Voir ma maison illuminée<\/CTAButton>/.test(heroCode));
  t('🚨 les deux poids sont DIFFÉRENTS — sinon c\'est deux fois la même porte',
    /variant="creme"/.test(heroCode) && /variant="outlineCreme"/.test(heroCode));
  t('🚨 plus de gros bouton « Appeler … »', !/variant="outlineLight">Appeler/.test(heroCode));
  t('🚨 le téléphone a quitté le premier écran', !/hero-tel/.test(heroCode));
  // Sur téléphone les deux boutons prennent toute la largeur : le pouce ne
  // doit pas viser.
  t('…et sur mobile ils sont pleine largeur',
    /\.hero-boutons > \* \{ width: 100%; \}/.test(css));
}

console.log('\n--- 3. 🚨 La ligne de saison ne se lit qu\'UNE fois ---');
{
  const bandeau = lire('components/BandeauRarete.jsx');
  t('🚨 elle a quitté le hero', !/rarete/.test(heroCode));
  t('🚨 plus de « Installations octobre–novembre »', !/Installations octobre/.test(heroCode));
  t('🚨 le bandeau la porte, et il la compose par lib/season.js',
    /ligneSaison/.test(bandeau) && /segments\.map/.test(bandeau));
  t('🚨 UNE seule écriture de la phrase dans tout le dépôt',
    /export function ligneSaison/.test(lire('lib/season.js')));
  // La date de fermeture est descendue en bas de l'accueil, dans la
  // section de réservation.
  t('🚨 la fermeture est dans la section de réservation',
    /Réservations fermées le \{fermeture\}/.test(lire('app/page.jsx')));
}

console.log('\n--- 4. Ce à quoi on ne touche pas ---');
{
  t('🚨 le bandeau de rareté est intact', /<BandeauRarete/.test(lire('app/layout.jsx')));
  t('🚨 le pixel est intact', /eventID/.test(lire('lib/meta-lead-event.js')));
  t('🚨 l\'envoi vers /api/lead est intact', /fetch\("\/api\/lead"/.test(lire('components/data.js')));
  // Le formulaire a changé de place, pas de nature : il est en section 8
  // de l'accueil, et c'est le MÊME QuoteForm que /soumission.
  t('🚨 le formulaire vit en bas de l\'accueil et envoie toujours',
    /<QuoteForm/.test(lire('app/page.jsx')) && /onSubmit=\{submit\}/.test(lire('components/QuoteForm.jsx')));
  t('le consentement est intact', fs.existsSync(path.join(ROOT, 'components/ConsentementAttribution.jsx')));
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
