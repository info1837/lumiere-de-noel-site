// Le défilement de l'accueil, filmé — mobile et bureau.
//
//   node scripts/captures-vie.mjs      (serveur sur :3000, ffmpeg requis)
//
// Une animation ne se relit pas sur une capture fixe. On filme donc un
// défilement lent de bout en bout, puis ffmpeg en fait un GIF assez
// léger pour tenir dans une PR.
//
// On vérifie aussi, à la fin, que les effets sont RÉELLEMENT là : qu'un
// garde passe ne prouve pas qu'une classe arrive sur un élément.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const SORTIE = path.join(ROOT, 'docs/vie');
const TMP = path.join(ROOT, '.captures-tmp');
fs.mkdirSync(SORTIE, { recursive: true });
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const nav = await chromium.launch();

const FORMATS = [
  { nom: 'mobile', viewport: { width: 375, height: 812 }, largeurGif: 260 },
  { nom: 'bureau', viewport: { width: 1440, height: 900 }, largeurGif: 560 },
  // « Réduire les animations » coché (réglage macOS courant) : fondus
  // seuls, rien ne se déplace. C'est ce cas qu'on avait pris pour une
  // page sans effets sur ordinateur.
  { nom: 'bureau-reduit', viewport: { width: 1440, height: 900 }, largeurGif: 560, reducedMotion: 'reduce' },
];

for (const f of FORMATS) {
  const dossier = path.join(TMP, f.nom);
  fs.mkdirSync(dossier, { recursive: true });
  const ctx = await nav.newContext({
    viewport: f.viewport,
    deviceScaleFactor: 1,
    reducedMotion: f.reducedMotion || 'no-preference',
    recordVideo: { dir: dossier, size: f.viewport },
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.evaluate(() => document.fonts?.ready);
  // On laisse le hero s'allumer avant de partir.
  await page.waitForTimeout(1800);

  // Un défilement RÉGULIER, pas un saut : c'est le mouvement qu'on
  // filme, et un `scrollTo` instantané ne montrerait rien.
  await page.evaluate(async () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    // ⚠️ Le pas règle le POIDS du GIF autant que la vitesse : à 14 px,
    // l'accueil faisait 40 s de vidéo et 8 Mo de GIF. À 26 px le
    // défilement reste lisible et le fichier tient sous 3 Mo.
    const pas = 26;
    for (let y = 0; y <= h; y += pas) {
      window.scrollTo(0, y);
      await new Promise((r) => requestAnimationFrame(r));
    }
  });
  await page.waitForTimeout(700);
  await ctx.close();   // ferme la vidéo

  const webm = fs.readdirSync(dossier).find((x) => x.endsWith('.webm'));
  if (!webm) { console.log(`  ✗ ${f.nom} — aucune vidéo`); continue; }
  const entree = path.join(dossier, webm);
  const gif = path.join(SORTIE, `defilement-${f.nom}.gif`);

  // Palette dédiée : un GIF sans palette calculée fait des aplats sales
  // sur du marine foncé, et c'est exactement ce qu'on filme.
  const palette = path.join(dossier, 'palette.png');
  const vf = `fps=8,scale=${f.largeurGif}:-1:flags=lanczos`;
  execFileSync('ffmpeg', ['-y', '-i', entree, '-vf', `${vf},palettegen=max_colors=96:stats_mode=diff`, palette], { stdio: 'ignore' });
  execFileSync('ffmpeg', ['-y', '-i', entree, '-i', palette,
    '-lavfi', `${vf} [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=3`, gif], { stdio: 'ignore' });
  const mo = (fs.statSync(gif).size / 1048576).toFixed(1);
  console.log(`  ✓ defilement-${f.nom}.gif (${mo} Mo)`);
}

// ── Les effets sont-ils VRAIMENT appliqués ? ────────────────────────
console.log('\n▸ Vérification dans le navigateur');
{
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    const q = (s) => document.querySelectorAll(s).length;
    return {
      classeRacine: document.documentElement.classList.contains('mvt'),
      texteRevele: q('.rv-t'),
      photosRevelees: q('.rv-p'),
      guirlandeHero: q('.hero-guirlande span'),
      bande: q('.defile-item'),

      frise: q('.frise-etape'),
    };
  });
  for (const [k, v] of Object.entries(r)) {
    const ok = v === true || (typeof v === 'number' && v > 0);
    console.log(`  ${ok ? '✅' : '❌'} ${k} = ${v}`);
  }
  // ⚠️ La bande se mesure DANS SA SECTION. Mesurée depuis le haut de
  // page, elle rendait 0 — ce qui est le comportement voulu (elle ne
  // tourne pas hors de vue) mais ressemblait à une panne.
  await page.evaluate(() => document.querySelector('.defile')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(800);
  const bande = await page.evaluate(() => ({
    animee: document.querySelectorAll('.defile--anime').length,
    etat: getComputedStyle(document.querySelector('.defile-piste')).animationPlayState,
  }));
  console.log(`  ${bande.animee ? '✅' : '❌'} bande animée DANS sa section = ${bande.animee} (${bande.etat})`);

  // Après un défilement, la frise doit s'être tracée et des points
  // allumés.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.55));
  await page.waitForTimeout(900);
  const apres = await page.evaluate(() => ({
    friseP: getComputedStyle(document.querySelector('.frise')).getPropertyValue('--frise-p').trim(),
    pointsAllumes: document.querySelectorAll('.frise-etape.atteinte').length,
    curseur: getComputedStyle(document.querySelector('.revel')).getPropertyValue('--revel-pos').trim(),
  }));
  console.log(`  ✅ après défilement : frise=${apres.friseP} points=${apres.pointsAllumes}` +
              ` curseur=${apres.curseur}`);
  await ctx.close();
}

await nav.close();
fs.rmSync(TMP, { recursive: true, force: true });
console.log(`\nGIF dans ${path.relative(ROOT, SORTIE)}/\n`);
