// =============================================================================
// Garde-fou — /formation, l'outil mobile des installateurs
// =============================================================================
//   BASE_URL=http://127.0.0.1:3000 node scripts/check-formation.mjs
//   CAPTURES=/chemin/dossier pour garder les captures de chaque écran.
//
// CE QU'IL AFFIRME, À 390 PX, EN CLAIR ET EN SOMBRE (Chromium et WebKit)
//   1. page autonome : doctype, noindex, ni en-tête, ni pied de page, ni pixel ;
//   2. /formation absente du sitemap, et non bloquée par robots.txt (Google
//      doit pouvoir lire le noindex) ;
//   3. le bon logo pour le thème, et l'en-tête tient sur une ligne ;
//   4. les huit écrans de formation, sans débordement horizontal ;
//   5. les 5 boutons ouvrent la bonne vidéo (id dans l'URL, titre YouTube) ;
//   6. le test : 20/23 échoue, 21/23 passe, 23/23 passe, reprise après
//      rechargement, certificat avec le nom.
// =============================================================================
import { chromium, webkit } from "playwright";
import path from "node:path";

const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const CAPTURES = process.env.CAPTURES;

const VIDEOS = [
  ["BgXOVFQIzQQ", "Première connexion"],
  ["bKcbsWL6cj4", "Prise au milieu"],
  ["fsS1PBsuJX0", "Clips bardeaux et pignon"],
  ["_0iGm54N3dY", "Cacher le fil"],
  ["6epD2EPai2Y", "Minuterie"],
];
const HOTES_INTERDITS = /facebook|doubleclick|googletagmanager|googleadservices|_vercel\/insights/;

let ok = 0, ko = 0;
const t = (nom, cond, d = "") => {
  console.log(`  ${cond ? "✅" : "❌"} ${nom}${d ? ` — ${d}` : ""}`);
  cond ? ok++ : ko++;
};

// Les constantes du script de la page sont lisibles par leur nom.
const passerLesModules = async (p) => {
  while (await p.evaluate(() => st.step < MODULES.length)) await p.click("#next");
};
const repondre = async (p, nbBonnes) => {
  const total = await p.evaluate(() => QUIZ.length);
  for (let i = 0; i < total; i++) {
    const bonne = await p.evaluate((i) => QUIZ[i].a, i);
    await p.click(`.opt[data-k="${i < nbBonnes ? bonne : (bonne + 1) % 4}"]`);
    await p.click("#next");
  }
};
const entete = (p) => p.evaluate(() => {
  const h = document.querySelector(".brand h1").getBoundingClientRect();
  const c = document.getElementById("count").getBoundingClientRect();
  return { lignes: Math.round(h.height / parseFloat(getComputedStyle(document.querySelector(".brand h1")).lineHeight)), chevauche: h.right > c.left };
});
const deborde = (p) => p.evaluate(() => document.documentElement.scrollWidth > innerWidth);

