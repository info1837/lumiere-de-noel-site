// =============================================================================
// DRY RUN — CHAQUE formulaire du site, de l'écran jusqu'au CRM. Aucun envoi.
// =============================================================================
//   BASE_URL=http://127.0.0.1:4191 node --import ./scripts/next-alias-register.mjs \
//     scripts/dry-run-formulaires.mjs
//   (lancé par `npm run dry-run:lead`, après scripts/dry-run-lead.mjs)
//
// 🚨 POURQUOI. La partie 3 a refait le formulaire (Nom, Téléphone, Ville +
// Courriel, Service, Détails, case Loi 25) et l'a posé sur 28 pages. Le
// chemin du lead, lui, ne devait PAS bouger : chaque fiche part au CRM avec
// son event_id, le pixel Meta tire Lead avec le MÊME event_id, et le CRM
// prévient Sophie B, le courriel et Telegram à la création de la fiche.
//
// CE QUI EST FAIT, PAGE PAR PAGE, DANS UN VRAI CHROMIUM
//   1. `fbq` est remplacé AVANT le chargement : on lit ce que le pixel reçoit.
//   2. On arrive avec un site référent (facebook.com) : la provenance doit
//      voyager sans qu'on la demande.
//   3. On remplit le VRAI formulaire, on coche la case, on envoie.
//   4. La requête /api/lead est interceptée dans le navigateur : rien ne
//      sort. Son corps passe dans la VRAIE route (app/api/lead/route.js),
//      `fetch` remplacé : on lit ce qui partirait au CRM.
//   5. On vérifie : un seul appel, vers /api/leads, avec la clé ; le même
//      event_id dans le corps, au pixel, dans l'URL de /merci ET au CRM ;
//      la ville, le consentement, la provenance.
// Et les deux refus : sans la case, sans la ville → rien ne part.
//
// Le simulateur et la calculatrice n'ont pas changé dans la partie 3 et ont
// leurs propres routes : leur chemin est prouvé au niveau de la route (§3),
// avec le même contrôle d'event_id. Le simulateur ne se pilote pas à blanc
// jusqu'à son écran de coordonnées (il faut une image rendue par le CRM) ;
// check-photo-cellulaire en couvre le parcours avec un CRM de contrat.
//
// ⚠️ CE QUE ÇA NE PROUVE PAS : le SMS de Sophie B, le courriel et l'alerte
// Telegram sont déclenchés PAR LE CRM à la création de la fiche. Ce dépôt a
// un seul geste à faire juste — poster la fiche entière, au bon endroit,
// avec la clé et l'event_id — et c'est celui-là qui est vérifié.
// =============================================================================
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), "..");
const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
process.env.LUMIERE_INTAKE_KEY = "cle-de-test";

let ok = 0, ko = 0;
const t = (nom, cond, d = "") => {
  console.log(`  ${cond ? "✅" : "❌"} ${nom}${d ? ` — ${d}` : ""}`);
  cond ? ok++ : ko++;
};

// La vraie route, `fetch` remplacé le temps d'un appel.
const { POST: postLead } = await import(path.join(ROOT, "app/api/lead/route.js"));
const versCrm = async (POST, url, corps) => {
  const vraiFetch = globalThis.fetch;
  const sorties = [];
  globalThis.fetch = async (u, init) => {
    sorties.push({ url: String(u), entetes: init?.headers || {}, corps: JSON.parse(String(init?.body || "{}")) });
    return new Response('{"ok":true,"id":"fiche_test","quotable":true,"total":1200,"businessId":"lumiere"}',
      { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const rep = await POST(new Request(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) }));
    return { statut: rep.status, reponse: await rep.json().catch(() => ({})), sorties };
  } finally {
    globalThis.fetch = vraiFetch;
  }
};

const nav = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}
);

