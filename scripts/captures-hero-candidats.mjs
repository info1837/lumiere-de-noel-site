// Le hero, rendu avec chaque candidate — 375 px et 1440 px.
//
//   node scripts/captures-hero-candidats.mjs      (serveur sur :3000)
//
// On ne reconstruit pas trois fois : on intercepte la requête d'image du
// hero et on sert les octets de la candidate à la place. Le reste — le
// voile, la typo, la position du texte, `object-fit: cover` — est le
// VRAI hero, donc le recadrage et la lisibilité qu'on juge sont ceux
// qu'on aura.
//
// Ce qu'on regarde, et c'est tout :
//   1. le titre reste-t-il lisible par-dessus ?
//   2. voit-on les lumières DE LA MAISON derrière le texte ?

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const SORTIE = path.join(ROOT, 'docs/hero');
fs.mkdirSync(SORTIE, { recursive: true });
const BASE = process.env.BASE_URL || 'http://localhost:3000';

// La photo actuellement codée dans le hero : c'est elle qu'on remplace.
const ACTUELLE = 'noel-lery-01';

const CANDIDATES = [
  { cle: 'st-donat-02',    fichier: 'noel-st-donat-02.jpg' },
  { cle: 'mirabel-01',     fichier: 'noel-mirabel-01.jpg' },
  { cle: 'residentiel-01', fichier: 'noel-residentiel-01.jpg' },
];

const TAILLES = [
  { nom: 'mobile', viewport: { width: 375, height: 812 } },
  { nom: 'bureau', viewport: { width: 1440, height: 900 } },
];

const nav = await chromium.launch();

for (const c of CANDIDATES) {
  const octets = fs.readFileSync(path.join(ROOT, 'public/images/reel', c.fichier));
  for (const t of TAILLES) {
    const ctx = await nav.newContext({ viewport: t.viewport, deviceScaleFactor: 1 });
    const page = await ctx.newPage();

    // Toute demande d'optimisation de la photo du hero reçoit la
    // candidate. On rend les octets bruts : le navigateur applique
    // `object-fit: cover` exactement comme en production.
    await page.route('**/_next/image**', async (route) => {
      const u = new URL(route.request().url());
      const cible = decodeURIComponent(u.searchParams.get('url') || '');
      if (cible.includes(ACTUELLE)) {
        await route.fulfill({ status: 200, contentType: 'image/jpeg', body: octets });
      } else {
        await route.continue();
      }
    });

    try {
      await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 45000 });
      await page.evaluate(() => document.fonts?.ready);
      await page.waitForTimeout(900);
      // Le hero seul : c'est lui qu'on compare, pas la page.
      await page.locator('.hero-section').first().screenshot({
        path: path.join(SORTIE, `hero-${c.cle}-${t.nom}.jpg`), type: 'jpeg', quality: 82,
      });
      console.log(`  ✓ hero-${c.cle}-${t.nom}.jpg`);
    } catch (e) {
      console.log(`  ✗ ${c.cle} ${t.nom} — ${e.message.split('\n')[0]}`);
    } finally {
      await ctx.close();
    }
  }
}

await nav.close();
console.log(`\nCaptures dans ${path.relative(ROOT, SORTIE)}/\n`);
