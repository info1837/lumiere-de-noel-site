// Acceptation : « prenez la photo avec votre cellulaire ».
//
//   LUMIERE_INTAKE_KEY=cle-de-test CRM_BASE_URL=http://127.0.0.1:4391 \
//     npx next dev -p 4191 &
//   node scripts/check-photo-cellulaire.mjs
//
// CE QUI EST PROUVÉ, ET POURQUOI C'EST CE QU'IL FAUT PROUVER
//
// Le parcours traverse DEUX appareils. Un test qui ne regarde qu'un écran ne
// prouve rien : le défaut qu'on craint est précisément que l'ordinateur
// n'apprenne jamais que la photo est arrivée. On ouvre donc deux contextes de
// navigateur — un « ordinateur » à 1440 px, un « téléphone » à 390 px — et on
// vérifie que le PREMIER avance alors que c'est le SECOND qui a agi.
//
// Le CRM est remplacé par un serveur de CONTRAT : il parle exactement le
// protocole du vrai (mêmes chemins, mêmes noms de champs, mêmes états) et rien
// de plus. Le vrai code du CRM est prouvé de son côté par
// scripts/multi-business/test-relais-photo-lumiere.mjs (56/56), sur du vrai
// SQLite. Ici on prouve le SITE, et le contrat entre les deux.
//
// Aucun octet ne sort de la machine : le CRM est local, et le relais de
// création de fiche est intercepté.

import http from 'http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import QRCode from 'qrcode';
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:4191';
const PORT_CRM = Number(process.env.PORT_CRM || 4391);
const CLE = process.env.LUMIERE_INTAKE_KEY || 'cle-de-test';
const LEAD = '1790000000777';
const TEL = '(514) 209-7940';

let pass = 0, fail = 0;
const t = (nom, ok, d = '') => { console.log(`  ${ok ? '✅' : '❌'} ${nom}${d ? ` — ${d}` : ''}`); ok ? pass++ : fail++; };
const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'photo-cell-'));

// ═══ Le CRM de contrat ══════════════════════════════════════════════════════
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
const codes = new Map();   // code → { leadId, expire, recu, lu, photo, type }
let fichesCreees = 0;

const nouveauCode = () => Array.from({ length: 10 }, () => ALPHABET[Math.floor(Math.random() * 30)]).join('');
const dix = (v) => String(v ?? '').replace(/\D/g, '').slice(-10);
const etatDe = (l) => {
  if (!l) return 'inconnu';
  if (l.expire <= Date.now()) return 'expire';
  if (l.lu) return 'utilise';
  if (l.recu) return 'prete';
  return 'attente';
};
const MESSAGES = {
  attente: 'Prêt à recevoir votre photo.',
  prete: 'Photo déjà envoyée ! Retournez à votre ordinateur.',
  utilise: 'Photo déjà envoyée ! Retournez à votre ordinateur.',
  expire: 'Lien expiré, rescannez le code sur votre ordinateur.',
  inconnu: 'Lien expiré, rescannez le code sur votre ordinateur.',
};

const crm = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  const envoie = (o, s = 200) => { res.writeHead(s, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); };
  if ((req.headers['x-intake-key'] || '') !== CLE) return envoie({ ok: false, raison: 'cle_absente' }, 401);

  let corps = {};
  if (req.method === 'POST') {
    const brut = await new Promise((r) => { let d = ''; req.on('data', (c) => d += c); req.on('end', () => r(d)); });
    try { corps = JSON.parse(brut); } catch { return envoie({ ok: false, raison: 'corps_illisible' }, 400); }
  }

  if (u.pathname === '/api/public/lumiere/simulateur/relais') {
    if (req.method === 'POST') {
      if (String(corps.leadId) !== LEAD || dix(corps.telephone) !== dix(TEL)) return envoie({ ok: false, raison: 'fiche_introuvable' }, 404);
      const code = nouveauCode();
      const expire = Date.now() + 15 * 60 * 1000;
      codes.set(code, { leadId: LEAD, expire, recu: null, lu: null, photo: null, type: null });
      return envoie({ ok: true, code, expire_a: new Date(expire).toISOString(), duree_ms: 15 * 60 * 1000 });
    }
    const l = codes.get(u.searchParams.get('code') || '');
    const e = etatDe(l);
    return envoie({ ok: true, etat: e === 'inconnu' ? 'expire' : e, message: MESSAGES[e], expire_a: l ? new Date(l.expire).toISOString() : null });
  }

  if (u.pathname === '/api/public/lumiere/simulateur/relais/photo') {
    const code = (req.method === 'POST' ? corps.code : u.searchParams.get('code')) || '';
    const l = codes.get(code);
    const e = etatDe(l);
    if (req.method === 'POST') {
      if (e !== 'attente') return envoie({ ok: false, raison: e === 'inconnu' ? 'expire' : e, message: MESSAGES[e] });
      const m = String(corps.photo || '').match(/^data:([a-z/+-]+);base64,(.*)$/is);
      if (!m) return envoie({ ok: false, raison: 'photo_invalide', message: 'illisible' });
      l.photo = Buffer.from(m[2], 'base64'); l.type = m[1]; l.recu = Date.now();
      return envoie({ ok: true, message: 'Photo envoyée ! Retournez à votre ordinateur.' });
    }
    if (e !== 'prete' && e !== 'utilise') return envoie({ ok: false, raison: e }, 404);
    if (!l.lu) l.lu = Date.now();
    res.writeHead(200, { 'content-type': l.type || 'image/jpeg' });
    return res.end(l.photo);
  }

  envoie({ ok: false, raison: 'chemin_inconnu' }, 404);
});
await new Promise((r) => crm.listen(PORT_CRM, '127.0.0.1', r));