async function nouvellePage() {
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 } });
  // ⚠️ Les appels au pixel sont journalisés CÔTÉ NODE. Lus dans la page,
  // ils disparaissaient : le formulaire redirige vers /merci, le script
  // d'init repart à zéro, et selon le minutage le Lead était « absent ».
  const pixel = [];
  await ctx.exposeFunction("__journalPixel", (a) => { pixel.push(JSON.parse(a)); });
  await ctx.addInitScript(() => {
    window.fbq = (...a) => { window.__journalPixel(JSON.stringify(a)); };
  });
  // Rien ne sort vers Meta, même si un pixel était configuré.
  await ctx.route("**/facebook.com/**", (r) => r.abort());
  await ctx.route("**/connect.facebook.net/**", (r) => r.abort());
  const page = await ctx.newPage();
  const captures = [];
  await page.route("**/api/lead", async (route) => {
    const corps = JSON.parse(route.request().postData() || "{}");
    captures.push(corps);
    const r = await versCrm(postLead, "https://site.test/api/lead", corps);
    captures[captures.length - 1].__crm = r;
    await route.fulfill({ status: r.statut, contentType: "application/json", body: JSON.stringify(r.reponse) });
  });
  return { ctx, page, captures, pixel };
}

const hydrate = (page, sel) => page.waitForFunction((s) => {
  const i = document.querySelector(s);
  return !!(i && Object.keys(i).some((k) => k.startsWith("__react")));
}, sel, { timeout: 15000 });

// ── 1. LE formulaire court, sur CHAQUE page qui le porte ────────────────────
const xml = await (await fetch(`${BASE}/sitemap.xml`)).text();
const chemins = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
const avecForm = [];
for (const c of chemins) {
  const h = await (await fetch(BASE + c)).text();
  if (h.includes('id="qf-nom"')) avecForm.push(c);
}
console.log(`\n--- 1. 🚨 Le formulaire court, sur les ${avecForm.length} pages qui le portent ---`);
t("le formulaire est sur l'accueil, /soumission, les services et les villes",
  ["/", "/soumission", "/services/lumieres-de-noel-residentiel", "/secteur/blainville", "/secteur/laval/lumieres-de-noel-commercial"].every((c) => avecForm.includes(c)),
  `${avecForm.length} pages`);

