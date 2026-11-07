// =============================================================================
// Garde-fou — /concours/tirage, le dévoilement filmé pour Instagram
// =============================================================================
//   BASE_URL=http://127.0.0.1:3000 node scripts/check-concours-tirage.mjs
//   CAPTURES=/chemin/dossier pour garder les captures.
//
// CE QU'IL AFFIRME, À 390 PX (GRAND ET PETIT ÉCRAN, Chromium et WebKit)
//   1. page autonome : doctype, noindex (balise + en-tête), ni en-tête, ni pied
//      de page, ni pixel, aucun appel au CRM ;
//   2. absente du sitemap, non bloquée par robots.txt (Google doit lire le noindex) ;
//   3. textes exacts, polices Lumière chargées, logo affiché ;
//   4. rien de la gagnante à l'écran avant le clic, ni pendant le défilement ;
//   5. noms qui défilent, 5 secondes environ, arrêt, résultat, aucun substitut ;
//   6. tout tient sans défiler ; rien ne saute au clic ; recharger remet au départ ;
//   7. aucun rouge ni rose, aucune boucle infinie.
// =============================================================================
import { chromium, webkit } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const CAPTURES = process.env.CAPTURES;
if (CAPTURES) fs.mkdirSync(CAPTURES, { recursive: true });
const URL_PAGE = `${BASE}/concours/tirage`;

let ok = 0, ko = 0;
const t = (nom, cond, d = "") => {
  console.log(`  ${cond ? "✅" : "❌"} ${nom}${d ? ` — ${d}` : ""}`);
  cond ? ok++ : ko++;
};
const norme = (s) => String(s).replace(/\s+/g, " ").trim();

