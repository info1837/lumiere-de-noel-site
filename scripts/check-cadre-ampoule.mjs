// Cadre « ampoule » : aucun texte ne touche le contour, culot entier, pas de débordement (2026-11-24).
//   node scripts/check-cadre-ampoule.mjs            (BASE_URL=http://localhost:3000 par défaut)
//   CAPTURES=docs/captures/cadre-ampoule node scripts/check-cadre-ampoule.mjs
// Même mesure que le robot QA d'Operatr (flux `cadre-ampoule`) : contour réel du verre (tracé SVG
// échantillonné), culot, nœuds texte de la section et bouton. Largeurs : 360, 390, 430, 1440.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const CAPTURES = process.env.CAPTURES || null;
const PAGES = [
  { nom: 'accueil', chemin: '/', section: '#inclus' },
  { nom: 'commercial', chemin: '/services/lumieres-de-noel-commercial', section: 'section:has(.offre--cadre)' },
  { nom: 'vieux-montreal', chemin: '/secteur/vieux-montreal', section: 'section:has(.offre--cadre)' },
];
const LARGEURS = [360, 390, 430, 1440];
let ok = 0, ko = 0;
const t = (n, c, d = '') => { console.log(`  ${c ? '✅' : '❌'} ${n}${d ? ` — ${d}` : ''}`); c ? ok++ : ko++; };
if (CAPTURES) fs.mkdirSync(CAPTURES, { recursive: true });
const nav = await chromium.launch();
try {
  for (const largeur of LARGEURS) {
    const ctx = await nav.newContext({ viewport: { width: largeur, height: largeur > 900 ? 900 : 844 }, deviceScaleFactor: CAPTURES ? 2 : 1, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    for (const pg of PAGES) {
      const r = await p.goto(BASE + pg.chemin, { waitUntil: 'networkidle', timeout: 60_000 });
      if (!r?.ok()) { t(`${pg.nom} ${largeur} : HTTP ${r?.status()}`, false); continue; }
      await p.evaluate(async (sel) => { const s = document.querySelector(sel); if (!s) return; for (const el of s.querySelectorAll('.rv')) { el.scrollIntoView({ block: 'center' }); await new Promise((o) => setTimeout(o, 50)); } s.querySelector('.cadre-ampoule')?.scrollIntoView({ block: 'center' }); }, pg.section);
      await p.waitForFunction((sel) => { const img = document.querySelector(`${sel} .cadre-ampoule img`); return !!img && img.complete && img.naturalWidth > 0; }, pg.section, { timeout: 20_000 }).catch(() => {});
      await p.waitForTimeout(500);
      const m = await p.evaluate((sel) => {
        const sec = document.querySelector(sel), fig = sec?.querySelector('.cadre-ampoule');
        if (!fig) return { manque: true };
        const f = fig.getBoundingClientRect(), cs = getComputedStyle(fig), v = (k) => +cs.getPropertyValue(k);
        const u = f.width / v('--vb-w');
        const P = (x, y) => [f.left + (x - v('--vb-x')) * u, f.top + (y - v('--vb-y')) * u];
        const th = (17 * Math.PI) / 180;
        const rot = (x, y) => [60 + (x - 60) * Math.cos(th) - (y - 90) * Math.sin(th), 90 + (x - 60) * Math.sin(th) + (y - 90) * Math.cos(th)];
        const contour = fig.querySelectorAll('.cadre-ampoule__contour path');
        const verre = contour[contour.length - 1];
        if (!verre) return { manque: true };
        const L = verre.getTotalLength(), pts = [];
        for (let i = 0; i < 240; i++) { const q = verre.getPointAtLength((L * i) / 240); pts.push(P(...rot(q.x, q.y))); }
        const culot = [[47, 12], [73, 12], [44, 26], [76, 26]].map(([x, y]) => P(...rot(x, y)));
        pts.push(...culot);
        const rayon = 3.5 * u + 2;
        const rects = [];
        for (const e of sec.querySelectorAll('.offre-intro *, .offre-colonne *'))
          for (const n of e.childNodes)
            if (n.nodeType === 3 && n.textContent.trim()) { const rg = document.createRange(); rg.selectNodeContents(n); for (const r of rg.getClientRects()) rects.push([r, n.textContent.trim().slice(0, 30)]); }
        const bouton = sec.querySelector('.offre-colonne > a');
        if (bouton) rects.push([bouton.getBoundingClientRect(), 'bouton']);
        const touche = [...new Set(rects.filter(([r]) => pts.some(([x, y]) => x > r.left - rayon && x < r.right + rayon && y > r.top - rayon && y < r.bottom + rayon)).map(([, n]) => n))];
        const culotD = Math.max(...culot.map((q) => q[0])) + 3.5 * u, culotG = Math.min(...culot.map((q) => q[0])) - 3.5 * u;
        return { touche, culotEntier: culotG >= 0 && culotD <= innerWidth + 1, deborde: document.documentElement.scrollWidth > innerWidth, hauteur: Math.round(sec.getBoundingClientRect().height) };
      }, pg.section);
      t(`${pg.nom} ${largeur} : aucun texte ne touche le contour`, !m.manque && !m.touche.length, m.manque ? 'cadre absent' : m.touche.join(' | '));
      t(`${pg.nom} ${largeur} : culot entier, pas de débordement`, m.culotEntier && !m.deborde);
      console.log(`     (hauteur de la section : ${m.hauteur} px)`);
      if (CAPTURES) { const sec = await p.$(pg.section); await sec?.screenshot({ path: path.join(CAPTURES, `${pg.nom}-${largeur}.png`) }); }
    }
    await ctx.close();
  }
} finally { await nav.close(); }
console.log(`\n${ok} ✅  ${ko} ❌`);
process.exit(ko ? 1 : 0);
