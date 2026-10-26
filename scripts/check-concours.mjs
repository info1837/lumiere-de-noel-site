// /concours — la page d'atterrissage du concours, au vrai navigateur.
//
//   npx next build && npx next start -p 4310 &
//   node scripts/check-concours.mjs [http://localhost:4310]   (CAPTURES=docs/concours)
//
// 375 px puis 1440 px. `/api/concours` est INTERCEPTÉ : rien ne part au CRM.
// Vérifie : curseur avant/après au glisser, attributs d'autoremplissage,
// ville hors des 4 → message + lien, déjà inscrit, écran de remerciement
// (Oui / Non), règlement visible, pied de page, aucun défilement horizontal,
// aucun décalage de mise en page (CLS) au chargement.
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
  t("titre H1 exact", (await p.locator("h1").innerText()).toLowerCase().includes("ça pourrait être votre maison, gratuitement cet hiver"));
  t("un seul H1", (await p.locator("h1").count()) === 1);
  t("sous-ligne : 4 villes + tirage", /Blainville · Sainte-Thérèse · Rosemère · Boisbriand — Tirage le 6 novembre/.test(await p.locator(".concours-hero__sous").innerText()));
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
  t("compte à rebours affiché", /Fin des inscriptions dans|5 novembre/i.test(await p.locator(".concours-compte").innerText()));

  // ── Bouton → formulaire ──
  await p.locator(".concours-hero a.concours-bouton").click();
  await p.waitForTimeout(700);
  const haut = await p.locator("#participer").evaluate((s) => s.getBoundingClientRect().top);
  t("« Je participe » amène au formulaire", haut < 200 && haut > -50, `${Math.round(haut)} px`);

  // ── Autoremplissage ──
  const ac = async (sel) => p.locator(sel).getAttribute("autocomplete");
  t("🚨 autocomplete : given-name / family-name / tel / email / street-address / address-level2 / postal-code",
    (await ac("#cc-prenom")) === "given-name" && (await ac("#cc-nom")) === "family-name" && (await ac("#cc-tel")) === "tel"
    && (await ac("#cc-courriel")) === "email" && (await ac("#cc-adresse")) === "street-address"
    && (await ac("#cc-ville")) === "address-level2" && (await ac("#cc-postal")) === "postal-code");
  t("inputmode tel / email", (await p.locator("#cc-tel").getAttribute("inputmode")) === "tel" && (await p.locator("#cc-courriel").getAttribute("inputmode")) === "email");
  const petits = await p.locator(".concours-form input:not([type=checkbox]):not([type=radio]):not(#cc-site), .concours-puce, .concours-choix, .concours-form button[type=submit]")
    .evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().height < 44).length);
  t("cibles tactiles ≥ 44 px", petits === 0, `${petits} trop petite(s)`);
  await p.fill("#cc-tel", "4505550101");
  t("téléphone formaté à la frappe", (await p.inputValue("#cc-tel")) === "(450) 555-0101");

  // ── Validation ──
  await p.locator("button[type=submit]").click();
  t("champs vides → messages, rien envoyé", (await p.locator(".concours-erreur").count()) >= 4 && envois.length === 0);
  await p.fill("#cc-prenom", "Test"); await p.fill("#cc-nom", "Concours"); await p.fill("#cc-courriel", "info@lumieredenoelinc.com");
  await p.fill("#cc-adresse", "rue des Pins, Blainville");
  await p.fill("#cc-ville", "Laval");
  t("🚨 ville hors des 4 → message aimable + lien vers la soumission",
    (await p.locator(".concours-avis").innerText()).includes("Le concours est réservé à Blainville, Sainte-Thérèse, Rosemère et Boisbriand. Vous pouvez quand même demander une soumission")
    && (await p.locator(".concours-avis a").getAttribute("href")) === "/soumission");
  if (CAPTURES) await p.locator(".concours-form").screenshot({ path: `${CAPTURES}/hors-villes-${nom}.png` });
  await p.fill("#cc-ville", "Blainville");
  await p.locator(".concours-puce", { hasText: "Toiture" }).click();
  await p.locator(".concours-puce", { hasText: "Arbres" }).click();
  await p.locator(".concours-choix", { hasText: "Oui" }).click();
  await p.locator(".concours-case input").first().check();
  await p.locator(".concours-case input").nth(1).check();
  await p.locator("button[type=submit]").click();
  t("🚨 adresse sans numéro civique → refusée", envois.length === 0 && /numéro civique/.test(await p.locator(".concours-form").innerText()));
  await p.fill("#cc-adresse", "12 rue des Pins, Blainville, QC J7C 1A1");

  // ── Déjà inscrit ──
  reponse = { ok: true, statut: "deja_inscrit" };
  await p.locator("button[type=submit]").click();
  await p.waitForSelector(".concours-merci");
  t("🚨 déjà inscrit → « Vous êtes déjà inscrit, bonne chance! » (pas une erreur)", (await p.locator(".concours-merci h2").innerText()).toLowerCase() === "vous êtes déjà inscrit, bonne chance!");
  const e0 = envois[0] || {};
  t("envoi : champs, puces, Oui, cases, UTM + fbclid, event_id", e0.prenom === "Test" && e0.ville === "Blainville" && JSON.stringify(e0.illuminer) === '["Toiture","Arbres"]'
    && e0.soumission === "oui" && e0.reglements === true && e0.consentement === true && e0.utm?.utm_campaign === "concours-2026" && e0.utm?.fbclid === "IwAR-test" && !!e0.meta_pixel?.event_id, JSON.stringify(e0).slice(0, 160));

  // ── Inscrit (Oui) ──
  await p.reload({ waitUntil: "networkidle" });
  reponse = { ok: true, statut: "inscrit", soumission: "oui" };
  await p.fill("#cc-prenom", "Test"); await p.fill("#cc-nom", "Concours"); await p.fill("#cc-tel", "4505550101");
  await p.fill("#cc-courriel", "info@lumieredenoelinc.com"); await p.fill("#cc-adresse", "12 rue des Pins, Blainville");
  await p.fill("#cc-ville", "blainville");
  await p.locator(".concours-choix", { hasText: "Oui" }).click();
  await p.locator(".concours-case input").first().check();
  await p.locator("button[type=submit]").click();
  await p.waitForSelector(".concours-merci");
  await p.waitForTimeout(600);
  const merci = await p.locator(".concours-merci").innerText();
  t("🚨 écran : « Vous êtes inscrit au tirage du 6 novembre! »", merci.toLowerCase().includes("vous êtes inscrit au tirage du 6 novembre!"));
  t("rappel 15 % + « réservez maintenant, remboursé si vous gagnez »", /15 % de rabais/i.test(merci) && /si vous gagnez, on vous rembourse jusqu.à 1 000 \$/i.test(merci));
  t("Oui → bouton « Voir mes options et réserver »", (await p.locator(".concours-merci a", { hasText: "Voir mes options et réserver" }).count()) === 1);
  t("lien Instagram pour le tirage en direct", (await p.locator(".concours-merci a[href*='instagram.com']").count()) === 1);
  if (CAPTURES) await p.locator(".concours-merci").screenshot({ path: `${CAPTURES}/merci-${nom}.png` });

  // ── Inscrit (Non) : pas de bouton de réservation ──
  await p.reload({ waitUntil: "networkidle" });
  reponse = { ok: true, statut: "inscrit", soumission: "non" };
  await p.fill("#cc-prenom", "Test"); await p.fill("#cc-nom", "Concours"); await p.fill("#cc-tel", "4505550101");
  await p.fill("#cc-courriel", "info@lumieredenoelinc.com"); await p.fill("#cc-adresse", "12 rue des Pins, Blainville"); await p.fill("#cc-ville", "Blainville");
  await p.locator(".concours-choix", { hasText: "Non" }).click();
  await p.locator(".concours-case input").first().check();
  await p.locator("button[type=submit]").click();
  await p.waitForSelector(".concours-merci");
  t("Non → pas de bouton « Voir mes options »", (await p.locator(".concours-merci a", { hasText: "Voir mes options" }).count()) === 0);

  // ── Règlement + pied de page ──
  const regle = await p.locator("#reglements").innerText();
  t("🚨 règlement complet visible", /Règlements officiels/i.test(regle) && regle.includes("jeudi 5 novembre 2026 à 23 h 59") && regle.includes("vendredi 6 novembre 2026")
    && regle.includes("habileté mathématique") && regle.includes("Aucun achat requis") && regle.includes("jusqu'à 1 000 $") && regle.includes("avant le 6 novembre 2026")
    && regle.includes("Une seule participation par foyer") && regle.includes("20 novembre 2026"));
  t("aucune section RACJ (retirée, comme sur main)", !/RACJ|Régie des alcools/.test(regle));
  const pied = await p.locator("footer").innerText();
  t("pied : « Règlements » + « pas associé à Meta/Facebook/Instagram »", (await p.locator("footer a[href='/concours#reglements']").innerText()).trim() === "Règlements" && pied.includes("Ce concours n'est pas associé à Meta/Facebook/Instagram"));
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