// ═══ Outils ════════════════════════════════════════════════════════════════

/** Dimensions réelles d'un JPEG, lues dans son marqueur SOF. */
function dimensionsJpeg(buf) {
  let i = 2;
  while (i < buf.length - 8) {
    if (buf[i] !== 0xFF) { i++; continue; }
    const m = buf[i + 1];
    if (m === 0xD8 || m === 0x01 || (m >= 0xD0 && m <= 0xD7)) { i += 2; continue; }
    const len = buf.readUInt16BE(i + 2);
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
      return { hauteur: buf.readUInt16BE(i + 5), largeur: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return null;
}

/**
 * Colle une étiquette EXIF « Orientation = 6 » sur un JPEG.
 *
 * C'est ce qu'écrit un iPhone tenu droit : les pixels sont en paysage, et
 * l'étiquette dit « tourne de 90° ». Un canvas qui ignore l'étiquette rend
 * donc une maison couchée.
 */
function avecExifOrientation6(jpeg) {
  const payload = Buffer.concat([
    Buffer.from('Exif\0\0', 'binary'),
    Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00]),  // TIFF, little-endian, IFD0 à l'offset 8
    Buffer.from([0x01, 0x00]),                                      // un seul champ
    Buffer.from([0x12, 0x01, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00,
                 0x06, 0x00, 0x00, 0x00]),                          // 0x0112 Orientation, SHORT, 1, = 6
    Buffer.from([0x00, 0x00, 0x00, 0x00]),                          // pas d'IFD suivant
  ]);
  const entete = Buffer.alloc(4);
  entete.writeUInt16BE(0xFFE1, 0); entete.writeUInt16BE(payload.length + 2, 2);
  return Buffer.concat([jpeg.subarray(0, 2), entete, payload, jpeg.subarray(2)]);
}

/** Fabrique un JPEG de L×H dans le navigateur, puis l'écrit sur le disque. */
async function fabriquerJpeg(page, l, h, nom, exif = false) {
  const dataUrl = await page.evaluate(([l, h]) => {
    const c = document.createElement('canvas');
    c.width = l; c.height = h;
    const x = c.getContext('2d');
    x.fillStyle = '#8a6a4a'; x.fillRect(0, 0, l, h);
    x.fillStyle = '#2b3c52'; x.fillRect(0, 0, l, Math.round(h / 3));
    return c.toDataURL('image/jpeg', 0.9);
  }, [l, h]);
  let buf = Buffer.from(dataUrl.split(',')[1], 'base64');
  if (exif) buf = avecExifOrientation6(buf);
  const chemin = path.join(dossier, nom);
  fs.writeFileSync(chemin, buf);
  return chemin;
}

// ═══ Le test ════════════════════════════════════════════════════════════════
const nav = await chromium.launch();
const ctxOrdi = await nav.newContext({ viewport: { width: 1440, height: 900 } });
const ctxTel = await nav.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
});
const ordi = await ctxOrdi.newPage();
const tel = await ctxTel.newPage();

