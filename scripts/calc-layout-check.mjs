// Audit de mise en page + contraste de la calculatrice, chromium ET webkit.
//
// Ce que ça vérifie, pour CHAQUE nœud de texte visible du panneau :
//   1. sa boîte est contenue dans sa carte parente (rien ne déborde)
//   2. sa boîte est contenue dans le panneau blanc
//   3. le contraste texte/fond effectif est ≥ 4.5:1
//
// Doit ÉCHOUER sur origin/main (le libellé des cases « extras » sort de la
// carte, poussé par input{width:100%}) et passer sur la branche.
//
//   node scripts/calc-layout-check.mjs --url=https://…
import { chromium, webkit } from 'playwright';

const url = (process.argv.find((a) => a.startsWith('--url=')) || '').slice(6)
  || 'http://localhost:3000';
const BYPASS = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || '';

const VIEWPORTS = [
  { nom: '390x844', width: 390, height: 844 },
  { nom: '1440x900', width: 1440, height: 900 },
];

// Luminance relative WCAG puis rapport de contraste.
function lum([r, g, b]) {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contraste(fg, bg) {
  const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}
function rgb(s) {
  const m = String(s).match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(',').map((x) => parseFloat(x));
  return { c: [p[0], p[1], p[2]], a: p[3] === undefined ? 1 : p[3] };
}

// Étapes : on avance dans le tunnel en cliquant, en s'arrêtant si un bouton
// n'existe pas (le parcours manuel n'a pas toutes les étapes).
async function auditerEcran(page, nom, sortie) {
  const noeuds = await page.evaluate(() => {
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && st.visibility !== 'hidden'
        && st.display !== 'none' && parseFloat(st.opacity) > 0.05;
    };
    // Couleur de fond effective : on remonte jusqu'au premier ancêtre opaque.
    const fondEffectif = (el) => {
      let n = el;
      while (n && n !== document.documentElement) {
        const bg = getComputedStyle(n).backgroundColor;
        const m = bg.match(/rgba?\(([^)]+)\)/);
        if (m) { const p = m[1].split(',').map(parseFloat); if (p[3] === undefined || p[3] > 0.9) return bg; }
        n = n.parentElement;
      }
      return getComputedStyle(document.body).backgroundColor || 'rgb(255,255,255)';
    };
    const dedans = (a, b, tol = 1) =>
      a.left >= b.left - tol && a.right <= b.right + tol
      && a.top >= b.top - tol && a.bottom <= b.bottom + tol;

    const panneau = document.querySelector('[data-calc-panneau]')
      || document.querySelector('main') || document.body;
    const pr = panneau.getBoundingClientRect();
    const out = [];
    for (const el of panneau.querySelectorAll('*')) {
      if (!visible(el)) continue;
      // uniquement les éléments portant du texte propre
      const propre = [...el.childNodes]
        .filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim();
      if (!propre) continue;
      const r = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      const carte = el.closest('label, .carte, [data-carte]');
      out.push({
        texte: propre.slice(0, 48),
        tag: el.tagName.toLowerCase(),
        couleur: st.color,
        fond: fondEffectif(el),
        taille: parseFloat(st.fontSize),
        gras: (parseInt(st.fontWeight, 10) || 400) >= 700,
        dansPanneau: dedans(r, pr),
        dansCarte: carte ? dedans(r, carte.getBoundingClientRect()) : true,
        aUneCarte: !!carte,
        box: { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width) },
        panneauBox: { l: Math.round(pr.left), r: Math.round(pr.right) },
      });
    }
    return out;
  });

  // Contrôles enveloppés par un <label> : c'est LE défaut de production.
  // Une case à cocher dont la BOÎTE fait 334 px (glyphe minuscule, boîte
  // énorme, à cause de input{width:100%}) repousse le texte à l'autre bout
  // de la carte. Géométriquement le texte reste « dans » la carte, donc un
  // simple test de débordement ne voit rien : on mesure donc le contrôle et
  // l'écart contrôle→texte.
  const controles = await page.evaluate(() => {
    const out = [];
    for (const lab of document.querySelectorAll('label')) {
      const ctl = lab.querySelector('input[type=checkbox], input[type=radio]');
      if (!ctl) continue;
      const r = ctl.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      // premier élément porteur de texte à côté du contrôle
      const txt = [...lab.querySelectorAll('*')].find(
        (e) => e !== ctl && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()),
      );
      const tr = txt ? txt.getBoundingClientRect() : null;
      out.push({
        texte: lab.innerText.trim().slice(0, 40),
        largeurControle: Math.round(r.width),
        hauteurControle: Math.round(r.height),
        ecart: tr ? Math.round(tr.left - r.right) : null,
      });
    }
    return out;
  });
  for (const c of controles) {
    if (c.largeurControle > 32) {
      sortie.push({ ecran: nom, type: 'CONTROLE_GEANT', texte: c.texte,
        detail: `case/radio ${c.largeurControle}×${c.hauteurControle}px (max 32)` });
    } else if (c.ecart !== null && c.ecart > 40) {
      sortie.push({ ecran: nom, type: 'TEXTE_ECARTE', texte: c.texte,
        detail: `${c.ecart}px entre le contrôle et son texte (max 40)` });
    }
  }

  for (const n of noeuds) {
    if (!n.dansPanneau) {
      sortie.push({ ecran: nom, type: 'DEBORDE_PANNEAU', ...n });
      continue;
    }
    if (n.aUneCarte && !n.dansCarte) {
      sortie.push({ ecran: nom, type: 'DEBORDE_CARTE', ...n });
      continue;
    }
    const fg = rgb(n.couleur); const bg = rgb(n.fond);
    if (!fg || !bg || fg.a < 0.95) continue;
    const ratio = contraste(fg.c, bg.c);
    // Seuil WCAG AA : 3:1 pour le grand texte (≥24px, ou ≥18.66px gras)
    const grand = n.taille >= 24 || (n.taille >= 18.66 && n.gras);
    const seuil = grand ? 3 : 4.5;
    if (ratio < seuil) {
      sortie.push({ ecran: nom, type: 'CONTRASTE', ratio: ratio.toFixed(2), seuil, ...n });
    }
  }
}

