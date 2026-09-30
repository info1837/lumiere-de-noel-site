// Acceptation : le QR de l'accroche-porte arrive jusqu'au CRM.
//
//   npx next dev -p 4190 &   puis   node scripts/check-utm-vers-crm.mjs
//
// Ce qu'on affirme, et pourquoi :
//
//   · le visiteur atterrit sur `/?utm_campaign=voisin_2026`, NAVIGUE, et
//     remplit le formulaire deux ecrans plus loin — quand l'URL ne porte
//     plus rien. C'est tout l'interet du stockage de session : lire
//     `location.search` a l'envoi rendrait vide, et la campagne qui a
//     paye le carton ne serait creditee nulle part ;
//
//   · les UTM arrivent au CRM dans `formAnswers`, la colonne JSON qu'il
//     persiste deja — aucune migration ;
//
//   · une visite SANS utm n'envoie pas de formAnswers vide, qui
//     ecraserait ce qu'un autre chemin y aurait mis ;
//
//   · un utm demesure est tronque avant d'entrer dans la base.

import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:4190';
let pass = 0, fail = 0;
const t = (nom, ok, d = '') => { console.log(`  ${ok ? '✅' : '❌'} ${nom}${d ? ` — ${d}` : ''}`); ok ? pass++ : fail++; };

let versCrm = null;

const nav = await chromium.launch();
const page = await nav.newPage({ viewport: { width: 390, height: 844 } });

// On intercepte l'appel SORTANT vers le CRM, cote serveur du site.
// C'est le point d'entree du CRM : c'est LUI qui decide, pas le
// composant. Tester le composant seul ne prouverait rien.
await page.route('**/api/lead', async (route) => {
  const corps = JSON.parse(route.request().postData() || '{}');
  versCrm = corps;
  await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
});
await page.route('**/api.web3forms.com/**', (r) =>
  r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }));

console.log("\n── 1. Le QR mene a l'accueil, le formulaire est ailleurs ──");
await page.goto(`${BASE}/?utm_source=accroche_porte&utm_medium=print&utm_campaign=voisin_2026`,
  { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
{
  const garde = await page.evaluate(() => {
    try { return JSON.parse(sessionStorage.getItem('lum_utm') || 'null'); } catch { return null; }
  });
  t('les UTM sont retenus a l’arrivee', !!garde, JSON.stringify(garde));
  t('la campagne', garde?.utm_campaign === 'voisin_2026', String(garde?.utm_campaign));
  t('la source', garde?.utm_source === 'accroche_porte', String(garde?.utm_source));
  t('la page d’arrivee est notee', garde?.landing === '/', String(garde?.landing));
}

console.log('\n── 2. Il NAVIGUE jusqu’au formulaire : l’URL perd les UTM ──');
// Le vrai geste : il clique, il arrive sur /soumission, et l'URL ne
// porte plus rien. C'est le cas que le stockage de session existe pour.
await page.goto(`${BASE}/soumission`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
{
  t("l'URL ne porte plus aucun UTM", !page.url().includes('utm_'), page.url().replace(BASE, ''));
  const garde = await page.evaluate(() => JSON.parse(sessionStorage.getItem('lum_utm') || 'null'));
  t('la campagne survit a la navigation', garde?.utm_campaign === 'voisin_2026', String(garde?.utm_campaign));
}

console.log('\n── 3. Il remplit le VRAI formulaire et l’envoie ──');
{
  await page.getByLabel(/Nom complet/i).first().fill('Test QR Voisin');
  await page.getByLabel(/Téléphone/i).first().fill('5145550123');
  await page.getByLabel(/Courriel|Email/i).first().fill('test.qr@exemple.ca');
  // La case de consentement est obligatoire depuis le 2026-09-27.
  const cases = page.locator('input[type=checkbox]');
  if (await cases.count()) await cases.first().check({ force: true });
  await page.getByRole('button', { name: /Réserver ma date/i }).first().click();
  await page.waitForTimeout(1600);

  t('un lead est parti vers /api/lead', !!versCrm, JSON.stringify(versCrm || {}).slice(0, 70));
  t('il porte la campagne du QR', versCrm?.utm?.utm_campaign === 'voisin_2026',
    JSON.stringify(versCrm?.utm));
  t('et la source', versCrm?.utm?.utm_source === 'accroche_porte', String(versCrm?.utm?.utm_source));
  t('le nom saisi est bien celui-la', /Test QR Voisin/.test(String(versCrm?.nom || versCrm?.name)));
}

console.log('\n── 4. Une visite SANS UTM n’envoie rien de vide ──');
{
  versCrm = null;
  const p2 = await nav.newPage({ viewport: { width: 390, height: 844 } });
  await p2.route('**/api/lead', async (route) => {
    versCrm = JSON.parse(route.request().postData() || '{}');
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await p2.route('**/api.web3forms.com/**', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }));
  await p2.goto(`${BASE}/soumission`, { waitUntil: 'domcontentloaded' });
  await p2.waitForTimeout(700);
  await p2.getByLabel(/Nom complet/i).first().fill('Sans UTM');
  await p2.getByLabel(/Téléphone/i).first().fill('5145550124');
  await p2.getByLabel(/Courriel|Email/i).first().fill('sans@exemple.ca');
  const c2 = p2.locator('input[type=checkbox]');
  if (await c2.count()) await c2.first().check({ force: true });
  await p2.getByRole('button', { name: /Réserver ma date/i }).first().click();
  await p2.waitForTimeout(1600);
  t('le lead part quand meme', !!versCrm);
  t("aucun UTM inventé", !versCrm?.utm || Object.keys(versCrm.utm).length === 0,
    JSON.stringify(versCrm?.utm));
  await p2.close();
}

console.log('\n── 5. Un UTM demesure est tronque ──');
{
  const long = 'x'.repeat(4000);
  const p3 = await nav.newPage();
  await p3.route('**/api/lead', async (route) => {
    versCrm = JSON.parse(route.request().postData() || '{}');
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await p3.goto(`${BASE}/?utm_campaign=${long}`, { waitUntil: 'domcontentloaded' });
  await p3.waitForTimeout(700);
  const garde = await p3.evaluate(() => JSON.parse(sessionStorage.getItem('lum_utm') || '{}'));
  t('borne des le stockage', (garde.utm_campaign || '').length <= 120,
    `${(garde.utm_campaign || '').length} caractères`);
  await p3.close();
}

await nav.close();
console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
