// Les captures avant / après de la refonte.
//
//   node scripts/captures-refonte.mjs
//
// Deux serveurs doivent tourner :
//   :3000 → cette branche        :3001 → origin/main
//
// ⚠️ LA GÉNÉRATION EST SIMULÉE, ET C'EST ÉCRIT SUR L'IMAGE.
//
// Les écrans 4 et 5 du simulateur montrent une image produite par le CRM
// (palencia-crm), qu'on ne peut pas atteindre depuis un poste local : la
// clé d'intake est une variable *sensitive* de Vercel. Pour montrer
// quand même ces deux écrans, l'appel réseau est intercepté et renvoie
// une vraie photo du dépôt à la place du rendu du modèle. Ce qu'on voit
// est donc l'INTERFACE réelle, avec une image de remplacement — pas une
// simulation réussie. Les captures concernées portent la mention.

import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const SORTIE = path.join(ROOT, 'docs/refonte');
fs.mkdirSync(SORTIE, { recursive: true });

const NEUF = 'http://localhost:3000';
const ANCIEN = 'http://localhost:3001';

const BUREAU = { width: 1440, height: 900 };
const MOBILE = { width: 375, height: 812 };

const navigateur = await chromium.launch();

/** Une page prête : polices chargées, animations d'entrée terminées. */
async function preparer(page, url) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(900);
}

async function capturer(url, viewport, nom, { pleinePage = true } = {}) {
  const ctx = await navigateur.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  try {
    await preparer(page, url);
    // ⚠️ JPEG, pas PNG @2x : les captures pleine page pesaient jusqu'à
    // 10 Mo chacune, 27 Mo en tout. Le dépôt n'a pas à porter ça pour
    // une relecture de mise en page.
    await page.screenshot({ path: path.join(SORTIE, `${nom}.jpg`), fullPage: pleinePage, type: 'jpeg', quality: 72 });
    console.log(`  ✓ ${nom}.jpg`);
  } catch (e) {
    console.log(`  ✗ ${nom} — ${e.message.split('\n')[0]}`);
  } finally {
    await ctx.close();
  }
}

console.log('\n── Accueil : avant / après ──');
await capturer(`${ANCIEN}/`, BUREAU, 'accueil-avant-bureau');
await capturer(`${NEUF}/`, BUREAU, 'accueil-apres-bureau');
await capturer(`${ANCIEN}/`, MOBILE, 'accueil-avant-mobile');
await capturer(`${NEUF}/`, MOBILE, 'accueil-apres-mobile');

console.log('\n── Simulateur : avant / après (premier écran) ──');
await capturer(`${ANCIEN}/simulateur`, MOBILE, 'sim-avant-mobile', { pleinePage: false });
await capturer(`${NEUF}/simulateur`, MOBILE, 'sim-apres-1-adresse', { pleinePage: false });
await capturer(`${NEUF}/simulateur`, BUREAU, 'sim-apres-bureau', { pleinePage: false });

