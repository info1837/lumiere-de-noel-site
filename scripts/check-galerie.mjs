// =============================================================================
// Garde-fou — /realisations : filtres, visionneuse, glissement au doigt
// =============================================================================
//   BASE_URL=http://127.0.0.1:4191 node scripts/check-galerie.mjs
//
// À 375 px, au VRAI doigt (Input.dispatchTouchEvent, comme check-avant-apres) :
//   1. chaque pastille filtre la grille, et son nombre est juste ;
//   2. toucher une photo ouvre la visionneuse plein écran (role="dialog") ;
//   3. glisser vers la gauche passe à la suivante, vers la droite revient ;
//   4. ← → au clavier, Échap ferme, et le focus revient à la photo ;
//   5. chaque photo porte une étiquette (sa ville, sinon sa catégorie) ;
//   6. la page ne défile pas derrière la visionneuse.
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
const ctx = await nav.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
const doigt = async (pts) => {
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: pts[0][0], y: pts[0][1] }] });
  for (let k = 1; k <= 12; k++) {
    const x = pts[0][0] + (pts[1][0] - pts[0][0]) * k / 12;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: pts[0][1] }] });
    await attendre(10);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await attendre(250);
};

await page.goto(`${BASE}/realisations`, { waitUntil: "load" });
await page.waitForFunction(() => {
  const b = document.querySelector(".galerie__bouton");
  return !!(b && Object.keys(b).some((k) => k.startsWith("__react")));
});

console.log("\n--- 1. Les filtres ---");
const total = await page.locator(".galerie__item").count();
t("la grille montre toutes les photos", total >= 20, `${total}`);
for (const f of ["Résidentiel", "Commercial", "Arbres", "Permanent"]) {
  const btn = page.locator(".filtre", { hasText: f });
  const annonce = Number((await btn.locator(".filtre__n").innerText()).trim());
  await btn.click();
  await attendre(150);
  const n = await page.locator(".galerie__item").count();
  t(`« ${f} » : ${n} photo(s), comme annoncé`, n === annonce && n > 0 && (await btn.getAttribute("aria-pressed")) === "true");
}
await page.locator(".filtre", { hasText: "Tout" }).click();
await attendre(150);
const etiquettes = await page.locator(".galerie__ville").allInnerTexts();
t("chaque photo porte une étiquette", etiquettes.length === total && etiquettes.every((e) => e.trim().length > 1));

console.log("\n--- 2. La visionneuse, au doigt ---");
const premier = page.locator(".galerie__bouton").first();
await premier.evaluate((e) => e.scrollIntoView({ block: "center", behavior: "instant" }));
await attendre(200);
const b = await premier.boundingBox();
await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }] });
await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await attendre(400);
const dialogue = page.locator('.visionneuse[role="dialog"][aria-modal="true"]');
t("🚨 toucher une photo ouvre la visionneuse", await dialogue.count() === 1);
const compte = () => page.locator(".visionneuse__compte").innerText();
t("elle part de la première", /^1 \//.test(await compte()), await compte());
const vb = await page.locator(".visionneuse__scene").boundingBox();
const y = vb.y + vb.height / 2;
await doigt([[vb.x + vb.width * 0.8, y], [vb.x + vb.width * 0.2, y]]);
t("🚨 glisser vers la gauche → la suivante", /^2 \//.test(await compte()), await compte());
await doigt([[vb.x + vb.width * 0.2, y], [vb.x + vb.width * 0.8, y]]);
t("🚨 glisser vers la droite → retour", /^1 \//.test(await compte()), await compte());
const sy = await page.evaluate(() => getComputedStyle(document.body).overflow);
t("la page ne défile pas derrière", sy === "hidden", sy);
t("le focus est dans la visionneuse", await page.evaluate(() => !!document.activeElement?.closest(".visionneuse")));

console.log("\n--- 3. Au clavier ---");
await page.keyboard.press("ArrowRight");
await attendre(100);
t("→ avance", /^2 \//.test(await compte()), await compte());
await page.keyboard.press("ArrowLeft");
await attendre(100);
t("← recule", /^1 \//.test(await compte()), await compte());
await page.keyboard.press("Escape");
await attendre(200);
t("🚨 Échap ferme", await dialogue.count() === 0);
t("…et le focus revient à la photo", await page.evaluate(() => document.activeElement?.classList.contains("galerie__bouton")));
t("la page défile de nouveau", await page.evaluate(() => getComputedStyle(document.body).overflow !== "hidden"));

await nav.close();
console.log(`\n${ok}/${ok + ko} vérifications passées.`);
process.exit(ko ? 1 : 0);
