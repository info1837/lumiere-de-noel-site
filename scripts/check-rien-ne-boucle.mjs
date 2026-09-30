// Aucune animation permanente sur la page.
//
//   node scripts/check-rien-ne-boucle.mjs
//
// Après les quatre blocs de respiration, il restait une boucle : la guirlande
// pulsait toutes les 2 secondes, sans fin, sur toutes les pages. Une lumière
// qui clignote sans arrêt attire l'œil en continu — donc elle le retient sur
// elle, et pas sur le texte.
//
// La neige du hero est la seule exception assumée : c'est une chute, pas un
// clignotement, et elle vit dans le premier écran uniquement (bloc 4).

import fs from 'fs';
import path from 'path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
let pass = 0, fail = 0;
const t = (nom, ok, d = '') => { console.log(`  ${ok ? '✅' : '❌'} ${nom}${d ? ` — ${d}` : ''}`); ok ? pass++ : fail++; };
const lire = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const css = lire('app/globals.css');
// Mes commentaires citent lsWave et l'ancienne opacité : les lire ferait
// passer des assertions sur du texte explicatif.
const cssNu = css.replace(/\/\*[\s\S]*?\*\//g, '');
const guirlande = lire('components/LightString.jsx');

console.log('\n--- 1. 🚨 La guirlande s\'allume une fois, puis se tait ---');
{
  t('🚨 la boucle est retirée', !/lsWave/.test(cssNu) && !/infinite/.test(cssNu.match(/\.ls-bulb \{[^}]*\}/)?.[0] || ''));
  t('🚨 un simple fondu d\'une seconde', /@keyframes lsAllume \{ from \{ opacity: 0; \} to \{ opacity: 1; \} \}/.test(cssNu));
  t('🚨 …joué une seule fois', /\.ls-bulb \{ animation: lsAllume 1s ease both; \}/.test(cssNu));
  // `both` et pas `forwards` : sans l'état de départ, les ampoules
  // s'afficheraient allumées puis sauteraient à zéro pour refaire le fondu.
  t('🚨 l\'état de départ est appliqué avant le premier rendu (both)',
    /animation: lsAllume 1s ease both;/.test(cssNu));
  t('🚨 le décalage par ampoule est retiré (il n\'anime plus rien)',
    !/animationDelay/.test(guirlande));
  t('la guirlande reste allumée sous prefers-reduced-motion',
    /\.ls-bulb \{ animation: none; opacity: 1; \}/.test(cssNu));
}

console.log('\n--- 2. 🚨 Plus AUCUNE animation infinie, sauf la neige du hero ---');
{
  // On lit toutes les règles qui déclarent une animation sans fin.
  const infinies = [...cssNu.matchAll(/([^{}]+)\{[^{}]*animation[^{}:]*:[^{};]*infinite[^{};]*;/g)]
    .map((m) => m[1].trim().replace(/\s+/g, ' '));
  // Trois exceptions, et chacune a sa raison :
  //   .flake                      la chute de neige du hero (bloc 4) — une
  //                               chute, pas un clignotement, premier écran
  //                               seulement ;
  //   .bandeau-rarete__pastille   le point clignotant devant « Octobre »,
  //                               demandé nommément ;
  //   .led--twinkle/chase/breathe la démo interactive de l'éclairage
  //                               permanent sur /eclairage-architectural :
  //                               l'animation EST le produit montré, la
  //                               couper viderait la démo de son sens.
  const AUTORISEES = ['.flake', '.bandeau-rarete__pastille',
    '.led--twinkle', '.led--chase', '.led--breathe'];
  const intruses = infinies.filter((r) => !AUTORISEES.includes(r));
  t('🚨 aucune boucle décorative ne subsiste', intruses.length === 0, intruses.join(' | ') || 'aucune');
  t('🚨 les puces de liste ne scintillent plus (5 pages)',
    !/\.bulb--tw \{ animation/.test(cssNu));
  t('🚨 le feston non plus', !/festoonGlow \d/.test(cssNu.match(/\.festoon::before \{[^}]*\}/)?.[0] || ''));
  t('la neige du hero, elle, tombe toujours', infinies.includes('.flake'));
  t('le point du bandeau clignote toujours (demandé nommément)',
    infinies.includes('.bandeau-rarete__pastille'));
  t('la démo d\'éclairage permanent garde ses DEL (c\'est le produit)',
    ['.led--twinkle', '.led--chase', '.led--breathe'].every((c) => infinies.includes(c)));
}

console.log('\n--- 3. 🚨 Le flocon décoratif recule ---');
{
  t('🚨 son opacité est divisée par deux (0,07 → 0,035)',
    /width: 230px; height: 230px; opacity: 0\.035;/.test(cssNu));
  t('il reste en place — c\'est du décor, pas une animation',
    /\.snowy::before \{/.test(cssNu) && !/\.snowy::before[\s\S]{0,400}animation:/.test(cssNu));
}

console.log('\n--- 4. Ce à quoi on ne touche pas ---');
{
  t('🚨 la barre du bas garde son comportement (bloc 2)',
    /mobile-bottom-bar\$\{visible \? " est-visible" : ""\}/.test(lire('app/ClientLayout.jsx')));
  t('🚨 la neige reste dans le hero, 17 flocons (bloc 4)',
    /const FLOCONS = 17;/.test(lire('components/FestiveLayer.jsx')));
  t('🚨 les trois effets d\'apparition restent (bloc 4)',
    /\.reveal--a \{/.test(cssNu) && /\.reveal--b \{/.test(cssNu) && /\.reveal--c \{/.test(cssNu));
  t('🚨 le pixel est intact', /eventID/.test(lire('lib/meta-lead-event.js')));
  t('🚨 l\'envoi vers /api/lead est intact', /fetch\("\/api\/lead"/.test(lire('components/data.js')));
  t('🚨 le bandeau de rareté est intact', /<BandeauRarete/.test(lire('app/layout.jsx')));
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