let premier = true;
for (const c of avecForm) {
  const { ctx, page, captures, pixel } = await nouvellePage();
  await page.goto(BASE + c, { waitUntil: "domcontentloaded", referer: "https://www.facebook.com/" });
  await hydrate(page, "#qf-nom");
  const champs = await page.evaluate(() => [...document.querySelectorAll("form[data-barre-masque] [id^='qf-']")]
    .filter((e) => !e.closest("[aria-hidden='true']")).map((e) => e.id).sort());
  const attendus = ["qf-adresse", "qf-consent", "qf-mail", "qf-msg", "qf-nom", "qf-service", "qf-tel"];
  const requis = await page.evaluate(() => [...document.querySelectorAll("form[data-barre-masque] [required]")].map((e) => e.id).sort());
  const fautes = [];
  if (JSON.stringify(champs) !== JSON.stringify(attendus)) fautes.push(`champs ${champs.join(",")}`);
  if (JSON.stringify(requis) !== JSON.stringify(["qf-adresse", "qf-nom", "qf-tel"])) fautes.push(`obligatoires ${requis.join(",")}`);
  if (await page.locator("#qf-consent").isChecked()) fautes.push("case cochée d'avance");
  if (await page.getByText("Comment avez-vous entendu parler", { exact: false }).count()) fautes.push("« comment avez-vous entendu » visible");

  // Les deux refus d'abord.
  await page.fill("#qf-nom", "Marie Tremblay");
  await page.fill("#qf-tel", "450 555-0188");
  await page.locator("#qf-nom").evaluate((e) => e.closest("form").requestSubmit());
  await page.waitForTimeout(300);
  if (captures.length) fautes.push("parti SANS adresse");
  // Une ville seule n'est pas une adresse : refusé aussi.
  await page.fill("#qf-adresse", "Blainville");
  await page.locator("#qf-nom").evaluate((e) => e.closest("form").requestSubmit());
  await page.waitForTimeout(300);
  if (captures.length) fautes.push("parti avec une VILLE pour adresse");
  await page.fill("#qf-adresse", "34 Rue de Vaudreuil, Blainville, QC J7C 4A2");
  await page.locator("#qf-nom").evaluate((e) => e.closest("form").requestSubmit());
  await page.waitForTimeout(300);
  if (captures.length) fautes.push("parti SANS consentement");

  await page.fill("#qf-mail", "marie@exemple.ca");
  await page.fill("#qf-msg", "Toiture et deux arbres");
  await page.locator("#qf-consent").check();
  await Promise.all([
    page.waitForURL(/\/merci\?/, { timeout: 15000 }).catch(() => {}),
    page.locator("#qf-nom").evaluate((e) => e.closest("form").requestSubmit()),
  ]);
  const url = page.url();
  const fbq = pixel;
  const corps = captures[0] || {};
  const crm = corps.__crm || { sorties: [] };
  const envoye = crm.sorties[0]?.corps || {};
  const eid = corps.meta_pixel?.event_id;
  const lead = fbq.find((a) => a[0] === "track" && a[1] === "Lead");

  if (captures.length !== 1) fautes.push(`${captures.length} envoi(s)`);
  if (!eid) fautes.push("pas d'event_id");
  if (!lead || lead[3]?.eventID !== eid) fautes.push(`pixel Lead ${lead ? lead[3]?.eventID : "absent"}`);
  if (!url.includes(`eid=${eid}`)) fautes.push(`/merci sans le même eid (${url.slice(BASE.length)})`);
  if (crm.sorties.length !== 1 || !/\/api\/leads$/.test(crm.sorties[0]?.url || "")) fautes.push("pas UN appel vers /api/leads");
  if (crm.sorties[0]?.entetes?.["x-intake-key"] !== "cle-de-test") fautes.push("clé d'intake absente");
  if (envoye.meta_pixel?.event_id !== eid) fautes.push("event_id perdu avant le CRM");
  if (envoye.city !== "Blainville") fautes.push(`city=${envoye.city}`);
  if (envoye.address !== "34 Rue de Vaudreuil, Blainville, QC J7C 4A2") fautes.push(`address=${envoye.address}`);
  if (envoye.name !== "Marie Tremblay" || !envoye.phone || envoye.email !== "marie@exemple.ca") fautes.push("contact incomplet");
  if (!/Consentement: accordé le \d{4}-\d{2}-\d{2}/.test(envoye.notes || "")) fautes.push("consentement absent des notes");
  if (envoye.formAnswers?.referrer !== "www.facebook.com") fautes.push(`provenance ${JSON.stringify(envoye.formAnswers)}`);
  if (!envoye.formAnswers?.landing) fautes.push("page d'arrivée absente");
  if (/·/.test(corps.source || "")) fautes.push(`source encore suffixée : ${corps.source}`);

  t(`${c}`, fautes.length === 0, fautes.join(" · ") || `eid ${eid.slice(0, 8)}… → pixel, /merci, CRM · source « ${envoye.source} »`);
  if (premier && !fautes.length) {
    premier = false;
    console.log("    ↳ ce qui PART au CRM (première page) :");
    console.log("      " + JSON.stringify({ ...envoye, meta_pixel: { event_id: envoye.meta_pixel?.event_id } }));
  }
  await ctx.close();
}

// Le simulateur renvoie vers /soumission avec l'adresse : elle arrive DANS
// le champ « Adresse de la propriété », et part au CRM avec sa ville.
{
  const { ctx, page, captures } = await nouvellePage();
  await page.goto(`${BASE}/soumission?nom=Jean&tel=4505550101&adresse=${encodeURIComponent("118 rue des Érables, Blainville, QC J7C 3M2")}&style=classique`, { waitUntil: "domcontentloaded" });
  await hydrate(page, "#qf-nom");
  const champ = await page.inputValue("#qf-adresse");
  await page.locator("#qf-consent").check();
  await Promise.all([
    page.waitForURL(/\/merci\?/, { timeout: 15000 }).catch(() => {}),
    page.locator("#qf-nom").evaluate((e) => e.closest("form").requestSubmit()),
  ]);
  const envoye = captures[0]?.__crm?.sorties[0]?.corps || {};
  t("🚨 retour du simulateur : l'adresse est dans le champ", /118 rue des Érables/.test(champ), champ);
  t("🚨 …et part au CRM avec sa ville", /118 rue des Érables/.test(envoye.address || "") && envoye.city === "Blainville", `${envoye.address} / ${envoye.city}`);
  await ctx.close();
}