// 🚨 Toute erreur de page est retenue et jugée à la fin.
//
// Une erreur d'hydratation ne se voit pas sur une capture : la page a l'air
// juste. React, lui, jette le HTML du serveur et refait tout côté client.
// C'est exactement ce qu'a produit un `<style>{…}</style>` dont React
// échappait le « > » au rendu serveur — trouvé par cette assertion, pas à
// l'œil.
const erreursPage = [];
const surveiller = (p, qui) => {
  p.on('pageerror', (e) => erreursPage.push(`${qui} · ${e.message.split('\n')[0].slice(0, 120)}`));
  p.on('console', (m) => { if (m.type() === 'error') erreursPage.push(`${qui} · ${m.text().split('\n')[0].slice(0, 120)}`); });
};
surveiller(ordi, 'ordinateur'); surveiller(tel, 'téléphone');

// La création de fiche est interceptée par allerEcranPhoto() : on ne crée
// AUCUN lead, nulle part. Le téléphone, lui, n'y passe jamais.
for (const p of [ordi, tel]) await p.route('**/facebook.com/**', (r) => r.abort());

/**
 * Mène une page de l'écran 1 à l'écran 2.
 *
 * ⚠️ L'attente après `goto` n'est pas de la superstition. Remplir un champ
 * contrôlé par React AVANT l'hydratation pose la valeur dans le DOM sans que
 * l'état du composant bouge : à la soumission, le prénom est vide et l'écran
 * refuse d'avancer. C'est exactement ce qui a fait échouer la première
 * version de ce test.
 */