console.log('\n── Simulateur : les écrans du parcours (375 px) ──');
{
  const ctx = await navigateur.newContext({ viewport: MOBILE, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const photoReelle = fs.readFileSync(path.join(ROOT, 'public/images/reel/noel-blainville-01.jpg'));

  // ── Les interceptions. Tout ce qui sortirait vers le CRM est arrêté ici.
  await page.route('**/api/adresse**', (r) => r.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ ok: true, suggestions: [
      { texte: '118 rue des Érables, Blainville, QC J7C 3M2', placeId: 'p1' },
      { texte: '118 rue des Érables, Saint-Jérôme, QC J7Z 1A1', placeId: 'p2' },
    ] }),
  }));
  await page.route('**/api/simulateur/relais**', (r) => r.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ ok: false, message: 'Transfert cellulaire indisponible hors production.' }),
  }));
  await page.route('**/api/simulateur/image**', (r) => r.fulfill({
    status: 200, contentType: 'image/jpeg', body: photoReelle,
  }));
  await page.route('**/api/simulateur', (r) => r.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ ok: true, jeton: 'jeton-de-demo', photoCle: 'avant', resultatCle: 'apres' }),
  }));
  await page.route('**/api/lead', (r) => r.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ ok: true, id: 'fiche-de-demo' }),
  }));

  // Un bandeau d'avertissement, pour qu'aucune capture ne puisse passer
  // pour une vraie génération.
  const marquer = async (texte) => page.evaluate((t) => {
    const d = document.createElement('div');
    d.textContent = t;
    d.style.cssText = 'position:fixed;z-index:99999;left:0;right:0;bottom:0;background:#7A1F1F;'
      + 'color:#fff;font:700 11px/1.4 system-ui;padding:6px 10px;text-align:center;letter-spacing:.04em';
    document.body.appendChild(d);
  }, texte);

  const tirer = async (nom) => {
    await page.waitForTimeout(700);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(SORTIE, `${nom}.jpg`), type: 'jpeg', quality: 78 });
    console.log(`  ✓ ${nom}.jpg`);
  };

  await preparer(page, `${NEUF}/simulateur`);

  // ── Écran 1 : l'adresse, avec ses suggestions ouvertes
  await page.fill('#sim-adresse', '118 rue des');
  await page.waitForTimeout(600);
  await tirer('sim-apres-1b-suggestions');

  // Le premier `option` de la liste, pas une recherche par texte : le
  // libellé contient des accents et une virgule, et le sélecteur textuel
  // s'est révélé fragile dès que la page rechargeait à chaud.
  const premiere = page.locator('li[role="option"]').first();
  if (await premiere.count()) await premiere.click();
  else await page.fill('#sim-adresse', '118 rue des Érables, Blainville, QC J7C 3M2');
  await page.click('button:has-text("Commencer")');

  // ── Écran 2 : la photo
  await page.waitForTimeout(800);
  await tirer('sim-apres-2-photo');

  // On dépose une vraie photo du dépôt dans l'entrée de fichier.
  const tmp = path.join(SORTIE, '.facade-temoin.jpg');
  fs.writeFileSync(tmp, photoReelle);
  const entrees = ['#sim-photo-disque', '#sim-photo-pellicule', '#sim-photo-appareil'];
  for (const sel of entrees) {
    if (await page.locator(sel).count()) { await page.setInputFiles(sel, tmp); break; }
  }

  // ── Écran 3 : le style
  await page.waitForTimeout(1600);
  await tirer('sim-apres-3-style');

  // ── Écran 3.5 : la guirlande. Elle ne dure que le temps de l'appel, qui
  // est instantané ici : on retient la réponse une seconde pour la voir.
  await page.unroute('**/api/simulateur');
  await page.route('**/api/simulateur', async (r) => {
    await new Promise((ok) => setTimeout(ok, 2600));
    await r.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true, jeton: 'jeton-de-demo', photoCle: 'avant', resultatCle: 'apres' }),
    });
  });
  await page.click('button:has-text("Voir ma maison illuminée")');
  await page.waitForTimeout(1100);
  await tirer('sim-apres-4-guirlande');

  // ── Écran 4 : le résultat flouté + les coordonnées
  await page.waitForTimeout(2600);
  await marquer('CAPTURE DE DÉMO — génération interceptée, image de remplacement (le CRM n’est pas joignable hors production)');
  await tirer('sim-apres-5-teaser');

  // ── Écran 5 : la révélation
  await page.fill('#sim-nom', 'Marie');
  await page.fill('#sim-tel', '450 555-0188');
  // La case est une vraie <input type="checkbox"> habillée en CSS : on
  // clique son <label>, comme le ferait quelqu'un. `check({force})` sur
  // l'input caché ne déclenchait pas le onChange, et le formulaire
  // refusait d'avancer — ce qui est le bon comportement, mais faisait
  // capturer deux fois le même écran.
  await page.evaluate(() => {
    const c = document.querySelector('#sim-consent');
    if (c && !c.checked) c.click();
  });
  await page.waitForTimeout(300);
  await page.click('button:has-text("Débloquer mon image")');
  // ⚠️ L'envoi attend le pixel (`trackLead` puis `laisserPartir`) avant de
  // rendre la main : à 1,8 s la capture attrapait le bouton sur
  // « Un instant… ». On attend que l'écran 5 soit réellement là.
  await page.waitForSelector('.sim-compare--revele', { timeout: 20000 }).catch(() => {});
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1400);
  await tirer('sim-apres-6-revelation');

  fs.unlinkSync(tmp);
  await ctx.close();
}

await navigateur.close();
console.log(`\nCaptures dans ${path.relative(ROOT, SORTIE)}/\n`);