const echecs = [];
for (const [nomMoteur, moteur] of [['chromium', chromium], ['webkit', webkit]]) {
  const navigateur = await moteur.launch();
  for (const vp of VIEWPORTS) {
    const ctx = await navigateur.newContext({
      viewport: { width: vp.width, height: vp.height },
      extraHTTPHeaders: BYPASS ? { 'x-vercel-protection-bypass': BYPASS } : {},
    });
    const page = await ctx.newPage();
    await page.goto(`${url}/calculatrice`, { waitUntil: 'networkidle' });
    const etiq = `${nomMoteur} ${vp.nom}`;

    await auditerEcran(page, `${etiq} · étape 1`, echecs);

    // Chemin manuel : il évite la carte satellite et atteint « extras ».
    const manuel = page.getByRole('button', { name: /saisir|manuel|sans carte|entrer/i }).first();
    if (await manuel.count()) {
      await manuel.click().catch(() => {});
      await page.waitForTimeout(400);
      const champ = page.locator('#pieds-manuels');
      if (await champ.count()) { await champ.fill('180'); await page.waitForTimeout(200); }
      await auditerEcran(page, `${etiq} · saisie manuelle`, echecs);
      const suite = page.getByRole('button', { name: /continuer|suivant/i }).first();
      if (await suite.count()) { await suite.click().catch(() => {}); await page.waitForTimeout(400); }
    }

    // Étape « extras » — celle du bug.
    if (await page.getByText(/Autre chose à illuminer/i).count()) {
      await auditerEcran(page, `${etiq} · extras`, echecs);
      const voir = page.getByRole('button', { name: /voir mon prix/i }).first();
      if (await voir.count()) { await voir.click().catch(() => {}); await page.waitForTimeout(400); }
      await auditerEcran(page, `${etiq} · contact`, echecs);

      // Écran de PRIX (5e segment). L'API est bouchonnée : on veut mesurer la
      // mise en page, pas écrire un vrai lead dans le CRM à chaque exécution.
      await page.route('**/api/calc-noel', (route) => route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          ok: true, quotable: true, linearFt: 180, total: 2340,
          note: 'Prix ferme pour 180 pi linéaires.',
          includes: ['Installation', 'Entretien pendant la saison', 'Retrait en janvier', 'Entreposage'],
          surPlace: ['Colonnes / poteaux'], leadEnregistre: true,
        }),
      }));
      const remplir = async (ph, v) => {
        const c = page.getByPlaceholder(ph).first();
        if (await c.count()) await c.fill(v);
      };
      await remplir(/nom/i, 'TEST Claude');
      await remplir(/t[ée]l[ée]phone/i, '4388126635');
      const afficher = page.getByRole('button', { name: /afficher mon prix/i }).first();
      if (await afficher.count()) {
        await afficher.click().catch(() => {});
        await page.waitForTimeout(900);
        await auditerEcran(page, `${etiq} · prix`, echecs);
      }
    }
    await ctx.close();
  }
  await navigateur.close();
}

const parEcran = new Map();
for (const e of echecs) parEcran.set(e.ecran, (parEcran.get(e.ecran) || 0) + 1);

if (echecs.length === 0) {
  console.log(`\n✅ ${url} — aucun débordement, aucun contraste < seuil (chromium + webkit, 390 et 1440)\n`);
  process.exit(0);
}
console.log(`\n❌ ${echecs.length} problème(s) :\n`);
for (const e of echecs.slice(0, 40)) {
  if (e.type === 'CONTRASTE') {
    console.log(`  [${e.ecran}] CONTRASTE ${e.ratio}:1 < ${e.seuil} — « ${e.texte} »`);
    console.log(`      ${e.couleur} sur ${e.fond}`);
  } else if (e.detail) {
    console.log(`  [${e.ecran}] ${e.type} — « ${e.texte} »`);
    console.log(`      ${e.detail}`);
  } else {
    console.log(`  [${e.ecran}] ${e.type} — « ${e.texte} » <${e.tag}>`);
    console.log(`      texte ${e.box.l}→${e.box.r} (${e.box.w}px), panneau ${e.panneauBox.l}→${e.panneauBox.r}`);
  }
}
if (echecs.length > 40) console.log(`  … et ${echecs.length - 40} autres`);
console.log();
process.exit(1);