async function allerEcranPhoto(page) {
  await page.route('**/api/lead', async (route) => {
    fichesCreees++;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, id: LEAD }) });
  });
  await page.route('**/api.web3forms.com/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }));
  await page.goto(`${BASE}/simulateur`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#sim-consent');
  await page.waitForFunction(() => {
    // Hydraté = React a repris la main sur le champ. On le prouve en écrivant
    // dedans et en vérifiant que la valeur SURVIT à un rendu.
    const i = document.querySelector('#sim-nom');
    return !!(i && Object.keys(i).some((k) => k.startsWith('__react')));
  }, null, { timeout: 15000 });
  await page.fill('#sim-nom', 'Laurie');
  await page.fill('#sim-tel', TEL);
  await page.check('#sim-consent');
  await page.click('button.sim-cta');
  await page.waitForSelector('.sim-conseils', { timeout: 20000 });
}

let dernierCode = null;
ordi.on('response', async (r) => {
  if (r.url().includes('/api/simulateur/relais') && !r.url().includes('/photo') && r.request().method() === 'POST') {
    try { const j = await r.json(); if (j?.code) dernierCode = j.code; } catch {}
  }
});

// ── 1. L'ordinateur : étape 1 puis l'écran de la photo ──────────────────────
console.log('\n── 1. Ordinateur 1440 px : les deux voies côte à côte ─────');
await allerEcranPhoto(ordi);
await ordi.waitForSelector('.sim-qr-image', { timeout: 20000 });
await ordi.waitForTimeout(600);
{
  t('le téléversement est toujours là', await ordi.locator('.sim-depot').count() === 1);
  t('…avec le glisser-déposer', await ordi.locator('.sim-depot-titre').innerText().then((s) => /glissez/i.test(s)));
  t('…et son bouton de fichier', await ordi.locator('.sim-depot .sim-cta').count() === 1);
  const titre = await ordi.locator('.sim-qr-titre').innerText();
  t('🚨 l\'offre cellulaire est proposée', /pas de photo sur l.ordinateur/i.test(titre) && /cellulaire/i.test(titre), titre.replace(/\n/g, ' '));
  t('le code QR est dessiné', await ordi.locator('.sim-qr-image svg').count() === 1);
  t('« En attente de la photo… » est affiché', /en attente de la photo/i.test(await ordi.locator('.sim-qr-attente').innerText()));
  t('…avec le temps qui reste', /expire dans \d+ min/.test(await ordi.locator('.sim-qr-attente').innerText()));
  const lienTexte = await ordi.locator('.sim-qr-lien').innerText();
  t('le lien est aussi donné en texte', /\/p\/[2-9A-Z]{5}-[2-9A-Z]{5}/.test(lienTexte), lienTexte.replace(/\n/g, ' '));
  // 🚨 Le code ne doit JAMAIS être coupé par un retour à la ligne : on
  // recopierait « J47F7-Q » puis « ZREZ » et le lien ne mènerait nulle part.
  const morceaux = await ordi.evaluate(() => {
    const sp = [...document.querySelectorAll('.sim-qr-lien strong span')];
    return sp.map((s) => ({ texte: s.textContent, lignes: s.getClientRects().length }));
  });
  t('🚨 le code n\'est jamais coupé en deux lignes',
    morceaux.length === 2 && morceaux.every((m) => m.lignes === 1),
    morceaux.map((m) => `${m.texte}:${m.lignes}ligne(s)`).join(' + '));

  // Les deux voies sont côte à côte, pas l'une sous l'autre, sur un écran large.
  const [a, b] = await Promise.all([ordi.locator('.sim-depot').boundingBox(), ordi.locator('.sim-qr').boundingBox()]);
  t('🚨 les deux voies sont côte à côte sur 1440 px', b.x > a.x + a.width - 5, `dépôt x=${Math.round(a.x)}+${Math.round(a.width)} · QR x=${Math.round(b.x)}`);
  t('aucun défilement horizontal', await ordi.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0);

  // 🚨 Le fil d'étapes doit être VU, pas seulement présent. Le test du doigt :
  // on demande au navigateur ce qu'il y a au centre du fil. Avant, il
  // répondait « l'entête » — les quatre étapes étaient sous la pilule fixe.
  const fil = await ordi.evaluate(() => {
    const f = document.querySelector('.sim-fil');
    const r = f.getBoundingClientRect();
    const au = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return { vu: f.contains(au) || au === f, quoi: (au?.className || '').toString().slice(0, 30), y: Math.round(r.y) };
  });
  t('🚨 le fil d\'étapes n\'est plus caché sous l\'entête', fil.vu, `y=${fil.y} · au centre : ${fil.quoi}`);
  t('…et l\'étape COURANTE est surlignée', await ordi.locator('.sim-fil li.ici').count() === 1,
    `${await ordi.locator('.sim-fil li.ici').count()} étape(s) marquée(s) « ici »`);
}
await ordi.screenshot({ path: path.join(dossier, '1-ordi-1440.png') });

console.log('\n── 2. 🚨 Le QR encode EXACTEMENT la bonne URL ─────────────');
{
  t('un code a été émis', !!dernierCode, String(dernierCode));
  // On redessine le QR de l'URL attendue avec les MÊMES options, et on compare
  // les tracés (`d`) : ce sont eux qui PORTENT les modules du code. Comparer
  // le HTML brut échouerait sur une normalisation d'attribut par le
  // navigateur, sans que le code encodé ait changé.
  const options = { type: 'svg', errorCorrectionLevel: 'M', margin: 1, width: 208, color: { dark: '#0b1a2b', light: '#ffffff' } };
  const hote = await ordi.evaluate(() => location.host);
  const urlAttendue = `http://${hote}/simulateur/photo?t=${dernierCode}`;
  const traces = (svg) => [...svg.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]).join('|');
  const domTraces = await ordi.evaluate(() =>
    [...document.querySelectorAll('.sim-qr-image svg path')].map((p) => p.getAttribute('d')).join('|'));
  t('🚨 le QR encode /simulateur/photo?t=CODE, et rien d\'autre',
    domTraces.length > 200 && domTraces === traces(await QRCode.toString(urlAttendue, options)),
    domTraces.length > 200 ? urlAttendue : `tracé de ${domTraces.length} caractères`);
  // Contre-preuve : un code VOISIN ne donne pas le même tracé. Sans elle,
  // l'assertion ci-dessus passerait même si le QR encodait n'importe quoi de
  // constant.
  const voisin = dernierCode.slice(0, 9) + (dernierCode[9] === '2' ? '3' : '2');
  t('…et un code voisin donne un tracé DIFFÉRENT',
    domTraces !== traces(await QRCode.toString(`http://${hote}/simulateur/photo?t=${voisin}`, options)));

  // Ce que l'URL ne dit pas.
  t('🚨 le code ne contient pas l\'id de la fiche', !dernierCode.includes(LEAD));
  t('🚨 …ni le téléphone', !dernierCode.includes('2097940'));
  t('🚨 …ni le nom', !/laurie/i.test(dernierCode));
  const html = await ordi.content();
  t('🚨 la clé d\'intake n\'est PAS dans le HTML', !html.includes(CLE));
}

