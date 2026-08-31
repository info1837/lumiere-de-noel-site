// =============================================================================
// Garde-fou — tout l'en-tête tient dans l'écran
// =============================================================================
//   npm run check:entete
//
// POURQUOI CE CONTRÔLE N'EST PAS UN DOUBLON DE L'AUDIT DE DÉBORDEMENT
// Les contrôles existants comparent documentElement.scrollWidth à clientWidth.
// Or body porte overflow-x: hidden — le navigateur RABAT alors scrollWidth sur
// clientWidth. Un élément peut sortir de 200px de l'écran et l'écart mesuré
// reste zéro. C'est ce qui est arrivé : après le correctif du logo, le bouton
// hamburger était hors écran sur TOUS les téléphones (320–430px) et les 110
// vérifications de check-logo restaient vertes.
//
// Ce fichier ne regarde donc pas scrollWidth. Il prend le bord droit et le bord
// gauche RÉELS de chaque élément de l'en-tête et exige qu'ils tiennent dans la
// fenêtre — hamburger en premier, puisque sans lui on ne peut plus naviguer.
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const ROUTES = ["/", "/soumission", "/calculatrice"];
// 320 = le plus petit téléphone encore en service (iPhone SE 1re gén.).
// 430 = iPhone Pro Max. 1023/1024 encadrent la bascule de la barre du bas,
// 1159/1160 celle de la nav horizontale : les deux paliers ont déjà cassé ici.
const LARGEURS = [320, 360, 375, 390, 414, 430, 600, 768, 1023, 1024, 1159, 1160, 1280, 1440];

const nav = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}
);
const echecs = [];
for (const w of LARGEURS) {
  const page = await nav.newPage({ viewport: { width: w, height: 812 } });
  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    const r = await page.evaluate((W) => {
      const nom = (e) => e.getAttribute("aria-label") || e.textContent.trim().slice(0, 24)
        || (typeof e.className === "string" ? e.className : e.tagName);
      const visible = (e) => {
        const s = getComputedStyle(e);
        return s.display !== "none" && s.visibility !== "hidden" && e.getBoundingClientRect().width > 0;
      };
      const head = document.querySelector("header");
      const cibles = [...head.querySelectorAll("a, button, img")].filter(visible);
      const dehors = [];
      for (const e of cibles) {
        const q = e.getBoundingClientRect();
        if (q.right > W + 0.5) dehors.push(`${nom(e)} dépasse à droite (${Math.round(q.right)} > ${W})`);
        if (q.left < -0.5)     dehors.push(`${nom(e)} dépasse à gauche (${Math.round(q.left)})`);
      }
      const ham = head.querySelector(".header-hamburger");
      const hamVisible = ham && visible(ham);
      const hq = hamVisible ? ham.getBoundingClientRect() : null;
      const navH = head.querySelector(".header-desktop-nav");
      const navVisible = navH && visible(navH);
      return {
        dehors,
        hamburgerUtilisable: hamVisible ? (hq.right <= W + 0.5 && hq.left >= -0.5) : null,
        hamburgerDroite: hq ? Math.round(hq.right) : null,
        navVisible, hamVisible,
      };
    }, w);
    const p = `${w}px ${route}`;
    for (const d of r.dehors) echecs.push(`${p} — ${d}`);
    // Sans hamburger NI nav horizontale, il n'y a plus aucune navigation.
    if (!r.navVisible && !r.hamVisible) echecs.push(`${p} — aucune navigation : ni nav horizontale, ni hamburger`);
    if (r.hamburgerUtilisable === false)
      echecs.push(`${p} — le hamburger est hors écran (bord droit ${r.hamburgerDroite}) : impossible d'ouvrir le menu`);
  }
  await page.close();
}
await nav.close();
if (echecs.length) {
  console.error(`\n✖ ${echecs.length} échec(s) :\n` + [...new Set(echecs)].map(e => "   • " + e).join("\n") + "\n");
  process.exit(1);
}
console.log(`\n✓ en-tête entièrement dans l'écran — ${ROUTES.length} routes × ${LARGEURS.length} largeurs (320 à 1440px)\n`);
