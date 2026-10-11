// =============================================================================
// Garde-fou — les pages intérieures restent sur le système de l'accueil
// =============================================================================
//   BASE_URL=http://127.0.0.1:4191 node scripts/check-theme-sombre.mjs
//
// L'AUDIT D'OCTOBRE 2026 : l'accueil est sombre, photographique et calme ;
// chaque page de service, de ville et de blog basculait après le hero dans
// un document BLANC ou CRÈME. Partie 3 : marine partout, le crème réservé
// au texte et au bouton principal.
//
// CE QU'IL AFFIRME, POUR CHAQUE URL DU SITEMAP + /simulateur, /merci,
// /confidentialite, /soumission?service=commercial et le 404 :
//   1. aucune <section> de <main> n'a un fond clair (luminance > 0,2) ;
//   2. le <body> est marine (aucun blanc entre deux sections) ;
//   3. un seul <main> par page.
// L'accueil est la référence et garde sa section de réservation crème : il
// est exclu NOMMÉMENT, pas par un seuil plus lâche.
// =============================================================================
import { chromium } from "playwright";

const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const EXCLUES = new Set(["/"]);
const SEUIL = 0.2;

let ok = 0, ko = 0;
const t = (nom, cond, d = "") => {
  console.log(`  ${cond ? "✅" : "❌"} ${nom}${d ? ` — ${d}` : ""}`);
  cond ? ok++ : ko++;
};

const xml = await (await fetch(`${BASE}/sitemap.xml`)).text();
const chemins = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
for (const c of ["/simulateur", "/merci", "/confidentialite", "/soumission?service=commercial", "/page-introuvable-test"]) {
  if (!chemins.includes(c)) chemins.push(c);
}

const nav = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}
);
const page = await nav.newPage({ viewport: { width: 375, height: 812 } });

console.log(`\n--- ${chemins.length - EXCLUES.size} pages intérieures ---`);
for (const c of chemins) {
  if (EXCLUES.has(c)) continue;
  await page.goto(BASE + c, { waitUntil: "load" });
  const r = await page.evaluate((seuil) => {
    const lum = (css) => {
      const m = css.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const [r, g, b, a = 1] = m[1].split(",").map((x) => parseFloat(x));
      if (a === 0) return null;   // transparent : c'est le parent qui se voit
      const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    };
    const claires = [...document.querySelectorAll("main section")]
      .filter((s) => s.getBoundingClientRect().height > 0)
      .map((s) => ({ s, l: lum(getComputedStyle(s).backgroundColor) }))
      .filter((x) => x.l !== null && x.l > seuil)
      .map((x) => `${x.s.className || "section"} (${getComputedStyle(x.s).backgroundColor})`);
    return {
      claires,
      corps: lum(getComputedStyle(document.body).backgroundColor),
      mains: document.querySelectorAll("main").length,
    };
  }, SEUIL);
  const fautes = [];
  if (r.claires.length) fautes.push(`section claire : ${r.claires.join(", ")}`);
  if (r.corps === null || r.corps > SEUIL) fautes.push(`body clair (${r.corps})`);
  if (r.mains !== 1) fautes.push(`${r.mains} <main>`);
  t(c, fautes.length === 0, fautes.join(" · "));
}

await nav.close();
console.log(`\n${ok}/${ok + ko} vérifications passées.`);
process.exit(ko ? 1 : 0);