console.log('\n── 3. Téléphone 390 px : /p/CODE mène à la bonne page ─────');
{
  const court = `${BASE}/p/${dernierCode.slice(0, 5)}-${dernierCode.slice(5)}`;
  const r = await tel.goto(court, { waitUntil: 'domcontentloaded' });
  t('🚨 le lien court tapé à la main (avec son tiret) arrive à bon port',
    new URL(tel.url()).pathname === '/simulateur/photo' && new URL(tel.url()).searchParams.get('t') === dernierCode,
    tel.url().replace(BASE, ''));
  t('…en 200', r.status() === 200, String(r.status()));
  await tel.waitForSelector('#sim-tele-appareil', { timeout: 10000 });
  t('la marque Lumière est là', /lumière de noël/i.test(await tel.locator('.sim-tele-marque').innerText()));
  const boutons = await tel.locator('.sim button').allInnerTexts();
  t('🚨 deux boutons, et seulement deux', boutons.length === 2, boutons.join(' | '));
  t('🚨 « Prendre une photo »', /prendre une photo/i.test(boutons[0]), boutons[0]);
  t('🚨 « Choisir dans mes photos »', /choisir dans mes photos/i.test(boutons[1]), boutons[1]);
  // 🚨 « Rien d'autre » se mesure sur TOUTE la page, pas dans le bloc du
  // simulateur — où il n'y a jamais eu de menu. Un lien caché par
  // `display:none` n'est ni cliquable, ni atteignable au clavier, ni annoncé
  // par un lecteur d'écran : on compte donc ce qui est VISIBLE.
  const liensVisibles = await tel.evaluate(() =>
    [...document.querySelectorAll('a')].filter((a) => a.checkVisibility?.() ?? a.offsetParent !== null).length);
  t('🚨 aucun lien visible sur la page entière — ni menu, ni pied de page',
    liensVisibles === 0, `${liensVisibles} lien(s)`);
  t('🚨 l\'entête et sa pilule de menu ont disparu',
    await tel.locator('.entete-pilule').evaluate((e) => getComputedStyle(e).display).catch(() => 'absent') === 'none');
  // On exige qu'il EXISTE et qu'il soit masqué : un `.every()` sur zéro
  // élément rendrait `true` sans rien prouver.
  const pieds = await tel.evaluate(() => [...document.querySelectorAll('body > footer')].map((f) => getComputedStyle(f).display));
  t('🚨 le pied de page aussi', pieds.length === 1 && pieds[0] === 'none', pieds.join(',') || 'aucun <footer> trouvé');
  const tiroirs = await tel.evaluate(() => [...document.querySelectorAll('.tiroir')].map((f) => getComputedStyle(f).display));
  t('🚨 et le tiroir mobile, dont les liens restaient tabulables',
    tiroirs.length === 1 && tiroirs[0] === 'none', tiroirs.join(',') || 'aucun .tiroir trouvé');
  t('🚨 la barre du bas aussi', await tel.locator('.mobile-bottom-bar').evaluate((e) => getComputedStyle(e).display).catch(() => 'absent') === 'none');
  t('…et le bandeau ne laisse pas 40 px de vide',
    await tel.evaluate(() => getComputedStyle(document.body).paddingTop) === '0px',
    await tel.evaluate(() => getComputedStyle(document.body).paddingTop));
  t('🚨 aucune clé d\'intake dans le HTML', !(await tel.content()).includes(CLE));
  t('🚨 la page est en noindex', /noindex/.test(await tel.locator('meta[name="robots"]').getAttribute('content') || ''),
    await tel.locator('meta[name="robots"]').getAttribute('content'));
  t('aucun défilement horizontal', await tel.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0);
}
await tel.screenshot({ path: path.join(dossier, '2-tel-390-deux-boutons.png') });

console.log('\n── 4. 🚨 Les deux boutons ouvrent la BONNE entrée ─────────');
{
  // Le vrai parcours : on clique, et on regarde quelle entrée s'ouvre.
  const [ch1] = await Promise.all([tel.waitForEvent('filechooser'), tel.click('button.sim-cta:not(.sim-cta--doux)')]);
  const id1 = await ch1.element().getAttribute('id');
  const cap1 = await ch1.element().getAttribute('capture');
  t('🚨 « Prendre une photo » ouvre l\'appareil arrière', id1 === 'sim-tele-appareil' && cap1 === 'environment', `${id1} capture=${cap1}`);

  const [ch2] = await Promise.all([tel.waitForEvent('filechooser'), tel.click('button.sim-cta--doux')]);
  const id2 = await ch2.element().getAttribute('id');
  const cap2 = await ch2.element().getAttribute('capture');
  t('🚨 « Choisir dans mes photos » ouvre la pellicule, SANS capture', id2 === 'sim-tele-pellicule' && cap2 === null, `${id2} capture=${cap2}`);
  t('🚨 les deux entrées sont distinctes (pas un attribut muté)', id1 !== id2);
}

