// Le vocabulaire du positionnement — « places limitées », pas « gratuit ».
//
//   node scripts/check-vocabulaire.mjs
//
// « Soumission gratuite » sur un bouton vend le prix : ça dit « ça ne vous
// engage à rien », donc « ce n'est pas grave si vous ne venez pas ». Sur un
// service haut de gamme à places limitées, c'est l'inverse du message.
//
// Ce harnais ne cherche pas le mot n'importe où : il regarde les TITRES et
// les BOUTONS. Le petit texte sous le formulaire garde le droit de
// rassurer — c'est là que quelqu'un qui a déjà décidé hésite une dernière
// fois.

import fs from 'fs';
import path from 'path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
let pass = 0, fail = 0;
const t = (nom, ok, d = '') => { console.log(`  ${ok ? '✅' : '❌'} ${nom}${d ? ` — ${d}` : ''}`); ok ? pass++ : fail++; };

function fichiers(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git', 'scripts'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) fichiers(p, acc);
    else if (/\.(jsx?|mjs)$/.test(e.name)) acc.push(p);
  }
  return acc;
}
const TOUS = [...fichiers(path.join(ROOT, 'app')), ...fichiers(path.join(ROOT, 'components'))];
const rel = (p) => path.relative(ROOT, p);
const lire = (p) => fs.readFileSync(p, 'utf8');

// Le code parle de « calculatrice » (route, composant, import) sans que ce
// soit du texte pour le visiteur. On ne compare que ce qui s'AFFICHE.
const sansCode = (s) => s
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')
  .replace(/import[^;]+;/g, '')
  .replace(/href=["'][^"']*["']/g, '')
  .replace(/from ["'][^"']*["']/g, '')
  .replace(/function \w+/g, '')
  .replace(/source: '[^']*'/g, '');

console.log('\n--- 1. 🚨 « Soumission gratuite » a disparu de l\'interface ---');
{
  const coupables = TOUS.filter((p) => /soumission gratuite/i.test(sansCode(lire(p))));
  t('🚨 plus une seule occurrence', coupables.length === 0, coupables.map(rel).join(' '));
}

console.log('\n--- 2. 🚨 Les boutons disent « Réserver ma date » ---');
{
  const ui = lire(path.join(ROOT, 'components/ui.jsx'));
  t('🚨 le libellé par défaut de PageHero', /ctaLabel = "Réserver ma date"/.test(ui));
  const layout = lire(path.join(ROOT, 'app/ClientLayout.jsx'));
  t('🚨 le bouton de l\'en-tête', /cta-label">Réserver ma date</.test(layout));
  t('🚨 la barre du bas sur téléphone', /Réserver ma date/.test(layout.split('bottom-bar-quote')[1] || ''));
  const cta = TOUS.map(lire).join('\n').match(/>Réserver ma date</g) || [];
  t('le libellé est posé partout', cta.length >= 10, `${cta.length} bouton(s)`);
}

console.log('\n--- 3. « Calculatrice » devient « Estimer mon projet » ---');
{
  const affiche = TOUS.filter((p) => />\s*Calculatrice\s*<|label: "Calculatrice"|"Calculatrice de prix"/.test(sansCode(lire(p))));
  t('🚨 plus de « Calculatrice » à l\'écran', affiche.length === 0, affiche.map(rel).join(' '));
  t('🚨 …mais la ROUTE /calculatrice existe toujours',
    fs.existsSync(path.join(ROOT, 'app/calculatrice/page.jsx')));
  const nav = lire(path.join(ROOT, 'app/ClientLayout.jsx'));
  t('la nav pointe encore vers /calculatrice', /href: "\/calculatrice"/.test(nav));
  t('avec le nouveau libellé', /label: "Estimer mon projet"/.test(nav));
  t('plus de « Prix en 60 s »', !TOUS.some((p) => /Prix en 60/.test(lire(p))));
}

console.log('\n--- 4. 🚨 Le seuil, pas un prix d\'appel ---');
{
  const restants = TOUS.filter((p) => /[Dd]ès 1 ?000 ?\$/.test(sansCode(lire(p))));
  t('🚨 plus de « dès 1 000 $ »', restants.length === 0, restants.map(rel).join(' '));
  const avec = TOUS.filter((p) => /artir de 1 000 \$/.test(lire(p)));
  t('« projets à partir de 1 000 $ » est posé', avec.length >= 3, `${avec.length} fichier(s)`);
}

console.log('\n--- 5. 🚨 Les méta et l\'OG ne promettent plus du gratuit ---');
{
  const layout = lire(path.join(ROOT, 'app/layout.jsx'));
  t('🚨 la description racine', !/gratuit/i.test(layout), 'layout.jsx');
  t('🚨 l\'OG aussi', !/Soumission gratuite/i.test(layout));
  t('elle dit la rareté', /nombre limité de propriétés/.test(layout));
  const metas = TOUS.filter((p) => {
    const s = lire(p);
    return /export const metadata|generateMetadata/.test(s) && /gratuit/i.test(sansCode(s));
  });
  t('🚨 aucune page ne promet du gratuit dans ses méta', metas.length === 0, metas.map(rel).join(' '));
}

console.log('\n--- 6. 🚨 « gratuit » survit UNE fois, près du formulaire ---');
{
  // Yahir : « Ils peuvent rester une fois en petit texte près du formulaire. »
  const form = lire(path.join(ROOT, 'components/QuoteForm.jsx'));
  t('🚨 le petit texte le dit encore', /gratuite et sans obligation/.test(form));
  const petit = /fontSize: 12[\s\S]{0,260}gratuite et sans obligation/.test(form);
  t('🚨 …et c\'est bien du PETIT texte (12 px)', petit);
  const ailleurs = TOUS.filter((p) => rel(p) !== 'components/QuoteForm.jsx' && /sans obligation/i.test(sansCode(lire(p))));
  t('🚨 nulle part ailleurs', ailleurs.length === 0, ailleurs.map(rel).join(' '));
  const rapide = TOUS.filter((p) => /réponse rapide/i.test(sansCode(lire(p))));
  t('plus de « réponse rapide »', rapide.length === 0, rapide.map(rel).join(' '));
}

console.log('\n--- 7. Ce à quoi on NE touche pas ---');
{
  // ⚠️ L'envoi ne vit PAS dans QuoteForm.jsx mais dans components/data.js.
  // Ma première assertion visait le mauvais fichier et échouait sur du
  // code parfaitement intact — un test qui ne regarde pas au bon endroit
  // ne protège rien.
  const envoi = lire(path.join(ROOT, 'components/data.js'));
  t('🚨 l\'envoi vers /api/lead est intact', /fetch\("\/api\/lead"/.test(envoi));
  const routeLead = lire(path.join(ROOT, 'app/api/lead/route.js'));
  t('🚨 la route qui relaie au CRM est intacte', /palencia-crm[^']*\/api\/leads/.test(routeLead));
  t('🚨 le consentement est intact', fs.existsSync(path.join(ROOT, 'components/ConsentementAttribution.jsx')));
  const pixel = lire(path.join(ROOT, 'lib/meta-lead-event.js'));
  t('🚨 le pixel et l\'event_id sont intacts', /eventID/.test(pixel) && /event_id/.test(pixel));
  t('la route /soumission existe toujours', fs.existsSync(path.join(ROOT, 'app/soumission/page.jsx')));
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
