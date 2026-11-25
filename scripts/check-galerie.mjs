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
//   4. la maison du permanent : rien ne tourne seul (passe « effets
//      sobres », 2026-10-26), les trois images sont chargées quand la
//      carte est à l'écran, un point choisit la couleur (fondu de 250 ms)
//      et l'étiquette suit ;
//   5. /secteur : chaque carte a une image, et celle de Laval ne nomme pas
//      Laval ;
//   6. (2026-11-23) le groupe « Saison 2026 » ouvre la page, chaque image de
//      la galerie a un vrai alt, la visionneuse montre la photo entière.
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
// 2026-11-23 : + 5 chantiers résidentiels de la saison 2026 (18 → 23, 11 → 16),
// puis Terrebonne et Sainte-Anne-des-Plaines rejoignent la carte 2026 de LEUR
// maison (une maison = une carte) : 23 → 21, 16 → 14.
// 2026-11-24 : + 8 chantiers de la saison (3 commerces du Vieux-Montréal, 5 maisons).
const attendus = { Tout: 29, "Résidentiel": 19, Commercial: 4, Arbres: 3, Permanent: 3 };
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
for (const [id, n] of [["chocolaterie", 2], ["saint-donat", 3], ["toutes-les-ambiances", 3],
  ["s26-trois-pignons", 3], ["s26-ferme-moderne", 9], ["s26-contemporaine", 2], ["s26-balcon", 8],
  ["lery", 7], ["vm-kyo", 5], ["vm-modavie", 6], ["vm-hotel-place-d-armes", 4]]) {
  const k = await page.locator(`[data-chantier="${id}"] img`).count();
  t(`« ${id} » réunit ${n} photos`, k === n, `${k}`);
}