async function parcours(nomMoteur, moteur, theme) {
  console.log(`\n${nomMoteur} · ${theme}`);
  const b = await moteur.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: theme, deviceScaleFactor: 2, hasTouch: true });
  const p = await ctx.newPage();
  const erreurs = [], interdits = [];
  p.on("pageerror", (e) => erreurs.push(e.message));
  p.on("console", (m) => m.type() === "error" && erreurs.push(m.text()));
  p.on("request", (r) => HOTES_INTERDITS.test(r.url()) && interdits.push(r.url()));
  const capture = async (nom) => {
    if (CAPTURES) await p.screenshot({ path: path.join(CAPTURES, `${nomMoteur}-${theme}-${nom}.png`) });
  };

  const rep = await p.goto(`${BASE}/formation`, { waitUntil: "networkidle" });
  t("200 en text/html", rep.status() === 200 && /text\/html/.test(rep.headers()["content-type"]));
  t("mode standard (doctype)", await p.evaluate(() => document.compatMode === "CSS1Compat"));
  t("noindex,nofollow", (await p.getAttribute('meta[name="robots"]', "content")) === "noindex,nofollow");
  t("viewport plein écran", /viewport-fit=cover/.test(await p.getAttribute('meta[name="viewport"]', "content")));
  t("aucun en-tête ni pied de page du site", (await p.locator("footer, nav, .site-logo").count()) === 0);
  t("aucune marge autour de la page", await p.evaluate(() => getComputedStyle(document.body).marginTop === "0px"));

  const logo = await p.evaluate(() => [...document.querySelectorAll(".brand-logo")]
    .filter((i) => getComputedStyle(i).display !== "none")
    .map((i) => ({ src: i.getAttribute("src"), l: i.naturalWidth, h: Math.round(i.getBoundingClientRect().height) })));
  t("un seul logo visible, chargé, et le bon pour le thème",
    logo.length === 1 && logo[0].l > 0 && logo[0].src.endsWith(theme === "dark" ? "fond-fonce.svg" : "fond-pale.svg"), JSON.stringify(logo));
  t("titre et compteur sur la même ligne de base", await p.evaluate(() => {
    const base = (el) => {
      const m = document.createElement("span");
      m.style.cssText = "display:inline-block;width:0;height:0";
      el.prepend(m);
      const y = m.getBoundingClientRect().bottom;
      m.remove();
      return y;
    };
    return Math.abs(base(document.querySelector(".brand h1")) - base(document.getElementById("count"))) < 1;
  }));
  t("logo à gauche du titre", await p.evaluate(() => {
    const i = [...document.querySelectorAll(".brand-logo")].find((x) => getComputedStyle(x).display !== "none");
    return i.getBoundingClientRect().right <= document.querySelector(".brand h1").getBoundingClientRect().left;
  }));

  // Les huit écrans, et les boutons vidéo là où ils sont.
  const nbModules = await p.evaluate(() => MODULES.length);
  const vus = [];
  for (let i = 0; i < nbModules; i++) {
    const titre = await p.textContent("#app h2");
    const e = await entete(p);
    t(`écran ${i} : ${titre}`, !(await deborde(p)) && e.lignes === 1 && !e.chevauche, JSON.stringify(e));
    await capture(`module-${i}`);
    for (const lien of await p.locator("a.vidlink").all()) {
      const href = await lien.getAttribute("href");
      const id = href.split("/").pop();
      const attendu = VIDEOS.find(([v]) => v === id);
      vus.push(id);
      const [onglet] = await Promise.all([ctx.waitForEvent("page"), lien.click()]);
      await onglet.waitForLoadState("domcontentloaded").catch(() => {});
      await onglet.waitForTimeout(1500);
      const titreYt = await onglet.title().catch(() => "");
      const oe = await (await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(href)}`)).json().catch(() => ({}));
      t(`vidéo « ${attendu?.[1]} »`, !!attendu && onglet.url().includes(id) && oe.title?.includes(attendu[1]), `${oe.title} | onglet : ${titreYt}`);
      await onglet.close();
    }
    if (i < nbModules - 1) await p.click("#next");
  }
  t("les 5 vidéos, chacune une fois, dans l'ordre", vus.join() === VIDEOS.map(([v]) => v).join());
  await p.click("#next");

  // Le test : bouton bloqué tant qu'on n'a pas répondu, retour de la réponse.
  t("23 questions", (await p.evaluate(() => QUIZ.length)) === 23);
  t("« Question suivante » bloqué sans réponse", await p.isDisabled("#next"));
  await capture("question");
  const faux = await p.evaluate(() => (QUIZ[0].a + 1) % 4);
  await p.click(`.opt[data-k="${faux}"]`);
  t("mauvaise réponse : la correction s'affiche", (await p.textContent(".fb")).includes("Pas tout à fait.") && (await p.locator(".opt.ok").count()) === 1 && (await p.locator(".opt.ko").count()) === 1);
  await capture("question-corrigee");
  await p.reload({ waitUntil: "networkidle" });
  t("rechargement : la réponse et la question sont gardées", (await p.locator(".opt.ko").count()) === 1);
  await p.evaluate(() => { st.answers = {}; st.qi = 0; save(); render(); });
  // Le pire cas de l'en-tête : les questions à deux chiffres.
  await p.evaluate(() => { st.qi = 22; render(); });
  const e23 = await entete(p);
  t("en-tête à la question 23 sur une ligne", e23.lignes === 1 && !e23.chevauche, JSON.stringify(e23));
  await capture("question-23");
  await p.evaluate(() => { st.qi = 0; render(); });

  // Échec à 20/23.
  await repondre(p, 20);
  t("20/23 : échec", (await p.textContent(".score")).trim() === "20 / 23" && (await p.textContent("#app h2")) === "Pas encore");
  t("20/23 : les 3 points à revoir", (await p.locator("#app ul li").count()) === 3);
  t("échec : aucun certificat", (await p.locator(".cert").count()) === 0);
  t("échec : pas de débordement", !(await deborde(p)));
  await capture("echec");
  await p.click("#retry");
  t("« Refaire le test » repart à la question 1", (await p.textContent("#count")) === "Question 1 sur 23");

  // Réussite à la limite, 21/23.
  await repondre(p, 21);
  t("21/23 : réussi", (await p.textContent(".score")).trim() === "21 / 23" && (await p.textContent("#app h2")) === "Réussi");
  await p.click("#restart");
  await passerLesModules(p);

  // Réussite à 23/23, certificat.
  await repondre(p, 23);
  t("23/23 : réussi", (await p.textContent(".score")).trim() === "23 / 23");
  await p.fill("#nm", "Marie-Ève Tremblay-Gagnon");
  t("certificat : le nom s'écrit en direct", (await p.textContent("#cname")) === "Marie-Ève Tremblay-Gagnon");
  const cert = await p.textContent(".cert");
  t("certificat : entreprise, formation, score, date", /Solution Lumière de Noël Inc\./.test(cert) && /a réussi la formation installateur/.test(cert) && /23 \/ 23 · .*2\d{3}/.test(cert), cert.replace(/\s+/g, " ").trim());
  t("certificat : pas de débordement avec un nom long", !(await deborde(p)));
  await capture("certificat");
  await p.reload({ waitUntil: "networkidle" });
  t("rechargement : le certificat et le nom restent", (await p.textContent("#cname")) === "Marie-Ève Tremblay-Gagnon");

  t("aucun pixel, aucune balise pub", interdits.length === 0, interdits.join(" "));
  t("aucune erreur console", erreurs.length === 0, erreurs.join(" | ").slice(0, 300));
  await b.close();
}

const site = await (await fetch(`${BASE}/sitemap.xml`)).text();
t("sitemap servi, sans /formation", site.includes("<urlset") && !site.includes("/formation"));
const robots = await (await fetch(`${BASE}/robots.txt`)).text();
t("robots.txt ne bloque pas /formation", !/Disallow:\s*\/formation/i.test(robots));

for (const theme of ["light", "dark"]) {
  await parcours("chromium", chromium, theme);
  await parcours("webkit", webkit, theme);
}

console.log(`\n${ok} ok, ${ko} échec(s)`);
process.exit(ko ? 1 : 0);