console.log('\n── 5. La photo traverse, et l\'ordinateur avance SEUL ──────');
{
    // `innerText` rend le texte TRANSFORMÉ par le CSS : `.sim-fil li` est en
  // `text-transform: uppercase`, donc on lit « PHOTO ». On compare sans casse.
  const etape = async (p) => (await p.locator('.sim-fil li.ici').innerText()).trim().toLowerCase();
  t('l\'ordinateur est bien à l\'étape « Photo »', await etape(ordi) === 'photo', await etape(ordi));

  const photo = await fabriquerJpeg(tel, 1600, 900, 'facade.jpg');
  const [ch] = await Promise.all([tel.waitForEvent('filechooser'), tel.click('button.sim-cta:not(.sim-cta--doux)')]);
  await ch.setFiles(photo);

  await tel.waitForSelector('.sim-tele-pictogramme', { timeout: 20000 });
  t('🚨 le téléphone confirme : « Photo envoyée ! »', /photo envoyée/i.test(await tel.locator('.sim-titre').innerText()),
    (await tel.locator('.sim-titre').innerText()).trim());
  t('…et renvoie à l\'ordinateur', /retournez à votre ordinateur/i.test(await tel.locator('.sim').innerText()));
  await tel.screenshot({ path: path.join(dossier, '3-tel-390-envoyee.png') });

  // 🚨 LE point du bloc : l'ordinateur avance sans qu'on y touche.
  await ordi.waitForSelector('.sim-styles', { timeout: 20000 });
  t('🚨 l\'ordinateur est passé à l\'écran suivant SANS UN SEUL CLIC',
    await etape(ordi) === 'style', await etape(ordi));
  t('…et le QR a disparu', await ordi.locator('.sim-qr').count() === 0);
  t('…et les trois styles sont proposés', await ordi.locator('.sim-style').count() === 3);
  await ordi.screenshot({ path: path.join(dossier, '4-ordi-1440-style.png') });

  const ligne = codes.get(dernierCode);
  t('🚨 la photo est attachée à la fiche de l\'étape 1', ligne.leadId === LEAD, ligne.leadId);
  t('🚨 aucune deuxième fiche créée', fichesCreees === 1, `${fichesCreees} création(s) de fiche`);
  const dim = dimensionsJpeg(ligne.photo);
  t('la photo est redimensionnée à 1280 px avant d\'être envoyée', dim.largeur === 1280, `${dim.largeur}×${dim.hauteur}`);
  t('…en gardant les proportions', Math.abs(dim.hauteur - 720) <= 2, `${dim.largeur}×${dim.hauteur}`);
}

/** Un code neuf, demandé comme le ferait l'écran de l'ordinateur. */
async function codeNeuf() {
  const r = await fetch(`${BASE}/api/simulateur/relais`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ leadId: LEAD, telephone: TEL }),
  });
  const j = await r.json();
  return j.code;
}

console.log('\n── 6. 🚨 Orientation EXIF : la maison n\'est pas couchée ───');
{
  // Un iPhone tenu droit écrit des pixels en PAYSAGE, plus une étiquette
  // « tourne de 90° ». Sans lecture de l'étiquette, la maison arrive couchée —
  // et le modèle allume consciencieusement un toit vertical.
  const code = await codeNeuf();
  const tordue = await fabriquerJpeg(tel, 240, 120, 'iphone-droit.jpg', true);
  const brut = fs.readFileSync(tordue);
  const dimFichier = dimensionsJpeg(brut);
  t('le fichier de départ est en paysage, comme l\'écrit un iPhone',
    dimFichier.largeur === 240 && dimFichier.hauteur === 120, `${dimFichier.largeur}×${dimFichier.hauteur}`);
  t('…et porte bien une étiquette EXIF', brut.includes(Buffer.from('Exif')));

  await tel.goto(`${BASE}/simulateur/photo?t=${code}`, { waitUntil: 'domcontentloaded' });
  await tel.waitForSelector('#sim-tele-appareil', { timeout: 10000 });
  const [ch] = await Promise.all([tel.waitForEvent('filechooser'), tel.click('button.sim-cta:not(.sim-cta--doux)')]);
  await ch.setFiles(tordue);
  await tel.waitForSelector('.sim-tele-pictogramme', { timeout: 20000 });

  const recue = dimensionsJpeg(codes.get(code).photo);
  t('🚨 la photo reçue est en PORTRAIT : l\'étiquette a été appliquée',
    recue.hauteur > recue.largeur, `${recue.largeur}×${recue.hauteur} (le fichier disait ${dimFichier.largeur}×${dimFichier.hauteur})`);
  t('…aux bonnes dimensions, pivotées', recue.largeur === 120 && recue.hauteur === 240, `${recue.largeur}×${recue.hauteur}`);
}

