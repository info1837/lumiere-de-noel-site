// =============================================================================
// Garde-fou — /realisations PAR CHANTIER, et les cartes de /secteur
// =============================================================================
//   BASE_URL=http://127.0.0.1:4191 node scripts/check-galerie.mjs
//
// À 375 px, au VRAI doigt (Input.dispatchTouchEvent, comme check-avant-apres) :
//   1. une carte = un chantier ; les pastilles comptent des CHANTIERS
//      (Commercial = 1, Permanent = 3) et filtrent juste ;
//   2. une carte à plusieurs photos se feuillette au doigt SANS ouvrir la
//      visionneuse ; un toucher l'ouvre sur la photo affichée ;
//   3. la visionneuse : glisser passe les photos du chantier puis le
//      chantier suivant ; ← →, Échap, focus rendu, page bloquée derrière ;
//   4. la maison du permanent : le fondu tourne seul (≈ 2,5 s + 0,8 s), les
//      trois images sont chargées d'avance, un point choisit la couleur et
//      l'étiquette suit, le premier toucher arrête le défilement ;
//      en mouvement réduit, RIEN ne tourne seul ;
//   5. /secteur : chaque carte a une image, et celle de Laval ne nomme pas
//      Laval.
// =============================================================================
import { chromium } from "playwright";

const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
let ok = 0, ko = 0;
const t = (nom, cond, d = "") => {
  console.log(`  ${cond ? "✅" : "❌"} ${nom}${d ? ` — ${d}` : ""}`);
  cond ? ok++ : ko++;
};
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

const nav = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}
);

async function ouvrirPage(options = {}) {
  const ctx = await nav.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, ...options });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await page.goto(`${BASE}/realisations`, { waitUntil: "load" });
  await page.waitForFunction(() => {
    const b = document.querySelector(".chantier button");
    return !!(b && Object.keys(b).some((k) => k.startsWith("__react")));
  });
  const toucher = async (x, y) => {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await attendre(350);
  };
  const glisser = async (x0, x1, y) => {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y }] });
    for (let k = 1; k <= 12; k++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x0 + (x1 - x0) * k / 12, y }] });
      await attendre(10);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await attendre(350);
  };
  const centrer = (sel) => page.locator(sel).first().evaluate((e) => e.scrollIntoView({ block: "center", behavior: "instant" }));
  return { ctx, page, toucher, glisser, centrer };
}

const { ctx, page, toucher, glisser, centrer } = await ouvrirPage();

console.log("\n--- 1. Une carte = un chantier ---");
const nombre = async (f) => Number((await page.locator(".filtre", { hasText: f }).locator(".filtre__n").innerText()).trim());
const attendus = { Tout: 18, "Résidentiel": 11, Commercial: 1, Arbres: 3, Permanent: 3 };
for (const [f, n] of Object.entries(attendus)) {
  const annonce = await nombre(f);
  await page.locator(".filtre", { hasText: f }).click();
  await attendre(150);
  const cartes = await page.locator(".galerie__item").count();
  t(`« ${f} » : ${n} chantier(s)`, annonce === n && cartes === n, `annoncé ${annonce}, affiché ${cartes}`);
}
await page.locator(".filtre", { hasText: "Tout" }).click();
await attendre(150);
const srcs = await page.evaluate(() => [...document.querySelectorAll(".chantier img")].map((i) => new URL(i.currentSrc || i.src).searchParams.get("url") || i.src));
t("🚨 aucune photo dans deux cartes", new Set(srcs).size === srcs.length, `${srcs.length} images, ${new Set(srcs).size} distinctes`);
for (const [id, n] of [["chocolaterie", 2], ["saint-donat", 3], ["toutes-les-ambiances", 3]]) {
  const k = await page.locator(`[data-chantier="${id}"] img`).count();
  t(`« ${id} » réunit ${n} photos`, k === n, `${k}`);
}

console.log("\n--- 2. Feuilleter dans la carte, au doigt ---");
{
  const sel = '[data-chantier="chocolaterie"]';
  await centrer(sel);
  await attendre(200);
  const b = await page.locator(`${sel} .chantier__photo`).boundingBox();
  const active = () => page.locator(`${sel} .chantier__point[aria-pressed="true"]`).getAttribute("aria-label");
  t("la carte commence à la photo 1", (await active()) === "Photo 1 sur 2");
  await glisser(b.x + b.width * 0.8, b.x + b.width * 0.2, b.y + b.height / 2);
  t("🚨 glisser feuillette : photo 2", (await active()) === "Photo 2 sur 2", await active());
  t("🚨 …SANS ouvrir la visionneuse", await page.locator(".visionneuse").count() === 0);
  await toucher(b.x + b.width / 2, b.y + b.height / 3);
  t("🚨 un toucher ouvre la visionneuse", await page.locator('.visionneuse[role="dialog"]').count() === 1);
  t("…sur la photo affichée", /^Photo 2\/2/.test(await page.locator(".visionneuse__compte").innerText()),
    await page.locator(".visionneuse__compte").innerText());
  const vb = await page.locator(".visionneuse__scene").boundingBox();
  await glisser(vb.x + vb.width * 0.2, vb.x + vb.width * 0.8, vb.y + vb.height / 2);
  t("glisser dans la visionneuse revient à la photo 1", /^Photo 1\/2/.test(await page.locator(".visionneuse__compte").innerText()));
  t("la page ne défile pas derrière", await page.evaluate(() => getComputedStyle(document.body).overflow === "hidden"));
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await attendre(200);
  t("→ → passe au chantier suivant", /Chantier \d+ \//.test(await page.locator(".visionneuse__compte").innerText())
    && !/Photo 2\/2/.test(await page.locator(".visionneuse__compte").innerText()),
    await page.locator(".visionneuse__compte").innerText());
  await page.keyboard.press("Escape");
  await attendre(200);
  t("Échap ferme", await page.locator(".visionneuse").count() === 0);
  t("…et le focus revient dans la galerie", await page.evaluate(() => !!document.activeElement?.closest(".galerie")));
}

