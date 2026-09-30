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

console.log('\n--- 3. 🚨 Les autres marqueurs ASSURANCE n\'ont PAS bougé ---');
{
  // Yahir n'a demandé QUE ce titre. Élargir « assurés » ailleurs sans son
  // mot, c'est exactement ce que la consigne du 2026-08-30 interdisait.
  const barre = lire('components/ObjectionBar.jsx');
  t('🚨 la barre des objections ne parle toujours PAS d\'assurance',
    !/assur(é|e|ance)/i.test(sansCommentaires(barre)));
  t('…et garde sa note qui explique pourquoi', /Aucune mention d'assurance ici/.test(barre));
  const blog = lire('app/blog/posts.js');
  t('le billet de blogue garde sa formulation d\'origine',
    /Le travail en hauteur, c'est notre métier/.test(blog));
  const marqueurs = (data.match(/\/\/ ASSURANCE/g) || []).length;
  t('les marqueurs ASSURANCE restent en place pour le prochain lecteur', marqueurs >= 3, `${marqueurs}`);
}

console.log('\n--- 4. La carte reste rendue là où elle était ---');
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