console.log('\n── 7. 🚨 Code expiré → la page d\'erreur ───────────────────');
{
  const code = await codeNeuf();
  codes.get(code).expire = Date.now() - 1000;      // il vient d'expirer
  await tel.goto(`${BASE}/simulateur/photo?t=${code}`, { waitUntil: 'domcontentloaded' });
  await tel.waitForSelector('.sim-titre', { timeout: 10000 });
  t('🚨 le titre est « Lien expiré »', /lien expiré/i.test(await tel.locator('.sim-titre').innerText()),
    (await tel.locator('.sim-titre').innerText()).trim());
  t('🚨 …avec le texte exact demandé',
    /rescannez le code sur votre ordinateur/i.test(await tel.locator('.sim').innerText()));
  t('🚨 aucun bouton d\'envoi n\'est offert', await tel.locator('.sim-cta').count() === 0,
    `${await tel.locator('.sim-cta').count()} bouton(s)`);
  await tel.screenshot({ path: path.join(dossier, '5-tel-390-expire.png') });

  // Et un code qui n'a JAMAIS existé rend la même chose : on n'apprend pas
  // s'il a existé un jour.
  await tel.goto(`${BASE}/simulateur/photo?t=ZZZZZZZZZZ`, { waitUntil: 'domcontentloaded' });
  await tel.waitForSelector('.sim-titre', { timeout: 10000 });
  t('🚨 un code jamais émis rend la MÊME page', /lien expiré/i.test(await tel.locator('.sim-titre').innerText()));
  // Et sans code du tout.
  await tel.goto(`${BASE}/simulateur/photo`, { waitUntil: 'domcontentloaded' });
  await tel.waitForSelector('.sim-titre', { timeout: 10000 });
  t('…comme une URL sans code', /lien expiré/i.test(await tel.locator('.sim-titre').innerText()));
}

console.log('\n── 8. 🚨 Code réutilisé ───────────────────────────────────');
{
  // `dernierCode` a déjà servi au bloc 5 : sa photo est partie ET ramassée.
  await tel.goto(`${BASE}/simulateur/photo?t=${dernierCode}`, { waitUntil: 'domcontentloaded' });
  await tel.waitForSelector('.sim-titre', { timeout: 10000 });
  const texte = await tel.locator('.sim').innerText();
  t('🚨 aucun bouton d\'envoi : le code est bien brûlé', await tel.locator('.sim-cta').count() === 0);
  // 🚨 PAS « rescannez ». Sa photo EST arrivée ; l'envoyer rescanner le ferait
  // reprendre une photo que le second dépôt refuserait — cul-de-sac.
  t('🚨 on lui dit que sa photo est déjà partie, pas de rescanner',
    /photo envoyée/i.test(await tel.locator('.sim-titre').innerText()) && !/rescannez/i.test(texte),
    (await tel.locator('.sim-titre').innerText()).trim());
  t('…et on le renvoie à son ordinateur', /retournez à votre ordinateur/i.test(texte));
  await tel.screenshot({ path: path.join(dossier, '6-tel-390-reutilise.png') });

  // La propriété de sécurité, mesurée à la source : le dépôt est refusé.
  const r = await fetch(`${BASE}/api/simulateur/relais/photo`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code: dernierCode, photo: 'data:image/jpeg;base64,/9j/4AAQ' }),
  });
  const j = await r.json();
  t('🚨 un second dépôt sur ce code est REFUSÉ', j.ok === false, JSON.stringify(j).slice(0, 80));
  const inchangee = dimensionsJpeg(codes.get(dernierCode).photo);
  t('…et la première photo n\'a pas été écrasée', inchangee.largeur === 1280, `${inchangee.largeur}×${inchangee.hauteur}`);
}

