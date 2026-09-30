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

console.log('\n--- 2. 🚨 UN bouton dans le hero ---');
{
  const boutons = heroCode.match(/<CTAButton[^>]*href=/g) || [];
  t('🚨 un seul CTAButton avec un lien', boutons.length === 1, `${boutons.length}`);
  t('🚨 c\'est « Réserver ma date »', /<CTAButton href="\/soumission" variant="gold">Réserver ma date<\/CTAButton>/.test(heroCode));
  t('🚨 plus de gros bouton « Appeler … »', !/variant="outlineLight">Appeler/.test(heroCode));
  t('🚨 le téléphone est un LIEN texte', /<p className="hero-tel">[\s\S]{0,140}<a href=\{company\.phoneHref\}>/.test(heroCode));
  t('il se lit « ou appelez-nous »', /ou appelez-nous/.test(heroCode));
  t('le lien est discret, pas un bouton', /\.hero-tel a \{[\s\S]{0,200}text-decoration: underline/.test(css));
}

console.log('\n--- 3. 🚨 La ligne de rareté ne se lit plus deux fois ---');
{
  t('🚨 elle a quitté le hero', !/rarete\?\.texte/.test(heroCode), 'plus de rarete.texte');
  t('🚨 plus de « Installations octobre–novembre »', !/Installations octobre/.test(heroCode));
  t('🚨 le BANDEAU la porte toujours', /msg\.segments\.map/.test(lire('components/BandeauRarete.jsx')));
  t('🚨 la fermeture reste sous le bouton, en petit',
    /className="hero-fermeture"/.test(heroCode));
  t('…et elle est bien petite', /\.hero-fermeture \{[\s\S]{0,260}font-size: 13\.5px/.test(css));
}

console.log('\n--- 4. Ce à quoi on ne touche pas ---');
{
  t('🚨 le bandeau de rareté est intact', /<BandeauRarete/.test(lire('app/layout.jsx')));
  t('🚨 le pixel est intact', /eventID/.test(lire('lib/meta-lead-event.js')));
  t('🚨 l\'envoi vers /api/lead est intact', /fetch\("\/api\/lead"/.test(lire('components/data.js')));
  t('le formulaire du hero envoie toujours', /onSubmit=\{submit\}/.test(hero));
  t('le consentement est intact', /ConsentementAttribution/.test(lire('components/QuoteForm.jsx')) || fs.existsSync(path.join(ROOT, 'components/ConsentementAttribution.jsx')));
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
