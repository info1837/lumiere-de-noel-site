// =============================================================================
// Garde-fou — le menu mobile ouvert ne cache rien
// =============================================================================
//   npm run check:menu
//
// LA PANNE QUE CE FICHIER FERME
// L'audit visuel n'ouvrait JAMAIS le menu. Il mesurait les pages fermées, donc
// il ne pouvait pas voir que le panneau plein écran défilait derrière l'en-tête
// fixe (mots coupés en deux) ni que la barre d'action du bas recouvrait les
// derniers liens et le courriel — inatteignables même en défilant jusqu'au bout.
// Un audit qui ne regarde que l'état fermé déclare vert un menu cassé.
//
// CE QU'IL AFFIRME, PAR LARGEUR
//   1. aucun élément du menu ne chevauche l'en-tête fixe
//   2. aucun élément du menu ne chevauche la barre du bas, défilement compris
//   3. le DERNIER élément (le courriel) est entièrement visible une fois
//      défilé jusqu'en bas
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const ROUTES = ["/", "/soumission", "/calculatrice", "/secteur"];
const LARGEURS = [
  { w: 375, h: 812 },  // iPhone
  { w: 390, h: 844 },
  { w: 414, h: 896 },
  { w: 768, h: 1024 }, // tablette : hamburger encore actif
];

const nav = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}
);
const echecs = [];
for (const { w, h } of LARGEURS) {
  const page = await nav.newPage({ viewport: { width: w, height: h } });
  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    await page.click(".header-hamburger");
    await page.waitForTimeout(500);
    const r = await page.evaluate(async () => {
      const head = document.querySelector("header").getBoundingClientRect();
      const barEl = document.querySelector(".mobile-bottom-bar");
      const barVisible = barEl && getComputedStyle(barEl).display !== "none";
      const bar = barVisible ? barEl.getBoundingClientRect() : null;
      const zone = document.querySelector(".menu-overlay-defile")
        || [...document.querySelectorAll("div")].find(
             d => getComputedStyle(d).position === "fixed" && d.querySelector("nav"));
      const zr = zone.getBoundingClientRect();

      // ATTENTION — getBoundingClientRect() donne la position GÉOMÉTRIQUE, même
      // pour un élément que le défilement a fait sortir du cadre et que
      // overflow a rogné. Comparer ces rectangles bruts à l'en-tête produit de
      // faux positifs sur des éléments parfaitement invisibles. On ne teste
      // donc que la partie RÉELLEMENT visible de chaque élément, et on vérifie
      // séparément la garantie structurelle : la zone de défilement commence
      // au bas de l'en-tête, donc rien ne peut passer derrière.
      const visible = (q) => ({
        top: Math.max(q.top, zr.top), bottom: Math.min(q.bottom, zr.bottom),
      });
      const chevauche = (q, b) => {
        if (!b) return false;
        const v = visible(q);
        return v.bottom > v.top && v.top < b.bottom && v.bottom > b.top;
      };

      const feuilles = [...zone.querySelectorAll("a, div, p")]
        .filter(e => e.children.length === 0 && e.textContent.trim()
                     && e.getBoundingClientRect().height > 0);
      const sousBarre = [];
      for (const e of feuilles)
        if (chevauche(e.getBoundingClientRect(), bar)) sousBarre.push(e.textContent.trim().slice(0, 30));

      const defilant = zone.scrollHeight > zone.clientHeight ? zone : document.scrollingElement;
      defilant.scrollTop = defilant.scrollHeight;
      await new Promise(k => setTimeout(k, 350));

      const sousBarreApres = [];
      for (const e of feuilles)
        if (chevauche(e.getBoundingClientRect(), bar)) sousBarreApres.push(e.textContent.trim().slice(0, 30));

      const dernier = feuilles[feuilles.length - 1];
      const dq = dernier.getBoundingClientRect();
      return {
        zoneTop: zr.top, enteteBas: head.bottom,
        sousBarre: [...new Set(sousBarre)], sousBarreApres: [...new Set(sousBarreApres)],
        dernier: dernier.textContent.trim().slice(0, 34),
        dernierBas: Math.round(dq.bottom), dernierHaut: Math.round(dq.top),
        zoneBas: Math.round(zr.bottom), barreHaut: bar ? Math.round(bar.top) : null,
      };
    });
    const p = `${w}px ${route}`;
    // 1. garantie structurelle : la zone de défilement démarre SOUS l'en-tête.
    //    C'est ce qui rend impossible qu'un lien passe derrière lui.
    if (r.zoneTop < r.enteteBas - 0.5)
      echecs.push(`${p} — la zone du menu commence à ${r.zoneTop.toFixed(1)}, l'en-tête finit à ${r.enteteBas.toFixed(1)} : le contenu défile derrière l'en-tête`);
    // 2. rien de visible sous la barre du bas, avant comme après défilement
    if (r.sousBarre.length) echecs.push(`${p} — sous la barre du bas : ${r.sousBarre.join(" / ")}`);
    if (r.sousBarreApres.length) echecs.push(`${p} — sous la barre du bas après défilement : ${r.sousBarreApres.join(" / ")}`);
    // 3. le dernier élément (le courriel) est atteignable et entièrement dégagé
    if (r.barreHaut !== null && r.dernierBas > r.barreHaut)
      echecs.push(`${p} — dernier élément « ${r.dernier} » se termine à ${r.dernierBas}, la barre commence à ${r.barreHaut}`);
    if (r.dernierHaut < r.enteteBas || r.dernierBas > r.zoneBas + 1)
      echecs.push(`${p} — dernier élément « ${r.dernier} » jamais entièrement visible (haut ${r.dernierHaut}, bas ${r.dernierBas}, zone ${Math.round(r.zoneTop)}–${r.zoneBas})`);
  }
  await page.close();
}
await nav.close();
if (echecs.length) {
  console.error(`\n✖ ${echecs.length} échec(s) :\n` + echecs.map(e => "   • " + e).join("\n") + "\n");
  process.exit(1);
}
console.log(`\n✓ menu mobile ouvert — rien sous l'en-tête, rien sous la barre du bas, dernier élément atteignable (${ROUTES.length} routes × ${LARGEURS.length} largeurs)\n`);
