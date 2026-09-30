// « Travail en hauteur, par des professionnels assurés »
//
//   node scripts/check-travail-hauteur.mjs
//
// « Vous ne montez jamais dans l'échelle » vendait le CONFORT : la corvée
// qu'on s'épargne. Le nouveau titre vend la COMPÉTENCE. Le fond ne bouge
// pas — sécurité, équipement, assurance.

import fs from 'fs';
import path from 'path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
let pass = 0, fail = 0;
const t = (nom, ok, d = '') => { console.log(`  ${ok ? '✅' : '❌'} ${nom}${d ? ` — ${d}` : ''}`); ok ? pass++ : fail++; };
const lire = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
// Les commentaires CITENT l'ancienne formulation pour expliquer pourquoi
// elle a changé — quatrième fois que ce motif m'attrape si je l'oublie.
const sansCommentaires = (x) => x
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  .replace(/,\s*\/\/ ASSURANCE/g, ',');

const data = lire('components/data.js');
const dataCode = sansCommentaires(data);

console.log('\n--- 1. 🚨 Le titre ---');
{
  t('🚨 « Travail en hauteur, par des professionnels assurés »',
    /title: "Travail en hauteur, par des professionnels assurés"/.test(dataCode));
  t('🚨 plus de « Vous ne montez jamais dans l\'échelle »',
    !/Vous ne montez jamais dans l'échelle/.test(dataCode));
  t('🚨 plus de « Vous ne sortez jamais du salon » — c\'était le confort',
    !/Vous ne sortez jamais du salon/.test(dataCode));
}

console.log('\n--- 2. 🚨 Le fond est gardé : sécurité, équipement, assurance ---');
{
  const carte = dataCode.slice(
    dataCode.indexOf('Travail en hauteur'),
    dataCode.indexOf('Travail en hauteur') + 400);
  t('🚨 la sécurité', /équipement de sécurité/.test(carte), 'équipement de sécurité');
  t('🚨 l\'équipement', /Échelles/.test(carte));
  t('🚨 l\'assurance', /assurance couvre le chantier/.test(carte));
  t('la formation de l\'équipe', /formée pour la hauteur/.test(carte));
}

console.log('\n--- 3. 🚨 La police est active : tous les marqueurs le disent ---');
{
  // La consigne du 2026-08-30 disait : « le jour où la police démarre,
  // remettre « assurée » ici ET AUX AUTRES MARQUEURS ». Yahir a confirmé
  // le 2026-09-29. Ce test vérifie qu'aucun n'a été oublié — un marqueur
  // resté muet, c'est un argument qu'on a payé et qu'on n'utilise pas.
  const blog = sansCommentaires(lire('app/blog/posts.js'));
  t('🚨 le billet de blogue dit l\'assurance', /assurance qui couvre le chantier/.test(blog));
  t('🚨 …et plus « fini les chutes d\'échelle » (c\'était la peur, pas le métier)',
    !/fini les chutes d'échelle/.test(blog));

  t('🚨 le commercial dit « formée et assurée »',
    /travail en hauteur fait par notre équipe, formée et assurée/.test(dataCode));
  t('🚨 sa puce aussi', /Travail en hauteur par une équipe formée et assurée/.test(dataCode));

  t('🚨 le résidentiel ne vend plus le confort',
    !/sans que vous touchiez à une échelle/.test(dataCode));
  t('…il dit la compétence', /par une équipe formée pour le travail en hauteur/.test(dataCode));

  const marqueurs = (data.match(/\/\/ ASSURANCE/g) || []).length
    + (lire('app/blog/posts.js').match(/\/\/ ASSURANCE/g) || []).length;
  t('🚨 les étiquettes ASSURANCE restent, pour pouvoir tout repasser si la police s\'interrompt',
    marqueurs >= 4, `${marqueurs}`);

  // La barre des objections est le SEUL endroit laissé muet, et c'est un
  // choix documenté, pas un oubli.
  const barre = lire('components/ObjectionBar.jsx');
  t('la barre des objections reste muette — choix, pas oubli',
    !/assur(é|e|ance)/i.test(sansCommentaires(barre)) && /Yahir tranche/.test(barre));
  t('🚨 aucune note périmée ne dit plus « tant que la police n\'est pas active »',
    !/tant que la\s*\n?\/\/ police n'est pas active/.test(barre) && !/police n'est pas active/.test(barre));
}

console.log('\n--- 4. 🚨 Plus aucun argument de CONFORT dans tout le dépôt ---');
{
  // Yahir : « reformule en argument de pro, pas de confort ». C'est un
  // PRINCIPE, pas une chaîne. Le même argument vivait à cinq endroits :
  // le titre du hero, la carte « travail en hauteur », la carte « clé en
  // main », une puce du service résidentiel et son intro par ville.
  //
  // Les commentaires qui CITENT l'ancienne formulation pour expliquer
  // pourquoi elle a changé sont légitimes — on ne les compte pas.
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
  t('la carte « Clé en main » dit maintenant l\'interlocuteur unique',
    /Un seul interlocuteur, du premier croquis au retrait de janvier/.test(dataCode));
  t('🚨 la puce du résidentiel dit l\'équipe assurée',
    /travail en hauteur par une équipe assurée/.test(dataCode));
}

console.log('\n--- 5. La carte reste rendue là où elle était ---');
{
  const page = lire('app/page.jsx');
  t('whyUs est toujours parcouru', /whyUs\.map/.test(page));
  const cartes = (dataCode.match(/^\s{2}\{/gm) || []).length;
  t('les quatre cartes « pourquoi nous » existent toujours',
    /export const whyUs = \[/.test(data) && cartes > 0);
  t('« Service après-vente » est intact', /title: "Service après-vente"/.test(dataCode));
  t('« Clé en main » est intact', /title: "Clé en main"/.test(dataCode));
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
