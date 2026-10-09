// Le texte d'une carte ne touche jamais son bord.
//
//   npx next start -p 3230 &   puis   BASE_URL=http://localhost:3230 node scripts/check-cartes-padding.mjs
//
// ⚠️ CE HARNAIS EXISTE À CAUSE D'UNE RÉGRESSION QUE J'AI INTRODUITE.
// « Respiration 3/4 » a remplacé un `padding: 24` en style inline par la
// classe .carte-corps — définie UNIQUEMENT sous 768 px. Au-dessus, la zone
// texte n'avait plus aucune marge : « RÉSIDENTIEL » touchait le bord et les
// puces étaient coupées en deux. Dix-huit textes concernés à 1440 px, zéro
// à 390 px — le défaut était desktop seulement, donc invisible dans une
// refonte qui se vérifiait au téléphone.
//
// On ne mesure PAS le padding déclaré : une carte peut porter sa marge sur
// un enfant, et une autre sur elle-même. On mesure ce que l'œil voit —
// l'écart entre le texte et le bord de la carte.

import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:3230';
const ROUTES = ['/', '/services', '/services/lumieres-de-noel-residentiel',
  '/services/lumieres-de-noel-commercial', '/eclairage-architectural',
  '/soumission', '/calculatrice', '/secteur/blainville', '/realisations'];
const ECART_MIN = 12;   // sous 12 px, ça se lit comme « collé »

let pass = 0, fail = 0;
const t = (n, ok, d = '') => { console.log(`  ${ok ? '✅' : '❌'} ${n}${d ? ` — ${d}` : ''}`); ok ? pass++ : fail++; };

const MESURE = `(() => {
  const out = [];
  for (const c of document.querySelectorAll('article, [class*="card"], [class*="carte"]')) {
    const rc = c.getBoundingClientRect();
    if (rc.width < 140 || rc.height < 90) continue;
    for (const el of c.querySelectorAll('h1,h2,h3,h4,p,li,span,div')) {
      const txt = (el.textContent || '').trim();
      if (!txt || txt.length < 8) continue;
      // Seulement les FEUILLES de texte : un conteneur hérite du rectangle
      // de ses enfants et ferait compter la même phrase trois fois.
      if ([...el.children].some((k) => (k.textContent || '').trim().length > 8)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 30 || r.height < 8) continue;
      const g = Math.round(r.left - rc.left), d = Math.round(rc.right - r.right);
      if (g < ${ECART_MIN} || d < ${ECART_MIN}) {
        out.push(((c.className||'').toString().split(/\\s+/)[0] || c.tagName.toLowerCase())
          + ' g=' + g + ' d=' + d + ' « ' + txt.replace(/\\s+/g,' ').slice(0,28) + ' »');
      }
    }
  }
  return [...new Set(out)];
})()`;

const nav = await chromium.launch();
for (const w of [1440, 390]) {
  console.log(`\n--- ${w} px ---`);
  const page = await (await nav.newContext({ viewport: { width: w, height: 900 } })).newPage();
  let colles = [];
  for (const route of ROUTES) {
    const ok = await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60000 })
      .then((r) => r?.ok()).catch(() => false);
    if (!ok) continue;
    await page.waitForTimeout(700);
    const d = await page.evaluate(MESURE);
    colles.push(...d.map((x) => `${route} ${x}`));
  }
  t(`🚨 aucun texte collé au bord d'une carte (18 à 1440 px avant)`, colles.length === 0,
    colles.slice(0, 4).join(' | ') || `${ROUTES.length} routes balayées`);
  await page.close();
}

// La marge est bien sur la boîte TEXTE, pas sur la carte : la photo doit
// rester pleine largeur. Une carte dont la photo se rétrécit a reçu la
// marge au mauvais endroit.
{
  // ⚠️ LES CARTES DE SERVICE ONT QUITTÉ L'ACCUEIL.
  //
  // Cette vérification visait `article.glow-card` + `.carte-corps` sur
  // « / ». La refonte « soustraction » a retiré la grille de services de
  // l'accueil — elle demandait au visiteur de choisir un rayon avant
  // d'avoir vu une maison illuminée. Les cartes existent toujours, sur
  // /services, et c'est là qu'on les mesure : le défaut gardé (la marge
  // posée sur la carte au lieu de la boîte texte, ce qui rétrécit la
  // photo) est exactement le même.
  const page = await (await nav.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto(BASE + '/services', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1200);
  const r = await page.evaluate(`(() => {
    const c = document.querySelector('.glow-card');
    if (!c) return null;
    const img = c.querySelector('img');
    if (!img) return null;
    const rc = c.getBoundingClientRect(), ri = img.getBoundingClientRect();
    // La boîte TEXTE est le frère du cadre photo, pas la carte elle-même.
    const corps = img.parentElement?.nextElementSibling;
    const s = corps ? getComputedStyle(corps) : null;
    return { debordPhoto: Math.round(ri.width - rc.width),
             padding: s ? [s.paddingTop, s.paddingLeft].map((v) => Math.round(parseFloat(v))) : null };
  })()`);
  console.log('\n--- la photo garde sa pleine largeur (/services) ---');
  t('la photo fait toute la largeur de la carte', r && Math.abs(r.debordPhoto) <= 2, `écart ${r?.debordPhoto} px`);
  t('🚨 la marge est sur la boîte TEXTE, pas sur la carte',
    !!(r?.padding) && r.padding[0] >= 20 && r.padding[1] >= 20, String(r?.padding));
  await page.close();
}

await nav.close();
console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
