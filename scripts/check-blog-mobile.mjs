// =============================================================================
// Garde-fou — un article de blog se LIT sur un téléphone
// =============================================================================
//   node scripts/check-blog-mobile.mjs                (serveur déjà démarré sur :3000)
//   BASE_URL=http://127.0.0.1:4191 node scripts/check-blog-mobile.mjs
//
// LA PANNE QUE CE FICHIER FERME
// La grille article + « À lire ensuite » portait un `gridTemplateColumns`
// en style EN LIGNE. Un style en ligne gagne contre toute media query : à
// 375 px la grille gardait ses deux colonnes, que le navigateur résolvait
// en « 0px 280px ». La colonne de l'article faisait 0 px, le texte
// tombait UN MOT PAR LIGNE, et la barre latérale restait à côté. Sur les
// trois articles, sur tous les téléphones. Aucune erreur, aucun
// débordement : rien ne le signalait.
//
// CE QU'IL AFFIRME, POUR CHAQUE /blog/* DU SITEMAP, À 375 PX
//   1. chaque paragraphe de l'article fait au moins 280 px de large
//   2. « À lire ensuite » est SOUS l'article, pas à côté
//   3. aucun débordement horizontal
// Et à 1440 px : la colonne de l'article ne dépasse pas ~68 caractères,
// en 18 px, interligne 1,7.
//
// Les articles viennent du sitemap, pas d'une liste écrite ici : un
// quatrième article est vérifié le jour où il est publié.
// =============================================================================
import { chromium } from "playwright";

const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const LARGEUR_MIN = 280;

let ok = 0, ko = 0;
const t = (nom, cond, d = "") => {
  console.log(`  ${cond ? "✅" : "❌"} ${nom}${d ? ` — ${d}` : ""}`);
  cond ? ok++ : ko++;
};

const xml = await (await fetch(`${BASE}/sitemap.xml`)).text();
const chemins = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => new URL(m[1]).pathname)
  .filter((p) => /^\/blog\/[^/]+$/.test(p));
t("le sitemap annonce des articles", chemins.length > 0, `${chemins.length}`);

const nav = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}
);

for (const chemin of chemins) {
  console.log(`\n--- ${chemin} ---`);

  const tel = await nav.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  await tel.goto(BASE + chemin, { waitUntil: "networkidle" });
  const m = await tel.evaluate(() => {
    const art = document.querySelector("article");
    const aside = document.querySelector(".blog-aside");
    const ps = art ? [...art.querySelectorAll("p")].filter((p) => p.getClientRects().length) : [];
    const larg = ps.map((p) => Math.round(p.getBoundingClientRect().width));
    const de = document.documentElement;
    return {
      n: ps.length,
      min: larg.length ? Math.min(...larg) : 0,
      artBas: art ? art.getBoundingClientRect().bottom : null,
      asideHaut: aside ? aside.getBoundingClientRect().top : null,
      debord: de.scrollWidth - de.clientWidth,
    };
  });
  t("l'article a des paragraphes", m.n > 0, `${m.n}`);
  t(`🚨 375 px : aucun paragraphe sous ${LARGEUR_MIN} px`, m.min >= LARGEUR_MIN, `le plus étroit : ${m.min} px`);
  t("🚨 375 px : « À lire ensuite » est SOUS l'article",
    m.asideHaut !== null && m.artBas !== null && m.asideHaut >= m.artBas - 1,
    `article finit à ${Math.round(m.artBas)}, aside commence à ${Math.round(m.asideHaut)}`);
  t("375 px : aucun débordement horizontal", m.debord <= 0, `${m.debord} px`);
  await tel.close();

  const bureau = await nav.newPage({ viewport: { width: 1440, height: 900 } });
  await bureau.goto(BASE + chemin, { waitUntil: "networkidle" });
  const d = await bureau.evaluate(() => {
    const p = document.querySelector("article p");
    const cs = getComputedStyle(p);
    // 1ch ≈ largeur du « 0 » dans la police du paragraphe.
    const s = document.createElement("span");
    s.style.cssText = `font:${cs.font};position:absolute;visibility:hidden`;
    s.textContent = "0".repeat(100);
    document.body.appendChild(s);
    const ch = s.getBoundingClientRect().width / 100;
    s.remove();
    return {
      taille: parseFloat(cs.fontSize),
      interligne: parseFloat(cs.lineHeight) / parseFloat(cs.fontSize),
      enCh: p.getBoundingClientRect().width / ch,
    };
  });
  t("1440 px : corps en 18 px", Math.abs(d.taille - 18) < 0.5, `${d.taille} px`);
  t("1440 px : interligne 1,7", Math.abs(d.interligne - 1.7) < 0.05, d.interligne.toFixed(2));
  t("1440 px : mesure ≤ ~68 caractères", d.enCh <= 70, `${Math.round(d.enCh)} ch`);
  await bureau.close();
}

await nav.close();
console.log(`\n${ok}/${ok + ko} vérifications passées.`);
process.exit(ko ? 1 : 0);
