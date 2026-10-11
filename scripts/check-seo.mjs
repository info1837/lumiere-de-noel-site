// =============================================================================
// Garde-fou — les balises que Google lit, page par page
// =============================================================================
//   BASE_URL=http://127.0.0.1:4191 node scripts/check-seo.mjs
//
// CE QUE L'AUDIT D'OCTOBRE 2026 A TROUVÉ, ET QUE CE FICHIER REFERME
//   · /simulateur absent du sitemap, et son canonical SANS www alors que
//     tout le site est sur www — deux versions de la même page ;
//   · le 404 déclarait un canonical vers « / » (hérité du layout racine) :
//     chaque URL morte se présentait comme une copie de l'accueil ;
//   · /realisations portait le titre de l'accueil, et un H1 sans rapport ;
//   · quatre descriptions au-delà de 160 caractères, coupées par Google
//     juste avant « un nombre limité de propriétés ».
//
// CE QU'IL AFFIRME
//   1. pour chaque URL du sitemap : 200, description ≤ 155, canonical sur
//      www ET égal à sa propre URL, un seul H1 ;
//   2. aucun titre partagé entre deux pages du sitemap ;
//   3. /simulateur est dans le sitemap ;
//   4. le 404 : statut 404, noindex, AUCUN canonical ;
//   5. /realisations a son propre titre et son propre H1.
// =============================================================================

const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const ORIGINE = "https://www.lumieredenoelinc.com";
const MAX_DESC = 155;

let ok = 0, ko = 0;
const t = (nom, cond, d = "") => {
  console.log(`  ${cond ? "✅" : "❌"} ${nom}${d ? ` — ${d}` : ""}`);
  cond ? ok++ : ko++;
};
const dec = (s) => s?.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
const lire = async (chemin) => {
  const r = await fetch(BASE + chemin, { redirect: "manual" });
  const h = await r.text();
  const g = (re) => dec((h.match(re) || [])[1]);
  return {
    statut: r.status,
    titre: g(/<title>([^<]*)<\/title>/),
    desc: g(/<meta name="description" content="([^"]*)"/),
    canon: g(/<link rel="canonical" href="([^"]*)"/) || null,
    robots: g(/<meta name="robots" content="([^"]*)"/) || "",
    h1s: [...h.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => dec(m[1].replace(/<[^>]+>/g, "").trim())),
  };
};

const xml = await (await fetch(`${BASE}/sitemap.xml`)).text();
const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const chemins = locs.map((u) => new URL(u).pathname);

console.log(`\n--- 1. Chaque URL du sitemap (${chemins.length}) ---`);
t("toutes les URLs du sitemap sont sur www", locs.every((u) => u.startsWith(ORIGINE + "/")),
  locs.filter((u) => !u.startsWith(ORIGINE + "/")).join(", "));
const titres = new Map();
for (const c of chemins) {
  const p = await lire(c);
  const attendu = ORIGINE + (c === "/" ? "" : c);
  const fautes = [];
  if (p.statut !== 200) fautes.push(`statut ${p.statut}`);
  if (!p.desc) fautes.push("pas de description");
  else if (p.desc.length > MAX_DESC) fautes.push(`description ${p.desc.length} c.`);
  if (p.canon !== attendu && p.canon !== attendu + "/") fautes.push(`canonical ${p.canon}`);
  if (p.h1s.length !== 1) fautes.push(`${p.h1s.length} H1`);
  if (/noindex/.test(p.robots)) fautes.push("noindex dans le sitemap");
  t(c, fautes.length === 0, fautes.join(" · ") || `${p.desc.length} c.`);
  if (p.titre) titres.set(p.titre, [...(titres.get(p.titre) || []), c]);
}

console.log("\n--- 2. Aucun titre partagé ---");
const doublons = [...titres].filter(([, cs]) => cs.length > 1);
t("🚨 chaque page du sitemap a son propre titre", doublons.length === 0,
  doublons.map(([ti, cs]) => `« ${ti} » : ${cs.join(", ")}`).join(" | "));

console.log("\n--- 3. /simulateur ---");
t("🚨 /simulateur est dans le sitemap", chemins.includes("/simulateur"));

console.log("\n--- 4. Le 404 ---");
{
  const p = await lire("/cette-page-n-existe-pas-" + Date.now());
  t("statut 404", p.statut === 404, `${p.statut}`);
  t("🚨 noindex", /noindex/.test(p.robots), p.robots || "(aucun)");
  t("🚨 AUCUN canonical", p.canon === null, p.canon || "");
}

console.log("\n--- 5. /realisations n'emprunte plus l'accueil ---");
{
  const [r, a] = [await lire("/realisations"), await lire("/")];
  t("🚨 son titre n'est pas celui de l'accueil", r.titre !== a.titre, r.titre);
  t("son titre dit ce qu'elle montre", /^Réalisations — vraies installations/.test(r.titre || ""), r.titre);
  t("🚨 son H1 non plus", r.h1s[0] !== a.h1s[0] && !/au Québec$/i.test(r.h1s[0] || ""), r.h1s[0]);
}

console.log("\n--- 6. L'éclairage permanent : une seule page ---");
{
  // Deux pages se disputaient le sujet avec le même titre. Fusionnées dans
  // la partie 2 ; l'ancienne URL redirige, et ne revient pas au sitemap.
  const r = await fetch(BASE + "/eclairage-architectural", { redirect: "manual" });
  t("🚨 /eclairage-architectural redirige en 308", r.status === 308, `${r.status}`);
  t("🚨 …vers la page de service", /\/services\/eclairage-architectural-permanent$/.test(r.headers.get("location") || ""),
    r.headers.get("location") || "");
  t("🚨 l'ancienne URL n'est plus au sitemap", !chemins.includes("/eclairage-architectural"));
  const page = await (await fetch(BASE + "/services/eclairage-architectural-permanent")).text();
  t("la démo de l'application y est", /aria-label="Démo de l(&#x27;|')application/.test(page));
  t("le gros plan des pastilles y est", page.includes("perm-led-02"));
  t("la FAQ y est, balisée FAQPage", page.includes('"@type":"FAQPage"'));
}

console.log(`\n${ok}/${ok + ko} vérifications passées.`);
process.exit(ko ? 1 : 0);
