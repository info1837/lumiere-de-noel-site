// =============================================================================
// Google Ads — la balise, la conversion « Request quote », la provenance.
// =============================================================================
//   BASE_URL=http://127.0.0.1:4191 node --no-warnings scripts/check-google-ads.mjs
//   (contre un serveur lancé : `npx next build && npx next start -p 4191`)
//
// DANS UN VRAI CHROMIUM, AUCUN ENVOI RÉEL :
//   - /api/lead est intercepté dans le navigateur et passe dans la VRAIE
//     route avec `fetch` remplacé : rien n'atteint le CRM ;
//   - gtag.js se charge pour de vrai (c'est lui qu'on vérifie), mais toute
//     requête vers les serveurs publicitaires de Google est ANNULÉE après
//     avoir été comptée : aucune fausse conversion dans le compte Ads.
//
// Ce qu'on prouve :
//   1. la balise AW-18543107650 est présente UNE fois sur chaque page ;
//   2. une soumission réussie tire UNE conversion, avec le bon send_to ;
//   3. une soumission refusée par le CRM, ou invalide, n'en tire AUCUNE ;
//   4. ?gclid=TEST123 survit jusqu'à l'envoi, et le CRM reçoit « Google Ads »
//      sans perdre le préfixe de source qui inscrit Sophie.
// =============================================================================

import path from "path";
import { chromium } from "playwright";

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), "..");
const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
process.env.LUMIERE_INTAKE_KEY = "cle-de-test";
const ID = "AW-18543107650";
const LABEL = "RrdiCIysn60dEMK8hYpF";

let ok = 0, ko = 0;
const t = (nom, cond, d = "") => {
  console.log(`  ${cond ? "✅" : "❌"} ${nom}${d ? ` — ${d}` : ""}`);
  cond ? ok++ : ko++;
};

const { POST: postLead } = await import(path.join(ROOT, "app/api/lead/route.js"));
const versCrm = async (corps) => {
  const vraiFetch = globalThis.fetch;
  const sorties = [];
  globalThis.fetch = async (u, init) => {
    sorties.push({ url: String(u), corps: JSON.parse(String(init?.body || "{}")) });
    return new Response('{"success":true,"id":"fiche_test"}', { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const rep = await postLead(new Request("https://site.test/api/lead", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps),
    }));
    return { statut: rep.status, reponse: await rep.json().catch(() => ({})), sorties };
  } finally { globalThis.fetch = vraiFetch; }
};

const nav = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}
);

// `crm` : "ok" → la vraie route, CRM simulé ; "refus" → 502 comme un CRM qui refuse.
async function nouvellePage(crm = "ok") {
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 } });
  const ads = { conversions: [], autres: [], scripts: 0, erreurs: [] };
  await ctx.route("**/facebook.com/**", (r) => r.abort());
  await ctx.route("**/connect.facebook.net/**", (r) => r.abort());
  await ctx.route(/googletagmanager\.com\/gtag\/js/, (r) => { ads.scripts++; return r.continue(); });
  // Tout le reste chez Google publicité : compté, jamais envoyé.
  await ctx.route(/(googleadservices\.com|doubleclick\.net|google\.[a-z.]+\/(pagead|ccm|rmkt))/, (r) => {
    const u = r.request().url();
    (u.includes(LABEL) ? ads.conversions : ads.autres).push(u);
    return r.abort();
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => ads.erreurs.push(String(e?.message || e)));
  const captures = [];
  await page.route("**/api/lead", async (route) => {
    const corps = JSON.parse(route.request().postData() || "{}");
    if (crm === "refus") {
      captures.push({ corps });
      return route.fulfill({ status: 502, contentType: "application/json", body: '{"ok":false,"error":"crm_rejected"}' });
    }
    const r = await versCrm(corps);
    captures.push({ corps, crm: r });
    await route.fulfill({ status: r.statut, contentType: "application/json", body: JSON.stringify(r.reponse) });
  });
  // L'autocomplétion d'adresse ne doit pas appeler Google Places pendant le test.
  await page.route("**/api/adresse**", (r) => r.fulfill({ contentType: "application/json", body: '{"suggestions":[]}' }));
  return { ctx, page, ads, captures };
}

const hydrate = (page, sel) => page.waitForFunction((s) => {
  const i = document.querySelector(s);
  return !!(i && Object.keys(i).some((k) => k.startsWith("__react")));
}, sel, { timeout: 15000 });