console.log("\n--- 3. Une maison, toutes les ambiances ---");
{
  const sel = '[data-chantier="toutes-les-ambiances"]';
  // Les clics des pastilles (§1) passent par une souris virtuelle qui reste
  // posée à l'écran : la carte qui défile dessous reçoit un vrai
  // `pointerenter` souris et se met en pause « au survol » — comme prévu.
  // On écarte la souris pour mesurer le défilement automatique.
  await page.mouse.move(1, 1);
  await centrer(sel);
  const etat = () => page.locator(`${sel} .ambiances`).getAttribute("data-ambiance");
  // textContent : l'étiquette est en capitales par la feuille de style.
  const etiquette = () => page.locator(`${sel} .ambiances__etiquette`).textContent();
  const chargees = await page.evaluate((s) => [...document.querySelectorAll(`${s} img`)].map((i) => i.loading === "eager" && i.complete && i.naturalWidth > 0), sel);
  await attendre(1200);
  const e0 = await etat();
  const l0 = await etiquette();
  t("les trois images sont chargées d'avance", chargees.length === 3 && (await page.evaluate((s) => [...document.querySelectorAll(`${s} img`)].every((i) => i.loading === "eager" && i.complete && i.naturalWidth > 0), sel)));
  const transition = await page.evaluate((s) => getComputedStyle(document.querySelector(`${s} .ambiances__img`)).transitionDuration, sel);
  t("le fondu dure 800 ms", transition === "0.8s", transition);
  await attendre(3600);
  const e1 = await etat();
  t("🚨 la couleur change toute seule (≈ 3,3 s)", e1 !== e0, `${e0} → ${e1}`);
  t("…et l'étiquette suit", (await etiquette()) !== l0, `${l0} → ${await etiquette()}`);
  // Mi-fondu : deux images en même temps, aucune ne vaut 0 et 1 pile.
  await attendre(2900);
  const mi = await page.evaluate((s) => [...document.querySelectorAll(`${s} img`)].map((i) => Number(getComputedStyle(i).opacity)), sel);
  t("pendant le fondu, jamais d'écran vide (somme des opacités ≥ 0,9)", mi.reduce((a, b) => a + b, 0) >= 0.9, mi.map((x) => x.toFixed(2)).join(" / "));
  const points = page.locator(`${sel} .ambiances__point`);
  await points.nth(1).click();
  await attendre(900);
  t("🚨 un point choisit la couleur", (await etat()) === "1" && (await points.nth(1).getAttribute("aria-pressed")) === "true");
  t("l'étiquette dit la couleur vue", (await etiquette()) === "Bleu, blanc, rouge", await etiquette());
  t("🚨 après un choix, plus rien ne tourne seul", (await page.locator(`${sel} .ambiances`).getAttribute("data-auto")) === "0");
  await attendre(3600);
  t("…la couleur reste celle choisie", (await etat()) === "1");
}
await ctx.close();

{
  const r = await ouvrirPage({ reducedMotion: "reduce" });
  const sel = '[data-chantier="toutes-les-ambiances"]';
  await r.centrer(sel);
  await attendre(4200);
  t("🚨 mouvement réduit : aucun défilement automatique",
    (await r.page.locator(`${sel} .ambiances`).getAttribute("data-ambiance")) === "0"
    && (await r.page.locator(`${sel} .ambiances`).getAttribute("data-auto")) === "0");
  await r.page.locator(`${sel} .ambiances__point`).nth(2).click();
  await attendre(900);
  t("…les points marchent toujours", (await r.page.locator(`${sel} .ambiances`).getAttribute("data-ambiance")) === "2");
  await r.ctx.close();
}

console.log("\n--- 4. /secteur : une image sur chaque carte ---");
{
  const p2 = await nav.newPage({ viewport: { width: 375, height: 812 } });
  await p2.goto(`${BASE}/secteur`, { waitUntil: "load" });
  await p2.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo({ top: y, behavior: "instant" }); await new Promise((r) => setTimeout(r, 80)); } });
  await attendre(600);
  const cartes = await p2.evaluate(() => [...document.querySelectorAll('main a[href^="/secteur/"]')]
    .filter((a) => a.querySelector("h2"))
    .map((a) => {
      const i = a.querySelector("img");
      return { nom: a.querySelector("h2").textContent, img: !!i, w: i?.getBoundingClientRect().width || 0, alt: i?.alt || "" };
    }));
  t("six cartes", cartes.length === 6, `${cartes.length}`);
  for (const c of cartes) t(`🚨 ${c.nom} a une image`, c.img && c.w > 100 && c.alt.length > 10, c.alt.slice(0, 70));
  const laval = cartes.find((c) => /Laval/.test(c.nom));
  t("🚨 l'image de Laval ne nomme pas Laval", laval && !/Laval/.test(laval.alt), laval?.alt);
  const rs = cartes.find((c) => /Rive-Sud/.test(c.nom));
  t("celle de la Rive-Sud dit Mercier, Rive-Sud", rs && /Mercier/.test(rs.alt) && /Rive-Sud/.test(rs.alt), rs?.alt);
  await p2.close();
}

await nav.close();
console.log(`\n${ok}/${ok + ko} vérifications passées.`);
process.exit(ko ? 1 : 0);