console.log("\n--- 1b. Par ville / site (2026-11-24), et un alt sur chaque photo ---");
{
  const groupes = await page.evaluate(() => [...document.querySelectorAll(".galerie__groupe")].map((g) => ({
    titre: g.querySelector(".galerie__titre")?.childNodes[0]?.textContent?.trim() || null,
    ids: [...g.querySelectorAll("[data-chantier]")].map((c) => c.dataset.chantier),
  })));
  const titres = groupes.map((g) => g.titre);
  t("🚨 le premier groupe est « Vieux-Montréal », avec ses trois commerces", titres[0] === "Vieux-Montréal" && groupes[0].ids.join() === "vm-kyo,vm-modavie,vm-hotel-place-d-armes", `${titres[0]} — ${groupes[0]?.ids.join()}`);
  t("🚨 les villes tournées cette saison ont chacune leur groupe",
    ["Blainville", "Terrebonne", "Lorraine", "Sainte-Anne-des-Plaines", "Saint-Valentin", "Beaconsfield", "Léry"].every((v) => titres.includes(v)), titres.join(" | "));
  t("…les maisons 2026 sans lieu, puis les réalisations précédentes, en dernier",
    titres.at(-2) === "Saison 2026 — autres propriétés" && titres.at(-1) === "Réalisations précédentes", titres.slice(-2).join(" | "));
  const maisons = await page.evaluate(() => ({
    balcon: [...document.querySelectorAll('[data-chantier="s26-balcon"] img')].map((i) => decodeURIComponent(i.currentSrc || i.src)),
    ferme: [...document.querySelectorAll('[data-chantier="s26-ferme-moderne"] img')].map((i) => decodeURIComponent(i.currentSrc || i.src)),
    anciennes: document.querySelectorAll('[data-chantier="terrebonne"], [data-chantier="sainte-anne"]').length,
  }));
  t("🚨 Terrebonne : la photo de l'an dernier est dans la carte du balcon", maisons.balcon.some((u) => /noel-terrebonne/.test(u)) && /09-pierre-balcon/.test(maisons.balcon[0]), maisons.balcon.map((u) => u.slice(-48)).join(" | "));
  t("🚨 Sainte-Anne-des-Plaines : la photo de l'an dernier est dans la carte de la ferme moderne", maisons.ferme.some((u) => /noel-ste-anne/.test(u)) && /05-ferme-moderne/.test(maisons.ferme[0]), maisons.ferme.map((u) => u.slice(-48)).join(" | "));
  t("…et leurs anciennes cartes ont disparu (une maison = une carte)", maisons.anciennes === 0, `${maisons.anciennes}`);
  // Chaque <img> de la galerie décrit l'installation : ni vide, ni générique.
  const alts = await page.evaluate(() => [...document.querySelectorAll(".galerie img")].map((i) => i.getAttribute("alt") || ""));
  const vides = alts.filter((a) => a.length < 25);
  t("🚨 chaque photo de la galerie a un vrai alt", alts.length === 100 && vides.length === 0, `${alts.length} images, ${vides.length} sans alt`);
  t("…aucun alt « illuminée pour les Fêtes » sans dire ce qui est posé", alts.every((a) => !/illuminée? pour les Fêtes/.test(a)), alts.filter((a) => /illuminée? pour les Fêtes/.test(a)).join(" | "));
  t("…et aucun alt en double", new Set(alts).size === alts.length, `${alts.length - new Set(alts).size} doublon(s)`);
  // Un filtre sans chantier de la saison : aucun titre, la grille d'avant.
  await page.locator(".filtre", { hasText: "Permanent" }).click();
  await attendre(150);
  t("« Permanent » : aucun titre de groupe", await page.locator(".galerie__titre").count() === 0);
  await page.locator(".filtre", { hasText: "Tout" }).click();
  await attendre(150);
  // La visionneuse montre la photo ENTIÈRE, pas le recadrage de la carte.
  await page.locator('[data-chantier="s26-ferme-moderne"] .chantier__photo').focus();
  await page.keyboard.press("Enter");
  await attendre(400);
  const grande = await page.evaluate(() => { const i = document.querySelector(".visionneuse img"); return i ? decodeURIComponent(i.currentSrc || i.src) : ""; });
  t("🚨 la visionneuse montre l'entière (ni -16x9 ni -4x5)", /05-ferme-moderne-facade\.jpg/.test(grande), grande.slice(-70));
  t("…avec le compte du chantier", /^Photo 1\/9 · Chantier 8 \/ 29/.test(await page.locator(".visionneuse__compte").innerText()), await page.locator(".visionneuse__compte").innerText());
  await page.keyboard.press("Escape");
  await attendre(200);
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
  await attendre(1200);
  const chargees = await page.evaluate((s) => [...document.querySelectorAll(`${s} img`)].map((i) => i.complete && i.naturalWidth > 0), sel);
  const e0 = await etat();
  t("les trois images sont là quand la carte est à l'écran", chargees.length === 3 && chargees.every(Boolean), chargees.join(" / "));
  const transition = await page.evaluate((s) => getComputedStyle(document.querySelector(`${s} .ambiances__img`)).transitionDuration, sel);
  t("le fondu dure 250 ms", transition === "0.25s", transition);
  await attendre(3600);
  t("🚨 la couleur ne change PAS toute seule", (await etat()) === e0, `${e0} → ${await etat()}`);
  const points = page.locator(`${sel} .ambiances__point`);
  await points.nth(1).click();
  await attendre(900);
  t("🚨 un point choisit la couleur", (await etat()) === "1" && (await points.nth(1).getAttribute("aria-pressed")) === "true");
  t("l'étiquette dit la couleur vue", (await etiquette()) === "Bleu, blanc, rouge", await etiquette());
  t("🚨 rien ne tourne seul", (await page.locator(`${sel} .ambiances`).getAttribute("data-auto")) === "0");
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
  // Sept depuis la page du Vieux-Montréal (2026-11-12) : les six zones de
  // `cities`, plus la carte des commerces. La garde en attendait encore six.
  // 2026-11-24 : 19 zones (13 villes ajoutées) + la carte du Vieux-Montréal.
  t("vingt cartes : dix-neuf zones + les commerces du Vieux-Montréal", cartes.length === 20 && cartes.filter((c) => /Vieux-Montréal/.test(c.nom)).length === 1, `${cartes.length}`);
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
