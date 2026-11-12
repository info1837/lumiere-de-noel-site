// Le numéro en lettres — (438) 812-NOEL (2026-11-11, demande de Yahir).
//
//   node scripts/check-telephone.mjs
//
// Statique (aucun serveur). Vérifie :
//   · les lettres composent bien les chiffres du lien (clavier téléphonique) ;
//   · aucun numéro écrit en dur dans les pages : tout passe par `company` ;
//   · chaque lien tel: porte un aria-label avec les CHIFFRES (un lecteur
//     d'écran doit lire un vrai numéro, pas « N O E L ») ;
//   · le JSON-LD et les balises meta gardent la forme numérique seulement.
import fs from "node:fs";
import path from "node:path";

const RACINE = path.join(path.dirname(new URL(import.meta.url).pathname), "..");
let pass = 0, fail = 0;
const t = (nom, ok, d = "") => { console.log(`  ${ok ? "✅" : "❌"} ${nom}${d ? ` — ${d}` : ""}`); ok ? pass++ : fail++; };
const lire = (f) => fs.readFileSync(path.join(RACINE, f), "utf8");

const data = lire("components/data.js");
const champ = (n) => data.match(new RegExp(`${n}: "([^"]+)"`))?.[1];
const affichage = champ("phoneDisplay"), href = champ("phoneHref"), lettres = champ("phoneVanity"), aria = champ("phoneAria");

console.log("\n--- 1. Les lettres composent le bon numéro ---");
const CLAVIER = { A: 2, B: 2, C: 2, D: 3, E: 3, F: 3, G: 4, H: 4, I: 4, J: 5, K: 5, L: 5, M: 6, N: 6, O: 6, P: 7, Q: 7, R: 7, S: 7, T: 8, U: 8, V: 8, W: 9, X: 9, Y: 9, Z: 9 };
const enChiffres = (s) => (s || "").toUpperCase().replace(/[A-Z]/g, (c) => CLAVIER[c]).replace(/\D/g, "");
t("🚨 phoneVanity = phoneHref sur le clavier", !!lettres && "1" + enChiffres(lettres) === href?.replace(/\D/g, ""), `${lettres} → ${enChiffres(lettres)} / ${href}`);
t("phoneDisplay = phoneHref", "1" + enChiffres(affichage) === href?.replace(/\D/g, ""), `${affichage} / ${href}`);
t("🚨 l'aria-label lit les CHIFFRES", !!aria && aria.includes(affichage) && !/[A-Z]{3,}/.test(aria.replace(/Appeler/i, "")), aria);

console.log("\n--- 2. Les liens tel: ---");
const fichiers = [];
(function marcher(d) {
  for (const e of fs.readdirSync(path.join(RACINE, d), { withFileTypes: true })) {
    if (["node_modules", ".next", ".git", "public", "scripts"].includes(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) marcher(p);
    else if (/\.(jsx|js)$/.test(e.name)) fichiers.push(p);
  }
})(".");
const sansData = fichiers.filter((f) => !f.endsWith(path.join("components", "data.js")));
const enDur = sansData.filter((f) => /812[- ]?6635|812-NOEL|tel:\+?1?438/.test(lire(f)));
t("🚨 aucun numéro écrit en dur (tout vient de company)", enDur.length === 0, enDur.join(", "));
const liensSansAria = [];
for (const f of sansData) {
  const src = lire(f);
  for (const m of src.matchAll(/<a\b[^>]*href=\{company\.phoneHref\}[^>]*>/g)) if (!/aria-label=/.test(m[0])) liensSansAria.push(`${f}: ${m[0].slice(0, 70)}`);
}
t("🚨 chaque lien tel: porte un aria-label", liensSansAria.length === 0, liensSansAria.join(" | "));
const lien = lire("components/LienTelephone.jsx");
t("LienTelephone : href = phoneHref, aria-label = phoneAria par défaut", /href=\{company\.phoneHref\}/.test(lien) && /libelle = company\.phoneAria/.test(lien) && /aria-label=\{libelle\}/.test(lien));
const tiroir = lire("components/TiroirMobile.jsx"), entete = lire("app/ClientLayout.jsx"), form = lire("components/sections.jsx"), pied = lire("app/ServerFooter.jsx");
t("tiroir, entête, formulaire : les lettres", /Appeler \{company\.phoneVanity\}/.test(tiroir) && /phone-label">\{company\.phoneVanity\}/.test(entete) && /parler à quelqu&apos;un \? <a[^>]*>\{company\.phoneVanity\}/.test(form));
t("barre du bas : aria-label avec les chiffres", /aria-label=\{company\.phoneAria\} className="bottom-bar-call"/.test(entete));
t("🚨 pied de page : les lettres PUIS les chiffres", /<LienTelephone[\s\S]{0,200}\{company\.phoneDisplay\}/.test(pied));

console.log("\n--- 3. Moteurs de recherche : les chiffres seulement ---");
for (const f of ["app/layout.jsx", "components/jsonld.jsx"]) {
  const src = lire(f);
  t(`${f} : telephone = chiffres (phoneHref), jamais les lettres`, /telephone: company\.phoneHref/.test(src) && !/phoneVanity/.test(src));
}
const metas = sansData.filter((f) => /export const metadata|generateMetadata/.test(lire(f)) && /phoneVanity/.test(lire(f).split(/export default/)[0]));
t("aucune balise meta avec les lettres", metas.length === 0, metas.join(", "));

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
