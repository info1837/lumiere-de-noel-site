// AUCUNE MENTION D'ASSURANCE sur le site public (2026-11-12).
//
//   node scripts/check-assurance.mjs           — le code source (lancé par `npm run build`)
//   node scripts/check-assurance.mjs --build   — en plus, les pages construites (.next) : HTML, JSON-LD, RSC
//
// L'entreprise n'a pas d'assurance responsabilité en place pour ce travail.
// Le site ne doit ni le dire ni le laisser entendre : pas de « assurée »,
// pas d'« attestation d'assurance sur demande », pas de question FAQ sur
// l'assurance, rien dans les meta, le JSON-LD ou les alt. Pas de version
// adoucie non plus (« couverture », « protégé », « certifié »…).
//
// Ne rien remettre tant que Yahir n'a pas confirmé que la couverture est
// en place — voir CLAUDE.md, « Affirmations ».
//
// Les COMMENTAIRES ne comptent pas (ils peuvent expliquer pourquoi c'est
// parti). Tout le reste compte : textes, attributs, noms de classes.

import fs from 'fs';
import path from 'path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const DOSSIERS = ['app', 'components', 'lib', 'public'];
const TEXTE = /\.(jsx?|mjs|tsx?|css|html?|json|txt|xml|md|webmanifest|svg)$/i;

// Le nom, le participe (avec accent : « assuré », « assurée(s) »), l'assureur,
// l'anglais. Le verbe « assurer » / « Assure-toi » n'est pas une affirmation
// de couverture, mais le site public n'en a plus besoin non plus — voir le
// scan des pages construites plus bas, qui refuse « assur » tout court.
const INTERDIT = /assuranc|assureur|assuré|insur(ed|ance)|attestation d.assurance|responsabilité civile/i;

const sansCommentaires = (x, fichier) => {
  if (/\.html?$/i.test(fichier) || /\.svg$/i.test(fichier)) return x.replace(/<!--[\s\S]*?-->/g, '');
  if (/\.(json|txt|xml|md|webmanifest)$/i.test(fichier)) return x;
  return x
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:"'\\])\/\/.*$/gm, '$1');
};

let pass = 0, fail = 0;
const t = (nom, ok, d = '') => { console.log(`  ${ok ? '✅' : '❌'} ${nom}${d ? ` — ${d}` : ''}`); ok ? pass++ : fail++; };

const marcher = (d, filtre, acc = []) => {
  if (!fs.existsSync(d)) return acc;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (['node_modules', '.git', 'cache'].includes(e.name)) continue;
    const q = path.join(d, e.name);
    if (e.isDirectory()) marcher(q, filtre, acc);
    else if (filtre.test(e.name)) acc.push(q);
  }
  return acc;
};

console.log('\n--- 0. Le motif attrape bien ce qu\'il doit ---');
{
  for (const ex of ['Assurance responsabilité en vigueur', 'équipe formée et assurée', 'professionnels assurés',
    "attestation d'assurance sur demande", 'Avez-vous une assurance responsabilité?', 'fully insured'])
    t(`refuse « ${ex} »`, INTERDIT.test(ex));
  t('ignore un commentaire', !INTERDIT.test(sansCommentaires('a = 1; // ASSURANCE retirée', 'x.js')));
  t('garde une URL dans une chaîne', /https:\/\/x/.test(sansCommentaires('u = "https://x"', 'x.js')));
}

console.log('\n--- 1. 🚨 Le code source public ne parle pas d\'assurance ---');
{
  const fichiers = DOSSIERS.flatMap((d) => marcher(path.join(ROOT, d), TEXTE));
  const fautes = [];
  for (const f of fichiers) {
    const code = sansCommentaires(fs.readFileSync(f, 'utf8'), f);
    code.split('\n').forEach((ligne, i) => {
      if (INTERDIT.test(ligne)) fautes.push(`${path.relative(ROOT, f)}:${i + 1}  ${ligne.trim().slice(0, 120)}`);
    });
  }
  t(`🚨 aucune mention dans ${fichiers.length} fichiers (app, components, lib, public)`, fautes.length === 0,
    fautes.length ? '\n      ' + fautes.join('\n      ') : '');
}

if (process.argv.includes('--build')) {
  console.log('\n--- 2. 🚨 Les pages construites (.next) : ni « assur » tout court ---');
  const dir = path.join(ROOT, '.next/server/app');
  const pages = marcher(dir, /\.(html|rsc|body|meta)$/);
  t('le build existe', pages.length > 0, `${pages.length} fichiers`);
  const fautes = pages.filter((f) => /assur|insur/i.test(fs.readFileSync(f, 'utf8')))
    .map((f) => path.relative(ROOT, f));
  t('🚨 aucune page construite ne contient « assur »', fautes.length === 0, fautes.join(' '));
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
