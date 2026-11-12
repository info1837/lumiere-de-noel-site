// /concours — la page du concours, au vrai navigateur.
//
//   npx next build && npx next start -p 4310 &
//   node scripts/check-concours.mjs [http://localhost:4310]   (CAPTURES=docs/concours)
//
// ⚠️ LE CONCOURS EST TERMINÉ (inscriptions fermées le 5 nov., tirage fait le
// 6) : la page montre un état « terminé ». Ce test vérifiait le compte à
// rebours et le formulaire ; il vérifie maintenant qu'ils ont disparu et
// que la page dit clairement que c'est fini (2026-11-11).
//
// 375 px puis 1440 px. `/api/concours` est INTERCEPTÉ : rien ne part au CRM
// (et rien ne doit plus y partir). Vérifie : curseur avant/après au glisser,
// état « terminé » (titre, date du tirage, bouton de réservation), ni compte
// à rebours ni formulaire, règlement visible avec la mention Meta, pied de
// page sans lien du concours, aucun défilement horizontal, aucun décalage de
// mise en page (CLS) au chargement.
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.argv[2] || "http://localhost:4310";
const CAPTURES = process.env.CAPTURES || "";
if (CAPTURES) fs.mkdirSync(CAPTURES, { recursive: true });
let ok = 0, ko = 0;
const t = (n, c, d = "") => { console.log(`  ${c ? "✅" : "❌"} ${n}${d ? ` — ${d}` : ""}`); c ? ok++ : ko++; };