console.log("\n── Serveur ──");
const rep = await fetch(URL_PAGE);
const html = await rep.text();
t("200, HTML", rep.status === 200 && /text\/html/.test(rep.headers.get("content-type")));
t("doctype", /^<!doctype html>/i.test(html));
t("noindex : balise", /<meta name="robots" content="noindex,nofollow">/.test(html));
t("noindex : en-tête", /noindex/.test(rep.headers.get("x-robots-tag") || ""), rep.headers.get("x-robots-tag"));
const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
t("absente du sitemap", !sitemap.includes("/concours/tirage") && sitemap.includes("/concours<"));
const robots = await (await fetch(`${BASE}/robots.txt`)).text();
t("non bloquée par robots.txt", !/Disallow:\s*\/\S/i.test(robots));
t("aucun appel réseau dans le code", !/\bfetch\(|XMLHttpRequest|sendBeacon|https?:\/\//.test(html));
t("aucune boucle infinie", !/\binfinite\b/.test(html));

/** Rouge ou rose : teinte de 330° à 20°, assez saturée. */
function estRougeOuRose(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d < 0.15) return false;
  const h = max === r ? 60 * (((g - b) / d) % 6) : max === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4);
  const teinte = (h + 360) % 360;
  return teinte >= 330 || teinte <= 20;
}
const logoSvg = fs.readFileSync("public/images/logo-horizontal-transparent-fonce.svg", "utf8");
const couleurs = [...new Set((html + logoSvg).match(/#[0-9a-fA-F]{6}\b/g))];
t("aucun rouge ni rose (page + logo)", couleurs.length > 4 && !couleurs.some(estRougeOuRose), couleurs.join(" "));

const hauts = async (p) => p.evaluate(() => ["h1", ".compte", "button", ".petit", ".logo"].map((s) => Math.round(document.querySelector(s).getBoundingClientRect().top)));
const debordement = (p) => p.evaluate(() => {
  const ignore = (n) => n.closest(".etincelles");
  const coupes = [...document.querySelectorAll(".ecran *")].filter((n) => {
    if (ignore(n)) return false;
    const r = n.getBoundingClientRect();
    return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1 || r.bottom > innerHeight + 1 || r.top < -1);
  });
  const lignes = [...document.querySelectorAll(".scene *, .ecran > *")].filter((n) => !ignore(n));
  const scene = document.querySelector(".scene").getBoundingClientRect();
  const visible = [...document.querySelectorAll(".resultat p, .defile p")].filter((n) => n.getBoundingClientRect().height > 0);
  const hors = visible.filter((n) => { const r = n.getBoundingClientRect(); return r.top < scene.top - 1 || r.bottom > scene.bottom + 1; });
  return { large: document.documentElement.scrollWidth > innerWidth, haut: document.documentElement.scrollHeight > innerHeight, coupes: coupes.map((n) => n.className || n.tagName), horsScene: hors.length, n: lignes.length };
});
const propre = (d) => !d.large && !d.haut && d.coupes.length === 0 && d.horsScene === 0;

for (const [nomNav, moteur] of [["Chromium", chromium], ["WebKit", webkit]]) {
  for (const hauteur of [844, 664]) {
    console.log(`\n── ${nomNav}, 390 × ${hauteur} ──`);
    const nav = await moteur.launch();
    const ctx = await nav.newContext({ viewport: { width: 390, height: hauteur }, deviceScaleFactor: 2, hasTouch: true, locale: "fr-CA" });
    const p = await ctx.newPage();
    const requetes = [], erreurs = [];
    p.on("request", (r) => requetes.push(r.url()));
    p.on("pageerror", (e) => erreurs.push(e.message));
    await p.goto(URL_PAGE, { waitUntil: "networkidle" });

    t("titre exact", norme(await p.textContent("h1")) === "Concours 2026 : dévoilement du tirage");
    t("44 participants", norme(await p.textContent(".compte")) === "44 participants");
    t("bouton exact", norme(await p.textContent("button")) === "Dévoiler la gagnante");
    t("petit texte exact", norme(await p.textContent(".petit")) === "Tirage effectué le 6 novembre 2026, sous réserve du règlement");
    t("un seul H1", (await p.locator("h1").count()) === 1);
    t("ni en-tête ni pied de page du site", (await p.locator("nav, .bandeau-rarete, #contenu").count()) === 0);
    t("polices Lumière chargées", await p.evaluate(async () => { await document.fonts.ready; return document.fonts.check('40px "Bebas Neue"') && document.fonts.check('16px "Nunito Sans"'); }));
    t("logo affiché", await p.evaluate(() => { const i = document.querySelector(".logo"); return i.complete && i.naturalWidth > 0; }));
    t("rien de la gagnante avant le clic", !/Laura|Sainte-Thérèse|Félicitations/.test(await p.evaluate(() => document.body.innerText)));
    const avant = await debordement(p);
    t("tout tient, sans défiler", propre(avant), JSON.stringify(avant));
    const hautsAvant = await hauts(p);
    if (CAPTURES) await p.screenshot({ path: path.join(CAPTURES, `${nomNav}-${hauteur}-1-depart.png`) });

    const vus = [];
    await p.exposeFunction("__nom", (n) => vus.push(n));
    await p.evaluate(() => new MutationObserver(() => window.__nom(document.getElementById("centre").textContent))
      .observe(document.getElementById("centre"), { childList: true, characterData: true, subtree: true }));
    const debut = Date.now();
    await p.tap("button");
    await p.waitForTimeout(1800);
    t("le bouton n'est plus cliquable", await p.locator("button").isDisabled());
    t("rien ne saute au clic", JSON.stringify(await hauts(p)) === JSON.stringify(hautsAvant), `${hautsAvant} → ${await hauts(p)}`);
    const pendant = await debordement(p);
    t("le défilement tient à l'écran", propre(pendant), JSON.stringify(pendant));
    t("pas de résultat pendant le défilement", !/Laura|Félicitations/.test(await p.evaluate(() => document.body.innerText)));
    if (CAPTURES) await p.screenshot({ path: path.join(CAPTURES, `${nomNav}-${hauteur}-2-defile.png`) });

    await p.waitForFunction(() => document.getElementById("ecran").dataset.etape === "resultat", null, { timeout: 9000 });
    const duree = Date.now() - debut;
    t("environ 5 secondes", duree >= 4500 && duree <= 6000, `${duree} ms`);
    const inventes = vus.slice(0, -1);
    t("au moins 12 noms différents", new Set(inventes).size >= 12, `${new Set(inventes).size}`);
    t("prénom + initiale seulement", inventes.every((n) => /^\p{L}+ [A-Z]\.$/u.test(n)));
    t("arrêt sur la gagnante, jamais avant", vus.at(-1) === "Laura L." && !inventes.includes("Laura L."), vus.at(-1));
    await p.waitForTimeout(1800);
    t("résultat exact", norme(await p.textContent(".gagnante")) === "Laura L., Sainte-Thérèse", norme(await p.textContent(".gagnante")));
    t("Félicitations !", norme(await p.textContent(".bravo")).replace(/ /g, " ") === "Félicitations !");
    t("le petit texte reste", await p.locator(".petit").isVisible());
    const texte = await p.evaluate(() => document.body.innerText);
    t("aucun substitut", !/substitut/i.test(html + texte));
    const apres = await debordement(p);
    t("le résultat tient à l'écran", propre(apres), JSON.stringify(apres));
    if (CAPTURES) await p.screenshot({ path: path.join(CAPTURES, `${nomNav}-${hauteur}-3-resultat.png`) });

    await p.reload({ waitUntil: "networkidle" });
    t("recharger remet au départ", (await p.locator("#ecran").getAttribute("data-etape")) === "pret" && await p.locator("button").isEnabled());
    const memoire = await p.evaluate(() => localStorage.length + sessionStorage.length + document.cookie.length);
    t("rien de gardé dans le navigateur", memoire === 0, String(memoire));
    const autres = requetes.filter((u) => !u.startsWith(BASE));
    t("aucune requête hors du site", autres.length === 0, autres.join(" "));
    const internes = requetes.filter((u) => /\/api\/|_vercel|facebook|googletagmanager/.test(u));
    t("aucune API ni pixel", internes.length === 0, internes.join(" "));
    t("aucune erreur de page", erreurs.length === 0, erreurs.join(" | "));
    await nav.close();
  }
}
console.log(`\n${ok} réussis, ${ko} échoués`);
process.exit(ko ? 1 : 0);
