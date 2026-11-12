// « Travail en hauteur, par notre propre équipe »
//
//   node scripts/check-travail-hauteur.mjs
//
// La carte vend la COMPÉTENCE, pas le confort (« Vous ne montez jamais dans
// l'échelle » vendait la corvée qu'on s'épargne). Elle ne dit que ce qui est
// vrai et visible : notre équipe, échelles, harnais, nacelle au besoin.
//
// ⚠️ PLUS D'ASSURANCE (2026-11-12) : pas de couverture en place. La garde
// qui l'interdit partout est scripts/check-assurance.mjs.

import fs from 'fs';
import path from 'path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
let pass = 0, fail = 0;
const t = (nom, ok, d = '') => { console.log(`  ${ok ? '✅' : '❌'} ${nom}${d ? ` — ${d}` : ''}`); ok ? pass++ : fail++; };
const lire = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const sansCommentaires = (x) => x
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const data = lire('components/data.js');
const dataCode = sansCommentaires(data);

console.log('\n--- 1. 🚨 La carte ---');
{
  t('🚨 « Travail en hauteur, par notre propre équipe »',
    /title: "Travail en hauteur, par notre propre équipe"/.test(dataCode));
  const carte = dataCode.slice(dataCode.indexOf('Travail en hauteur, par'), dataCode.indexOf('Travail en hauteur, par') + 300);
  t('l\'équipement', /Échelles, harnais et nacelle/.test(carte));
  t('🚨 plus de « Vous ne montez jamais dans l\'échelle »', !/Vous ne montez jamais dans l'échelle/.test(dataCode));
  t('« Service après-vente » est intact', /title: "Service après-vente"/.test(dataCode));
  t('whyUs reste la source unique de ces faits', /export const whyUs = \[/.test(data));
}

console.log('\n--- 2. 🚨 Plus aucun argument de CONFORT dans tout le dépôt ---');
{
  // Yahir : « reformule en argument de pro, pas de confort ». C'est un
  // PRINCIPE, pas une chaîne. Les commentaires qui citent l'ancienne
  // formulation sont légitimes — on ne les compte pas.
  const marcher = (d, acc = []) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (['node_modules', '.next', '.git', 'scripts'].includes(e.name)) continue;
      const q = path.join(d, e.name);
      if (e.isDirectory()) marcher(q, acc);
      else if (/\.(jsx?|mjs|css)$/.test(e.name)) acc.push(q);
    }
    return acc;
  };
  const CONFORT = /touchez jamais à une échelle|touchiez à une échelle|ne sortez jamais du salon|fini les chutes/i;
  const fautifs = [...marcher(path.join(ROOT, 'app')), ...marcher(path.join(ROOT, 'components'))]
    .filter((f) => CONFORT.test(sansCommentaires(fs.readFileSync(f, 'utf8'))));
  t('🚨 aucune formulation de confort ne reste', fautifs.length === 0,
    fautifs.map((f) => path.relative(ROOT, f)).join(' '));
  t('la carte « Clé en main » dit l\'interlocuteur unique',
    /Un seul interlocuteur, du premier croquis au retrait de janvier/.test(dataCode));
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