const b = await chromium.launch();
for (const [nom, vp] of [["375", { width: 375, height: 812 }], ["1440", { width: 1440, height: 900 }]]) {
  console.log(`\n── ${nom} px ──`);
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2, hasTouch: nom === "375" });
  const p = await ctx.newPage();
  const envois = [];
  let reponse = { ok: true, statut: "inscrit", soumission: "oui" };
  await p.route("**/api/concours", async (r) => {
    envois.push(JSON.parse(r.request().postData() || "{}"));
    await r.fulfill({ status: reponse.status || 200, contentType: "application/json", body: JSON.stringify(reponse) });
  });
  await p.route("**/api/adresse**", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify({ suggestions: [] }) }));
  await p.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; })
      .observe({ type: "layout-shift", buffered: true });
  });
  await p.goto(`${BASE}/concours?utm_source=facebook&utm_campaign=concours-2026&fbclid=IwAR-test`, { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  if (CAPTURES) await p.screenshot({ path: `${CAPTURES}/hero-${nom}.png` });

  // ── Héros ──
  t("🚨 titre H1 : le concours est terminé", (await p.locator("h1").innerText()).toLowerCase().includes("le concours est terminé"));
  t("un seul H1", (await p.locator("h1").count()) === 1);
  t("sous-ligne : tirage fait le 6 novembre", /Tirage fait le vendredi 6 novembre 2026/.test(await p.locator(".concours-hero__sous").innerText()));
  t("photos du héros préchargées (priority)", (await p.locator(".concours-hero img").evaluateAll((im) => im.every((i) => i.getAttribute("fetchpriority") === "high" || i.loading === "eager"))));
  t("images servies en AVIF/WebP par l'optimiseur", (await p.locator(".concours-hero img").first().getAttribute("src")).includes("/_next/image"));
  const pos = () => p.locator(".revel").evaluate((f) => parseFloat(f.style.getPropertyValue("--revel-pos")));
  const avant = await pos();
  const cadre = await p.locator(".revel-cadre").boundingBox();
  await p.mouse.move(cadre.x + cadre.width * 0.5, cadre.y + cadre.height * 0.55);
  await p.mouse.down();
  await p.mouse.move(cadre.x + cadre.width * 0.2, cadre.y + cadre.height * 0.55, { steps: 8 });
  await p.mouse.up();
  const apres = await pos();
  t("🚨 le curseur suit le glisser (même sur le titre)", Math.abs(apres - 20) < 4 && Math.abs(avant - 50) < 1, `${avant}% → ${apres}%`);
  if (nom === "375") {
    await p.touchscreen.tap(cadre.x + cadre.width * 0.8, cadre.y + cadre.height * 0.55);
    t("toucher (doigt) déplace la couture", Math.abs((await pos()) - 80) < 5, `${await pos()}%`);
  }
  t("bouton du héros → réservation", (await p.locator(".concours-hero a.concours-bouton").getAttribute("href")) === "/soumission");

  // ── État « terminé » ──
  t("🚨 plus de compte à rebours", (await p.locator(".concours-compte, [role=timer]").count()) === 0);
  t("🚨 plus de formulaire (ni champ, ni #participer)", (await p.locator("#participer, .concours-form, .concours form, .concours input:not([type=range])").count()) === 0);
  t("plus d'offre de 15 % (expirée le 6 novembre)", !/15 % de rabais/i.test(await p.locator(".concours").innerText()));
  const fin = await p.locator(".concours-termine").innerText();
  t("🚨 bloc « terminé » : fermeture, tirage, merci", /concours 2026 est terminé/i.test(fin) && fin.includes("jeudi 5 novembre 2026") && fin.includes("vendredi 6 novembre 2026") && /merci/i.test(fin));
  t("bloc « terminé » : réserver + réalisations", (await p.locator(".concours-termine a[href='/soumission']").count()) === 1 && (await p.locator(".concours-termine a[href='/realisations']").count()) === 1);
  t("lien Instagram du tirage", (await p.locator(".concours-termine a[href*='instagram.com']").count()) === 1);
  await p.waitForTimeout(300);
  t("🚨 aucun envoi au CRM", envois.length === 0);
  if (CAPTURES) await p.locator(".concours-termine").screenshot({ path: `${CAPTURES}/termine-${nom}.png` });

  // ── Règlement + pied de page ──
  const regle = await p.locator("#reglements").innerText();
  t("🚨 règlement complet visible", /Règlements officiels/i.test(regle) && regle.includes("jeudi 5 novembre 2026 à 23 h 59") && regle.includes("vendredi 6 novembre 2026")
    && regle.includes("habileté mathématique") && regle.includes("Aucun achat requis") && regle.includes("jusqu'à 1 000 $") && regle.includes("avant le 6 novembre 2026")
    && regle.includes("Une seule participation par foyer") && regle.includes("20 novembre 2026"));
  t("aucune section RACJ (retirée, comme sur main)", !/RACJ|Régie des alcools/.test(regle));
  // Le tirage fait (6 nov.), la mention Meta, « Concours 2026 » et
  // « Règlements » ont quitté le pied de page de tout le site (2026-11-11) :
  // la mention reste sur /concours, à la fin du règlement.
  // « Règlements » est aussi parti du pied de page (le règlement reste ici).
  const pied = await p.locator("footer").innerText();
  t("pied : plus aucun lien du concours ni la mention Meta", (await p.locator("footer a[href^='/concours']").count()) === 0
    && !pied.includes("pas associé à Meta") && !/Concours 2026|Règlements/.test(pied));
  t("🚨 la mention Meta reste sur /concours", regle.includes("Ce concours n'est pas associé à Meta/Facebook/Instagram."));
  t("aucun prix au pied linéaire", !/\$\s*\/\s*(pi|pied)|par pied/i.test(await p.locator("main").innerText()));

  // ── Mise en page ──
  const deborde = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  t("🚨 aucun défilement horizontal", deborde <= 0, `${deborde} px`);
  const cls = await p.evaluate(() => window.__cls);
  t("🚨 aucun décalage de mise en page (CLS < 0,1)", cls < 0.1, cls.toFixed(4));
  const couleurs = await p.evaluate(() => {
    const vues = new Set();
    for (const el of document.querySelectorAll(".concours *")) {
      const s = getComputedStyle(el);
      for (const c of [s.color, s.backgroundColor, s.borderTopColor]) vues.add(c);
    }
    return [...vues].filter((c) => { const m = c.match(/\d+/g); if (!m) return false; const [r, g, bb] = m.map(Number); return r > 180 && g < 110 && bb < 150; });
  });
  t("🚨 jamais de rose ni de rouge", couleurs.length === 0, couleurs.join(" "));

  if (CAPTURES) {
    // Page entière : on fait défiler pour déclencher les apparitions.
    await p.reload({ waitUntil: "networkidle" });
    const h = await p.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < h; y += 400) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(120); }
    await p.waitForTimeout(800);
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.screenshot({ path: `${CAPTURES}/page-${nom}.png`, fullPage: true });
  }
  await ctx.close();
}
await b.close();
console.log(`\n${ok} réussis, ${ko} échoués`);
process.exit(ko ? 1 : 0);