// 🚨 L'AUTOCOMPLÉTION : une suggestion choisie devient l'adresse COMPLÈTE
// (avec code postal) du détail Places. /api/adresse est simulé ici — aucun
// appel à Google pendant le test.
{
  const { ctx, page, captures } = await nouvellePage();
  await page.route("**/api/adresse?q=*", (r) => r.fulfill({ contentType: "application/json",
    body: JSON.stringify({ ok: true, suggestions: [{ texte: "34 Rue de Vaudreuil, Blainville, QC, Canada", placeId: "ChIJ_test_vaudreuil" }] }) }));
  await page.route("**/api/adresse?placeId=*", (r) => r.fulfill({ contentType: "application/json",
    body: JSON.stringify({ ok: true, adresse: "34 Rue de Vaudreuil, Blainville, QC J7C 4A2", rue: "34 Rue de Vaudreuil", ville: "Blainville", codePostal: "J7C 4A2", province: "QC" }) }));
  await page.goto(`${BASE}/soumission`, { waitUntil: "domcontentloaded" });
  await hydrate(page, "#qf-nom");
  await page.fill("#qf-nom", "Test Adresse");
  await page.fill("#qf-tel", "450 555-0177");
  await page.locator("#qf-adresse").pressSequentially("34 rue de Vaud", { delay: 20 });
  await page.locator(".adresse-liste li").first().waitFor({ timeout: 5000 }).catch(() => {});
  await page.locator(".adresse-liste li").first().dispatchEvent("mousedown").catch(() => {});
  await page.waitForFunction(() => /J7C 4A2/.test(document.querySelector("#qf-adresse")?.value || ""), null, { timeout: 5000 }).catch(() => {});
  const champ = await page.inputValue("#qf-adresse");
  await page.locator("#qf-consent").check();
  await Promise.all([
    page.waitForURL(/\/merci\?/, { timeout: 15000 }).catch(() => {}),
    page.locator("#qf-nom").evaluate((e) => e.closest("form").requestSubmit()),
  ]);
  const envoye = captures[0]?.__crm?.sorties[0]?.corps || {};
  t("🚨 suggestion choisie → adresse complète avec code postal", champ === "34 Rue de Vaudreuil, Blainville, QC J7C 4A2", champ);
  t("🚨 …au CRM : address ET city, les champs du formulaire Meta",
    envoye.address === "34 Rue de Vaudreuil, Blainville, QC J7C 4A2" && envoye.city === "Blainville", `${envoye.address} / ${envoye.city}`);
  await ctx.close();
}

// ── 2. Le renouvellement ────────────────────────────────────────────────────
console.log("\n--- 2. 🚨 /renouvellement : ses champs à lui, et maintenant la case Loi 25 ---");
{
  const { ctx, page, captures, pixel } = await nouvellePage();
  await page.goto(`${BASE}/renouvellement`, { waitUntil: "domcontentloaded", referer: "https://www.google.com/" });
  await hydrate(page, "#rf-nom");
  await page.fill("#rf-nom", "Luc Gagnon");
  await page.fill("#rf-tel", "514 555-0199");
  await page.fill("#rf-mail", "luc@exemple.ca");
  await page.fill("#rf-msg", "Ajouter le cèdre");
  await page.locator("#rf-consent").check();
  await page.locator("#rf-nom").evaluate((e) => e.closest("form").requestSubmit());
  await page.waitForTimeout(300);
  t("🚨 sans l'adresse de l'an passé, rien ne part", captures.length === 0);
  await page.locator("#rf-consent").uncheck();
  await page.fill("#rf-adr", "22 rue du Lac, Laval, QC H7N 1A1");
  t("🚨 la case est décochée au départ", !(await page.locator("#rf-consent").isChecked()));
  await page.locator("#rf-nom").evaluate((e) => e.closest("form").requestSubmit());
  await page.waitForTimeout(300);
  t("🚨 sans la case, rien ne part", captures.length === 0);
  await page.locator("#rf-consent").check();
  await Promise.all([
    page.waitForURL(/\/merci\?/, { timeout: 15000 }).catch(() => {}),
    page.locator("#rf-nom").evaluate((e) => e.closest("form").requestSubmit()),
  ]);
  const corps = captures[0] || {};
  const envoye = corps.__crm?.sorties[0]?.corps || {};
  const fbq = pixel;
  const lead = fbq.find((a) => a[0] === "track" && a[1] === "Lead");
  const eid = corps.meta_pixel?.event_id;
  t("un seul envoi, vers /api/leads, avec la clé", captures.length === 1 && /\/api\/leads$/.test(corps.__crm?.sorties[0]?.url || "")
    && corps.__crm?.sorties[0]?.entetes?.["x-intake-key"] === "cle-de-test");
  t("🚨 le même event_id : corps, pixel, /merci, CRM",
    !!eid && lead?.[3]?.eventID === eid && page.url().includes(`eid=${eid}`) && envoye.meta_pixel?.event_id === eid, eid);
  t("l'adresse de l'an passé et les changements arrivent",
    envoye.address === "22 rue du Lac, Laval, QC H7N 1A1" && envoye.city === "Laval" && /Ajouter le cèdre/.test(envoye.notes || ""), `${envoye.address} / ${envoye.city}`);
  t("🚨 le consentement daté arrive dans les notes", /Consentement: accordé le .* via Formulaire \/renouvellement/.test(envoye.notes || ""));
  t("la provenance voyage", envoye.formAnswers?.referrer === "www.google.com", JSON.stringify(envoye.formAnswers));
  await ctx.close();
}