async function remplirEtEnvoyer(page, { valide = true } = {}) {
  await hydrate(page, "#qf-nom");
  await page.fill("#qf-nom", "Test Google Ads");
  await page.fill("#qf-tel", "450 555-0188");
  if (valide) {
    await page.fill("#qf-adresse", "34 Rue de Vaudreuil, Blainville, QC J7C 4A2");
    await page.fill("#qf-mail", "test@exemple.ca");
    await page.locator("#qf-consent").check();
  }
  await page.locator("#qf-nom").evaluate((e) => e.closest("form").requestSubmit());
}

// ── 1. La balise, une fois, partout ──────────────────────────────────────────
console.log("\n--- 1. 🚨 La balise AW-18543107650, UNE fois par page ---");
{
  const xml = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const chemins = [...new Set([
    ...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname),
    "/merci", "/concours", "/calculatrice", "/simulateur", "/renouvellement", "/soumission",
  ])];
  const fautes = [];
  for (const c of chemins) {
    const h = await (await fetch(BASE + c)).text();
    const n = (h.match(/<script[^>]+src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=AW-18543107650"/g) || []).length
      + (h.match(/"src":"https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=AW-18543107650"/g) || []).length;
    const cfg = h.includes(`gtag('config','${ID}')`);
    if (!h.includes(`gtag/js?id=${ID}`) || !cfg) fautes.push(`${c} (balise=${n}, config=${cfg})`);
  }
  t(`balise + config sur les ${chemins.length} pages`, !fautes.length, fautes.slice(0, 5).join(" · "));

  // Dans le navigateur : un seul téléchargement de gtag.js, même après une
  // navigation interne, et aucune erreur de page.
  const { ctx, page, ads } = await nouvellePage();
  await page.goto(BASE + "/", { waitUntil: "load" });
  await page.waitForFunction(() => !!window.google_tag_data, null, { timeout: 15000 }).catch(() => {});
  // Navigation interne (lien Next, sans rechargement) : le lien du menu est
  // caché sur téléphone, d'où le clic en JavaScript.
  await page.evaluate(() => document.querySelector('a[href="/realisations"]')?.click());
  await page.waitForURL(/realisations/, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(800);
  const dom = await page.evaluate(() => document.querySelectorAll('script[src*="gtag/js?id=AW-18543107650"]').length);
  t("🚨 gtag.js téléchargé UNE fois (accueil puis navigation interne)", ads.scripts === 1 && dom === 1, `réseau=${ads.scripts}, DOM=${dom}`);
  t("gtag.js s'est exécuté", await page.evaluate(() => !!window.google_tag_data && typeof window.gtag === "function"));
  t("aucune erreur JavaScript", !ads.erreurs.length, ads.erreurs.join(" | "));
  t("aucune conversion au simple chargement", ads.conversions.length === 0, `${ads.conversions.length}`);
  await ctx.close();
}

// ── 2. Soumission réussie, arrivée par une pub Google ───────────────────────
console.log("\n--- 2. 🚨 ?gclid=TEST123 → /soumission → envoi réussi ---");
{
  const { ctx, page, ads, captures } = await nouvellePage();
  await page.goto(BASE + "/?gclid=TEST123", { waitUntil: "load" });
  await page.waitForFunction(() => !!window.google_tag_data, null, { timeout: 15000 }).catch(() => {});
  // Le visiteur part de l'accueil : la nouvelle page n'a plus de gclid dans l'URL.
  await page.goto(BASE + "/soumission", { waitUntil: "load" });
  await page.waitForFunction(() => !!window.google_tag_data, null, { timeout: 15000 }).catch(() => {});
  await Promise.all([
    page.waitForURL(/\/merci\?/, { timeout: 15000 }).catch(() => {}),
    remplirEtEnvoyer(page),
  ]);
  await page.waitForTimeout(1500);
  const corps = captures[0]?.corps || {};
  const envoye = captures[0]?.crm?.sorties?.[0]?.corps || {};
  const conv = ads.conversions.map((u) => new URL(u));
  t("un seul envoi au CRM", captures.length === 1, `${captures.length}`);
  t("🚨 le gclid voyage du navigateur", corps.google_ads?.gclid === "TEST123", JSON.stringify(corps.google_ads));
  t("🚨 CRM : source suffixée, préfixe Sophie intact", /^Formulaire.* — Google Ads$/.test(envoye.source || ""), envoye.source);
  t("🚨 CRM : formAnswers.lead_source + gclid brut",
    envoye.formAnswers?.lead_source === "Google Ads" && envoye.formAnswers?.gclid === "TEST123", JSON.stringify(envoye.formAnswers));
  t("CRM : ligne de notes", /Source: Google Ads \(gclid: TEST123\)/.test(envoye.notes || ""));
  // Une conversion = un hit par point de collecte de Google (googleadservices
  // et, selon le navigateur, google.com/pagead/1p-conversion). Même
  // transaction_id partout : c'est UNE conversion pour Google.
  const tids = [...new Set(conv.map((u) => u.searchParams.get("oid") || u.searchParams.get("transaction_id") || ""))];
  t("🚨 la conversion part, avec le bon send_to", conv.length >= 1 && conv.every((u) => u.href.includes(LABEL) && u.href.includes("18543107650")),
    conv.map((u) => `${u.host}${u.pathname.split("/").slice(0, 3).join("/")}`).join(", "));
  t("🚨 UNE seule conversion (un seul transaction_id = l'event_id)", tids.length === 1 && tids[0] === corps.meta_pixel?.event_id, tids.join(","));
  const u0 = conv[0];
  t("valeur 1 CAD", u0 && u0.searchParams.get("value") === "1" && u0.searchParams.get("currency_code") === "CAD",
    u0 ? `value=${u0.searchParams.get("value")} currency=${u0.searchParams.get("currency_code")}` : "");
  t("conversions améliorées : courriel/téléphone joints (hachés par gtag)", conv.some((u) => u.searchParams.has("em")),
    u0 ? `em=${u0.searchParams.has("em")} ec_mode=${u0.searchParams.get("ec_mode")}` : "");
  t("arrivée sur /merci", /\/merci\?/.test(page.url()), page.url().slice(BASE.length));
  t("aucune erreur JavaScript", !ads.erreurs.length, ads.erreurs.join(" | "));
  const avant = ads.conversions.length;
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(2000);
  t("🚨 recharger /merci ne compte rien de plus", ads.conversions.length === avant, `${ads.conversions.length - avant} de plus`);
  await ctx.close();
}

// ── 3. Sans pub Google : aucune étiquette ───────────────────────────────────
console.log("\n--- 3. Visiteur sans gclid : rien d'inventé ---");
{
  const { ctx, page, captures } = await nouvellePage();
  await page.goto(BASE + "/soumission", { waitUntil: "load" });
  await Promise.all([page.waitForURL(/\/merci\?/, { timeout: 15000 }).catch(() => {}), remplirEtEnvoyer(page)]);
  const envoye = captures[0]?.crm?.sorties?.[0]?.corps || {};
  t("source inchangée, sans « Google Ads »", !!envoye.source && !/Google Ads/.test(envoye.source), envoye.source);
  t("aucun gclid dans formAnswers", !envoye.formAnswers?.gclid, JSON.stringify(envoye.formAnswers || {}));
  await ctx.close();
}

// ── 4. Refus du CRM, formulaire invalide : AUCUNE conversion ────────────────
console.log("\n--- 4. 🚨 Échecs : aucune conversion ---");
{
  const { ctx, page, ads, captures } = await nouvellePage("refus");
  await page.goto(BASE + "/soumission?gclid=TEST123", { waitUntil: "load" });
  await page.waitForFunction(() => !!window.google_tag_data, null, { timeout: 15000 }).catch(() => {});
  await remplirEtEnvoyer(page);
  await page.waitForTimeout(3500);
  t("le formulaire a bien tenté l'envoi", captures.length === 1, `${captures.length}`);
  t("🚨 CRM refuse → zéro conversion", ads.conversions.length === 0, `${ads.conversions.length}`);
  t("le visiteur reste sur la page", !/\/merci/.test(page.url()));
  await ctx.close();
}
{
  const { ctx, page, ads, captures } = await nouvellePage();
  await page.goto(BASE + "/soumission?gclid=TEST123", { waitUntil: "load" });
  await page.waitForFunction(() => !!window.google_tag_data, null, { timeout: 15000 }).catch(() => {});
  await remplirEtEnvoyer(page, { valide: false });
  await page.waitForTimeout(2500);
  t("formulaire invalide → rien ne part au CRM", captures.length === 0, `${captures.length}`);
  t("🚨 formulaire invalide → zéro conversion", ads.conversions.length === 0, `${ads.conversions.length}`);
  await ctx.close();
}

await nav.close();
console.log(`\n${ok}/${ok + ko} vérifications passées.`);
process.exit(ko ? 1 : 0);
