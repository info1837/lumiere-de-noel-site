// =============================================================================
// Garde-fou — les pages de ville parlent de LEUR ville
// =============================================================================
//   BASE_URL=http://127.0.0.1:4191 node scripts/check-pages-locales.mjs
//
// CE QUE L'AUDIT D'OCTOBRE 2026 A MESURÉ
// Les 6 pages de ville et les 18 pages ville × service partageaient ~43 %
// de leur texte : en 5-grammes de mots, Blainville contre Laval, Blainville
// contre Terrebonne. Seul le nom de la ville changeait dans des gabarits
// (`forCity`, `cityFaq`, `buildFaq`). Les FAQ sonnaient fabriquées :
// « Faites-vous l'installation de lumières de noël — résidentiel à
// Blainville? ».
//
// CE QU'IL AFFIRME
//   1. chaque ville porte ses lignes locales, une ligne par service et ses
//      propres questions (components/data.js) ;
//   2. aucune question ne reprend un gabarit généré ;
//   3. 🚨 rendu par le serveur, le texte de <main> (formulaire exclu) de deux
//      pages de même gabarit partage au plus SEUIL_VILLE / SEUIL_SERVICE de
//      ses 5-grammes (indice de Jaccard). Avant : 41 % et 43-46 %.
// =============================================================================
import path from "node:path";

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), "..");
const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
// Mesuré après la réécriture (partie 2) : 7 % (villes) et 17-18 % (ville ×
// service). La partie 3 a raccourci les pages (le corps de service est
// parti) et ajouté des blocs d'interface communs ; ceux-ci sont marqués
// `data-gabarit` et exclus — voir sansGabarit(). Les seuils ne bougent pas.
const SEUIL_VILLE = 0.2;
const SEUIL_SERVICE = 0.28;

let ok = 0, ko = 0;
const t = (nom, cond, d = "") => {
  console.log(`  ${cond ? "✅" : "❌"} ${nom}${d ? ` — ${d}` : ""}`);
  cond ? ok++ : ko++;
};

// data.js importe `@/lib` : on passe par le registre d'alias du dépôt.
const { cities, services } = await import(path.join(ROOT, "components/data.js"));

console.log("\n--- 1. Chaque ville a son contenu à elle ---");
for (const c of cities) {
  const fautes = [];
  if (!Array.isArray(c.local) || c.local.length < 1 || c.local.length > 2) fautes.push("1-2 lignes locales");
  for (const k of ["residentiel", "commercial", "permanent"]) if (!c.parService?.[k]) fautes.push(`parService.${k}`);
  if (!Array.isArray(c.faq) || c.faq.length < 3) fautes.push("≥ 3 questions");
  t(c.name, fautes.length === 0, fautes.join(" · "));
}
t("chaque service a sa question de service", services.every((s) => s.faqService?.q && s.faqService?.a));

console.log("\n--- 2. 🚨 Des questions de personne, pas de gabarit ---");
{
  const GABARITS = [
    /Faites-vous l'installation de/i,
    /lumières de noël — /i,           // titre de service minusculé et recollé
    /Desservez-vous tout le territoire/i,
  ];
  const fautives = cities.flatMap((c) => (c.faq || []).map((f) => f.q)).filter((q) => GABARITS.some((g) => g.test(q)));
  t("🚨 aucune question générée", fautives.length === 0, fautives.join(" | "));
  const toutes = cities.flatMap((c) => (c.faq || []).map((f) => f.q.replace(c.name, "{ville}")));
  const repetees = toutes.filter((q, i) => toutes.indexOf(q) !== i);
  // « Combien coûte une maison à {ville}? » est demandé tel quel, et c'est
  // la bonne question : on la tolère. Tout le reste doit être propre à la ville.
  const autres = [...new Set(repetees)].filter((q) => !/^Combien coûte une maison (à|sur la) \{ville\}\?$/.test(q));
  t("🚨 hors le prix, aucune question n'est la même d'une ville à l'autre", autres.length === 0, autres.join(" | "));
}

console.log("\n--- 3. 🚨 Ce que le serveur rend : chevauchement en 5-grammes ---");
// Retire chaque élément marqué `data-gabarit` (balise et tout son contenu,
// imbrication comprise) : l'interface répétée à dessein — boutons du hero,
// ligne de preuve, frise du parcours, en-tête de réservation. Les blocs
// RÉDIGÉS restent dans la mesure.
const sansGabarit = (html) => {
  let h = html, m;
  const ouv = /<([a-z]+)\b[^>]*\bdata-gabarit\b[^>]*>/;
  while ((m = ouv.exec(h))) {
    const tag = m[1];
    const re = new RegExp(`<${tag}\\b[^>]*>|</${tag}>`, "g");
    re.lastIndex = m.index + m[0].length;
    let prof = 1, fin = -1, x;
    while ((x = re.exec(h))) {
      prof += x[0][1] === "/" ? -1 : 1;
      if (prof === 0) { fin = x.index + x[0].length; break; }
    }
    if (fin < 0) break;
    h = h.slice(0, m.index) + " " + h.slice(fin);
  }
  return h;
};
const mots = async (p) => {
  const r = await fetch(BASE + p);
  const h = await r.text();
  const m = h.match(/<main[^>]*>([\s\S]*?)<\/main>/);
  return sansGabarit(m ? m[1] : h)
    .replace(/<form[\s\S]*?<\/form>/g, " ")
    .replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ")
    .toLowerCase().replace(/[^\p{L}\p{N}$ ]+/gu, " ").split(/\s+/).filter(Boolean);
};
const cinq = (w) => { const s = new Set(); for (let i = 0; i + 5 <= w.length; i++) s.add(w.slice(i, i + 5).join(" ")); return s; };
const jaccard = (a, b) => { let n = 0; for (const x of a) if (b.has(x)) n++; return n / (a.size + b.size - n); };

let serveur = false;
try { serveur = (await fetch(BASE + "/")).ok; } catch {}
t(`un serveur répond sur ${BASE}`, serveur);
if (serveur) {
  for (const [gabarit, suffixe, seuil] of [
    ["/secteur/{ville}", "", SEUIL_VILLE],
    ...services.map((s) => [`/secteur/{ville}/${s.slug}`, `/${s.slug}`, SEUIL_SERVICE]),
  ]) {
    const S = {};
    for (const c of cities) S[c.slug] = cinq(await mots(`/secteur/${c.slug}${suffixe}`));
    let pire = { j: 0, paire: "" };
    for (let i = 0; i < cities.length; i++) for (let k = i + 1; k < cities.length; k++) {
      const j = jaccard(S[cities[i].slug], S[cities[k].slug]);
      if (j > pire.j) pire = { j, paire: `${cities[i].slug} ~ ${cities[k].slug}` };
    }
    t(`🚨 ${gabarit} : ≤ ${Math.round(seuil * 100)} %`, pire.j <= seuil,
      `pire paire ${pire.paire} : ${Math.round(pire.j * 100)} %`);
  }
}

console.log(`\n${ok}/${ok + ko} vérifications passées.`);
process.exit(ko ? 1 : 0);
