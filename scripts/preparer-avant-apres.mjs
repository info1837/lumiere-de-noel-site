// Prépare les deux images « avant » pour les comparateurs.
//
//   node scripts/preparer-avant-apres.mjs
//
// 🚨 POURQUOI CES IMAGES EXISTENT.
//
// Les 23 photos du dépôt sont TOUTES des photos de soir, prises après
// installation. Il n'y avait donc aucune paire avant/après, et le
// comparateur de l'accueil montrait la MÊME photo des deux côtés, l'une
// assombrie au filtre — honnête, mais ce n'est pas un avant/après.
//
// Yahir a fait générer deux « avant » : la même photo, lumières de Noël
// retirées. Ce script les prépare.
//
// ⚠️ `fit: 'fill'`, ET C'EST LE POINT.
//
// Un comparateur superpose deux images dans un même cadre et déplace une
// couture entre les deux. Si elles n'ont pas EXACTEMENT les mêmes
// dimensions, la ligne de toit se décale d'un côté à l'autre de la
// couture, et l'œil le voit immédiatement. `fill` force la dimension
// cible sans recadrer — on accepte une déformation microscopique plutôt
// qu'un décalage visible :
//
//   Léry           2336×1744 (1,3394) → 1920×1440 (1,3333)  écart 0,46 %
//   Sainte-Julienne 1744×2336 (0,7466) → 1200×1600 (0,7500)  écart 0,45 %
//
// `cover` aurait recadré et perdu des pixels sur un bord : la maison
// n'aurait plus été au même endroit dans le cadre. C'est exactement ce
// qu'on veut éviter.
//
// Le script est idempotent : relancé, il refait les mêmes JPEG.

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const RACINE = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const IMG = path.join(RACINE, 'public/images');
const PREUVES = path.join(RACINE, 'docs/avant-apres');

// ⚠️ Le fichier source de Léry arrive avec un ACCENT dans son nom.
// Un accent dans une URL d'image est encodé en %C3%A9 par certains
// navigateurs et laissé tel quel par d'autres ; sur un hébergement
// sensible à la casse et à l'encodage, c'est un 404 qu'on ne reproduit
// pas en local. Le nom servi est donc sans accent.
const PAIRES = [
  {
    nom: 'Léry',
    sourceAvant: ['before-léry.png', 'before-lery.png'],
    sortieAvant: 'before-lery.jpg',
    apres: 'reel/noel-lery-01.jpg',
  },
  {
    nom: 'Sainte-Julienne',
    sourceAvant: ['before-ste-julienne.png', 'before-ste-julienne.jpg'],
    sortieAvant: 'before-ste-julienne.jpg',
    apres: 'reel/noel-ste-julienne-01.jpg',
  },
];

const QUALITE = 82;

fs.mkdirSync(PREUVES, { recursive: true });

let fait = 0;
for (const p of PAIRES) {
  const source = p.sourceAvant
    .map((f) => path.join(IMG, f))
    .find((f) => fs.existsSync(f));
  const apres = path.join(IMG, p.apres);
  const sortie = path.join(IMG, p.sortieAvant);

  if (!source) {
    console.log(`⏭  ${p.nom} : aucune source (${p.sourceAvant.join(' / ')}) — déjà préparée ?`);
    continue;
  }
  if (!fs.existsSync(apres)) {
    console.error(`❌ ${p.nom} : la photo réelle manque — ${p.apres}`);
    process.exitCode = 1;
    continue;
  }

  const cible = await sharp(apres).metadata();
  const avant = await sharp(source).metadata();

  // On écrit dans un fichier temporaire : la sortie peut être la source
  // (un .jpg déjà préparé qu'on relance), et sharp ne sait pas lire et
  // écrire le même fichier.
  const temporaire = sortie + '.tmp';
  await sharp(source)
    .resize(cible.width, cible.height, { fit: 'fill' })
    .jpeg({ quality: QUALITE, mozjpeg: true })
    .toFile(temporaire);
  fs.renameSync(temporaire, sortie);

  // Le PNG d'origine part : 4 à 6 Mo chacun, pour une image que le
  // navigateur recevra en JPEG de quelques centaines de Ko.
  if (source !== sortie) fs.unlinkSync(source);

  const ko = Math.round(fs.statSync(sortie).size / 1024);
  console.log(`✅ ${p.nom.padEnd(16)} ${avant.width}×${avant.height} ${avant.format}` +
              ` → ${cible.width}×${cible.height} jpeg q${QUALITE}  (${ko} Ko)`);
  fait++;

  // ── LA PREUVE QUE LES DEUX SE SUPERPOSENT ────────────────────────
  //
  // Les deux images à 50 % l'une sur l'autre. Si le cadrage diffère,
  // les arêtes de toit et la voiture apparaissent EN DOUBLE — c'est
  // visible d'un coup d'œil, et c'est tout l'intérêt de cette sortie.
  const avantRedim = await sharp(sortie).ensureAlpha().toBuffer();
  const superposition = await sharp(apres)
    .composite([{ input: avantRedim, blend: 'over', opacity: 0.5 }])
    .jpeg({ quality: 88 })
    .toBuffer();
  const chemin = path.join(PREUVES, `superposition-${p.sortieAvant.replace(/^before-|\.jpg$/g, '')}.jpg`);
  fs.writeFileSync(chemin, superposition);
  console.log(`   ↳ superposition 50 % : ${path.relative(RACINE, chemin)}`);
}

// ── Vérification finale : les paires ont-elles VRAIMENT la même taille ?
console.log('\n▸ Les deux moitiés de chaque comparateur');
let ok = true;
for (const p of PAIRES) {
  const a = path.join(IMG, p.sortieAvant);
  const b = path.join(IMG, p.apres);
  if (!fs.existsSync(a) || !fs.existsSync(b)) { ok = false; console.log(`  ❌ ${p.nom} : fichier manquant`); continue; }
  const [ma, mb] = await Promise.all([sharp(a).metadata(), sharp(b).metadata()]);
  const pareil = ma.width === mb.width && ma.height === mb.height;
  if (!pareil) ok = false;
  console.log(`  ${pareil ? '✅' : '❌'} ${p.nom.padEnd(16)} avant ${ma.width}×${ma.height}  ·  après ${mb.width}×${mb.height}`);
}

console.log(fait ? `\n${fait} paire(s) préparée(s).` : '\nRien à faire — tout est déjà préparé.');
if (!ok) process.exitCode = 1;