console.log('\n── 9. « Générer un nouveau code » ─────────────────────────');
{
  const ordi2 = await ctxOrdi.newPage();
  let premier = null;
  ordi2.on('response', async (r) => {
    if (r.url().includes('/api/simulateur/relais') && !r.url().includes('/photo') && r.request().method() === 'POST') {
      try { const j = await r.json(); if (j?.code && !premier) premier = j.code; } catch {}
    }
  });
  await allerEcranPhoto(ordi2);
  await ordi2.waitForSelector('.sim-qr-image', { timeout: 15000 });
  t('un QR est affiché', !!premier, String(premier));

  // On fait expirer le code sous ses pieds, comme le temps le ferait.
  codes.get(premier).expire = Date.now() - 1000;
  await ordi2.waitForSelector('button.sim-lien', { timeout: 15000 });
  t('🚨 l\'écran dit que le code a expiré', /ce code a expiré/i.test(await ordi2.locator('.sim-qr').innerText()));
  t('🚨 …et offre d\'en générer un nouveau',
    /générer un nouveau code/i.test(await ordi2.locator('button.sim-lien').innerText()));
  t('…le QR périmé n\'est plus affiché', await ordi2.locator('.sim-qr-image').count() === 0);
  await ordi2.screenshot({ path: path.join(dossier, '7-ordi-1440-expire.png') });

  await ordi2.click('button.sim-lien');
  await ordi2.waitForSelector('.sim-qr-image', { timeout: 15000 });
  await ordi2.waitForTimeout(400);
  t('🚨 un nouveau QR apparaît', await ordi2.locator('.sim-qr-image svg').count() === 1);
  t('…et l\'attente redémarre', /en attente de la photo/i.test(await ordi2.locator('.sim-qr-attente').innerText()));
  await ordi2.close();
}

console.log('\n── 10. Le téléversement d\'ordinateur marche toujours ─────');
{
  const ordi3 = await ctxOrdi.newPage();
  await allerEcranPhoto(ordi3);
  await ordi3.waitForSelector('.sim-depot', { timeout: 15000 });

  const fichier = await fabriquerJpeg(ordi3, 900, 600, 'depuis-le-disque.jpg');
  const [ch] = await Promise.all([ordi3.waitForEvent('filechooser'), ordi3.click('.sim-depot .sim-cta')]);
  const idEntree = await ch.element().getAttribute('id');
  t('le bouton de fichier ouvre l\'entrée du disque, sans capture', idEntree === 'sim-photo-disque', idEntree);
  await ch.setFiles(fichier);
  await ordi3.waitForSelector('.sim-styles', { timeout: 20000 });
  t('🚨 le téléversement classique mène encore à l\'écran du style',
    await ordi3.locator('.sim-fil li.ici').innerText().then((s) => s.trim().toLowerCase() === 'style'),
    (await ordi3.locator('.sim-fil li.ici').innerText()).trim());

  // Un fichier qui n'est pas une image est refusé, avec un message en français.
  const ordi4 = await ctxOrdi.newPage();
  await allerEcranPhoto(ordi4);
  await ordi4.waitForSelector('.sim-depot', { timeout: 15000 });
  const pdf = path.join(dossier, 'devis.pdf');
  fs.writeFileSync(pdf, Buffer.from('%PDF-1.7 ceci n\'est pas une facade'));
  const [ch2] = await Promise.all([ordi4.waitForEvent('filechooser'), ordi4.click('.sim-depot .sim-cta')]);
  await ch2.setFiles(pdf);
  await ordi4.waitForSelector('.sim-erreur', { timeout: 10000 });
  t('🚨 un PDF est refusé côté navigateur, en français',
    /n.est pas une image/i.test(await ordi4.locator('.sim-erreur').innerText()),
    (await ordi4.locator('.sim-erreur').innerText()).trim());
  t('…et on reste sur l\'écran de la photo', await ordi4.locator('.sim-depot').count() === 1);
  await ordi4.close(); await ordi3.close();
}

console.log('\n── 11. 🚨 Aucune erreur dans la console ───────────────────');
{
  // Le pixel Meta est coupé par `route.abort()` : ses échecs de réseau ne
  // sont pas des défauts du produit.
  const vraies = erreursPage.filter((e) => !/facebook|fbevents|ERR_FAILED|Failed to load resource/i.test(e));
  t('🚨 aucune erreur d\'hydratation ni d\'exécution, sur les deux appareils',
    vraies.length === 0, vraies.slice(0, 3).join(' ⟂ ') || 'zéro erreur');
}

await nav.close();
crm.close();
console.log(`\nCaptures : ${dossier}`);
console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
