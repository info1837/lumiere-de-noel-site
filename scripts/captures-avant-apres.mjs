// Les captures des deux comparateurs — mobile 375 px et bureau.
//
//   node scripts/captures-avant-apres.mjs      (serveur sur :3000)
//
// On capture la poignée à trois positions : à gauche (tout « avant »),
// au milieu (l'état de départ), à droite (tout « après »). C'est la
// seule façon de montrer sur une image fixe que les deux moitiés se
// superposent — et que la couture ne décale rien.

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const SORTIE = path.join(ROOT, 'docs/avant-apres');
fs.mkdirSync(SORTIE, { recursive: true });
const BASE = process.env.BASE_URL || 'http://localhost:3000';

const MOBILE = { width: 375, height: 812 };
const BUREAU = { width: 1440, height: 900 };

const nav = await chromium.launch();

/** Pose le curseur du comparateur à une position donnée. */
async function placer(page, pourcent) {
  await page.evaluate((v) => {
    const r = document.querySelector('.revel-curseur');
    if (!r) return;
    const set = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value').set;
    set.call(r, String(v));
    r.dispatchEvent(new Event('input', { bubbles: true }));
  }, pourcent);
  await page.waitForTimeout(400);
}

async function capturer(url, viewport, nom, { ancre = '.revel', positions = [50] } = {}) {
  const ctx = await nav.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.evaluate(() => document.fonts?.ready);
    const el = page.locator(ancre).first();
    await el.scrollIntoViewIfNeeded();
    // Le balayage d'entrée dure ~1,9 s : on le laisse finir, sinon la
    // capture attrape la poignée en route.
    await page.waitForTimeout(2600);
    for (const p of positions) {
      await placer(page, p);
      const suffixe = positions.length > 1 ? `-${p}` : '';
      await el.screenshot({ path: path.join(SORTIE, `${nom}${suffixe}.jpg`), type: 'jpeg', quality: 80 });
      console.log(`  ✓ ${nom}${suffixe}.jpg`);
    }
  } catch (e) {
    console.log(`  ✗ ${nom} — ${e.message.split('\n')[0]}`);
  } finally {
    await ctx.close();
  }
}

console.log('\n── Accueil — le comparateur de Léry ──');
await capturer(`${BASE}/`, BUREAU, 'accueil-lery-bureau', { positions: [8, 50, 92] });
await capturer(`${BASE}/`, MOBILE, 'accueil-lery-mobile', { positions: [8, 50, 92] });

console.log('\n── /simulateur — l\'exemple de Sainte-Julienne ──');
await capturer(`${BASE}/simulateur`, BUREAU, 'sim-ste-julienne-bureau', { positions: [8, 50, 92] });
await capturer(`${BASE}/simulateur`, MOBILE, 'sim-ste-julienne-mobile', { positions: [8, 50, 92] });

console.log('\n── Les deux pages en entier (375 px) ──');
for (const [chemin, nom] of [['/', 'page-accueil-mobile'], ['/simulateur', 'page-simulateur-mobile']]) {
  const ctx = await nav.newContext({ viewport: MOBILE, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(BASE + chemin, { waitUntil: 'networkidle', timeout: 45000 });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(2600);
  await page.screenshot({ path: path.join(SORTIE, `${nom}.jpg`), fullPage: true, type: 'jpeg', quality: 74 });
  console.log(`  ✓ ${nom}.jpg`);
  await ctx.close();
}

await nav.close();
console.log(`\nCaptures dans ${path.relative(ROOT, SORTIE)}/\n`);
