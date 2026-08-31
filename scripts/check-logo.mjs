// =============================================================================
// Garde-fou — le logo de l'en-tête ne doit JAMAIS être écrasé
// =============================================================================
//   node scripts/check-logo.mjs                  (serveur déjà démarré sur :3000)
//   BASE_URL=http://127.0.0.1:3400 node scripts/check-logo.mjs
//
// LA PANNE QUE CE FICHIER FERME
// Le lien du logo était le seul élément flex compressible de l'en-tête. La nav
// desktop à sept entrées dépassait la largeur disponible de 215 px, et le
// navigateur absorbait ce dépassement en réduisant le logo à 0 px de LARGE.
// Résultat : l'image se téléchargeait (200 OK), aucune erreur de console,
// aucun débordement horizontal — le débordement était « payé » par le logo.
// Le logo était donc invisible sur TOUTES les pages à partir de 1024 px, et
// écrasé (27 à 49 px au lieu de 110) sur mobile. Aucun contrôle existant ne
// mesurait la largeur RENDUE d'une image : l'audit visuel regardait les images
// cassées et le débordement, or ici rien n'était cassé et rien ne débordait.
//
// CE QU'IL AFFIRME, PAR ROUTE ET PAR LARGEUR
//   1. le <header> contient bien une image .site-logo
//   2. cette image est rendue à au moins 90 px de large
//   3. aucun débordement horizontal
//   4. aucune image rendue à taille nulle
//
// IL EST VÉRIFIÉ : passé sur le code d'avant le correctif, il rendait
// 154 échecs. Un contrôle incapable d'échouer ne prouve rien.
// =============================================================================
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const ROUTES = ["/", "/services", "/services/lumieres-de-noel-residentiel",
  "/services/lumieres-de-noel-commercial", "/services/eclairage-architectural-permanent",
  "/eclairage-architectural", "/realisations", "/blog", "/calculatrice",
  "/renouvellement", "/secteur", "/soumission", "/merci"];
// 1159 et 1160 encadrent le palier de la nav desktop : le défaut vivait juste
// en dessous. Retirer ces deux largeurs, c'est rouvrir le trou.
const LARGEURS = [1600, 1440, 1280, 1160, 1159, 1024, 900, 768, 560, 390];
const LARGEUR_MIN = 90;

const nav = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}
);
const echecs = [];
for (const width of LARGEURS) {
  const page = await nav.newPage({ viewport: { width, height: 900 } });
  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    const r = await page.evaluate(() => {
      const i = document.querySelector("header img.site-logo");
      const de = document.documentElement;
      return {
        logo: i ? { w: i.clientWidth, h: i.clientHeight } : null,
        debordement: de.scrollWidth - de.clientWidth,
        nulles: [...document.querySelectorAll("img")]
          .filter((x) => x.clientWidth === 0 || x.clientHeight === 0)
          .map((x) => x.getAttribute("src")),
      };
    });
    if (!r.logo) echecs.push(`${width}px ${route} — aucune image .site-logo dans le <header>`);
    else if (r.logo.w < LARGEUR_MIN) echecs.push(`${width}px ${route} — logo écrasé à ${r.logo.w}px (minimum ${LARGEUR_MIN})`);
    if (r.debordement > 1) echecs.push(`${width}px ${route} — débordement horizontal de ${r.debordement}px`);
    if (r.nulles.length) echecs.push(`${width}px ${route} — image(s) rendue(s) à taille nulle : ${r.nulles.join(", ")}`);
  }
  await page.close();
}
await nav.close();

if (echecs.length) {
  console.error(`\n✖ ${echecs.length} échec(s) :\n` + echecs.map((e) => "   • " + e).join("\n") + "\n");
  process.exit(1);
}
console.log(`\n✓ logo intact, aucun débordement, aucune image nulle — ${ROUTES.length} routes × ${LARGEURS.length} largeurs (${ROUTES.length * LARGEURS.length} vérifications)\n`);
