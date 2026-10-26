// Aucune animation permanente sur la page.
//
//   node scripts/check-rien-ne-boucle.mjs
//
// Après les quatre blocs de respiration, il restait une boucle : la guirlande
// pulsait toutes les 2 secondes, sans fin, sur toutes les pages. Une lumière
// qui clignote sans arrêt attire l'œil en continu — donc elle le retient sur
// elle, et pas sur le texte.
//
// Passe « effets sobres » (2026-10-26) : la neige du hero, le point du
// bandeau et la bande des réalisations bouclaient encore. Ils sont partis.
// Seule reste la démo des DEL de l'éclairage permanent : l'animation y EST
// le produit montré. Le détail des règles : scripts/check-animations.mjs.

import fs from 'fs';
import path from 'path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
let pass = 0, fail = 0;
const t = (nom, ok, d = '') => { console.log(`  ${ok ? '✅' : '❌'} ${nom}${d ? ` — ${d}` : ''}`); ok ? pass++ : fail++; };
const lire = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const css = lire('app/globals.css');
// Les commentaires citent les anciennes boucles : les lire ferait passer
// des assertions sur du texte explicatif.
const cssNu = css.replace(/\/\*[\s\S]*?\*\//g, '');

console.log('\n--- 1. 🚨 Plus AUCUNE animation infinie, sauf la démo des DEL ---');
{
  const infinies = [...cssNu.matchAll(/([^{}]+)\{[^{}]*animation[^{}:]*:[^{};]*infinite[^{};]*;/g)]
    .map((m) => m[1].trim().replace(/\s+/g, ' '));
  const AUTORISEES = ['.led--twinkle', '.led--chase', '.led--breathe'];
  const intruses = infinies.filter((r) => !AUTORISEES.includes(r));
  t('🚨 aucune boucle décorative ne subsiste', intruses.length === 0, intruses.join(' | ') || 'aucune');
  t('🚨 la neige du hero est partie', !infinies.includes('.flake') && !/snowFall/.test(cssNu));
  t('🚨 le point du bandeau ne clignote plus', !infinies.includes('.bandeau-rarete__pastille'));
  t('🚨 la bande des réalisations ne tourne plus', !/defileGauche/.test(cssNu));
  t('🚨 les puces de liste ne scintillent pas', !/\.bulb--tw \{ animation/.test(cssNu));
  t('🚨 la guirlande LightString (morte) est retirée', !/lsAllume|\.ls-bulb/.test(cssNu)
    && !fs.existsSync(path.join(ROOT, 'components/LightString.jsx')));
  t('la démo d\'éclairage permanent garde ses DEL (c\'est le produit)',
    AUTORISEES.every((c) => infinies.includes(c)));
}

console.log('\n--- 2. Le flocon décoratif reste du décor ---');
{
  t('🚨 son opacité reste à 0,035',
    /width: 230px; height: 230px; opacity: 0\.035;/.test(cssNu));
  t('il ne bouge pas', /\.snowy::before \{/.test(cssNu) && !/\.snowy::before[\s\S]{0,400}animation:/.test(cssNu));
}

console.log('\n--- 3. Ce à quoi on ne touche pas ---');
{
  t('🚨 la barre du bas garde son comportement',
    /mobile-bottom-bar\$\{visible \? " est-visible" : ""\}/.test(lire('app/ClientLayout.jsx')));
  t('🚨 le pixel est intact', /eventID/.test(lire('lib/meta-lead-event.js')));
  t('🚨 l\'envoi vers /api/lead est intact', /fetch\("\/api\/lead"/.test(lire('components/data.js')));
  t('🚨 le bandeau de rareté est intact', /<BandeauRarete/.test(lire('app/layout.jsx')));
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