await nav.close();

// ── 3. Le simulateur et la calculatrice : au niveau de la route ─────────────
console.log("\n--- 3. Le simulateur et la calculatrice (inchangés) : la route ---");
{
  const sim = fs.readFileSync(path.join(ROOT, "app/simulateur/Simulateur.jsx"), "utf8");
  t("🚨 simulateur : UN eventId, au pixel ET dans le corps",
    /const eventId = newLeadEventId\(\);[\s\S]{0,200}sendLeadEtRendreId\(\{[\s\S]{0,120}meta_pixel: metaPixelBlock\(eventId\)/.test(sim)
    && /await trackLead\(eventId\)/.test(sim));
  const r = await versCrm(postLead, "https://site.test/api/lead", {
    subject: "Nouveau lead — Simulateur", source: "Simulateur",
    meta_pixel: { event_id: "evt_sim_dry" },
    consentement: "accordé le 2026-10-11 via le simulateur",
    nom: "Ana", telephone: "4505550123", adresse: "118 rue des Érables, Blainville, QC", ville: "Blainville",
    service: "Lumière de Noël (résidentiel)", message: "Style choisi au simulateur : Classique",
    utm: { landing: "/simulateur", referrer: "www.instagram.com" },
  });
  const e = r.sorties[0]?.corps || {};
  t("🚨 simulateur → CRM : event_id, ville, consentement, provenance",
    r.sorties.length === 1 && e.meta_pixel?.event_id === "evt_sim_dry" && e.city === "Blainville"
    && /Consentement:/.test(e.notes || "") && e.formAnswers?.referrer === "www.instagram.com");

  const calc = fs.readFileSync(path.join(ROOT, "components/CalculatriceToiture.jsx"), "utf8");
  t("🚨 calculatrice : UN eventId, au pixel ET dans le corps",
    /const eventId = newLeadEventId\(\);[\s\S]{0,1500}meta_pixel: metaPixelBlock\(eventId\)/.test(calc) && /trackLead\(eventId\)/.test(calc));
  const { POST: postCalc } = await import(path.join(ROOT, "app/api/calc-noel/route.js"));
  const rc = await versCrm(postCalc, "https://site.test/api/calc-noel", {
    measure_method: "manual", linearFt: 120, address: "5 rue B, Mirabel, QC J7J 1A1", etages: "1",
    contact: { nom: "Paul", telephone: "4505550144", courriel: "p@exemple.ca" },
    consentement: "accordé le 2026-10-11 via Calculatrice toiture",
    meta_pixel: { event_id: "evt_calc_dry" },
  });
  const lead = rc.sorties.find((s) => /\/api\/leads$/.test(s.url))?.corps || {};
  t("🚨 calculatrice → CRM : l'adresse ET la ville", lead.address === "5 rue B, Mirabel, QC J7J 1A1" && lead.city === "Mirabel", `${lead.address} / ${lead.city}`);
  t("🚨 calculatrice → CRM : la fiche part avec l'event_id et le consentement",
    lead.meta_pixel?.event_id === "evt_calc_dry" && /accordé le/.test(lead.consentement || "") && lead.name === "Paul",
    `${rc.sorties.map((s) => s.url.replace(/^https?:\/\/[^/]+/, "")).join(", ")}`);
}

console.log(`\n${ok}/${ok + ko} vérifications passées.`);
process.exit(ko ? 1 : 0);
