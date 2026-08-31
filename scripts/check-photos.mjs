// =============================================================================
// Garde de compilation — images
// =============================================================================
// Casse le build plutôt que de laisser passer, silencieusement :
//
//   1. une image référencée par le code qui n'existe PAS sur le disque
//      (en 2026-08, 20 des 24 références pointaient dans le vide) ;
//   2. une image NON réelle qui nomme une ville dans son alt ou sa légende
//      (une image générée n'est pas un chantier — voir components/photos.js) ;
//   3. deux villes qui partagent la même photo (une maison, trois villes) ;
//   4. une entrée du registre dont le fichier est absent.
//
// Une règle écrite dans un commentaire se perd. Une règle qui casse le build
// se transmet.
// =============================================================================

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(RACINE, "public");
const erreurs = [];

const { PHOTOS, CITY_PHOTO, REEL_PREFIX, PHOTOS_MANQUANTES, CLES_GENERIQUES,
        cityPhoto, cityHeroPhoto, servicePhoto } =
  await import(join(RACINE, "components/photos.js"));

// Les services dont une carte porte une image. Le municipal n'en a pas.
const SERVICES = [
  "lumieres-de-noel-residentiel",
  "lumieres-de-noel-commercial",
  "eclairage-architectural-permanent",
];

// Villes que le site nomme. Sert au contrôle « pas de ville sur une image
// non réelle ». En ajouter une ici est gratuit ; en oublier une ne l'est pas.
const VILLES = [
  "Blainville", "Terrebonne", "Saint-Jérôme", "St-Jérôme", "Laval", "Montréal",
  "Brossard", "Mirabel", "Sainte-Julienne", "Ste-Julienne", "Sainte-Anne",
  "Ste-Anne", "Saint-Donat", "St-Donat", "Stratford", "Léry", "Mercier",
  "Magog", "Granby", "Sherbrooke", "Longueuil", "Boucherville", "Repentigny",
  "Mascouche", "Bois-des-Filion", "Rosemère", "Lorraine", "Boisbriand",
  "Sainte-Thérèse", "Rive-Sud", "Rive-Nord",
];
const nommeUneVille = (txt) =>
  VILLES.filter((v) => txt && txt.includes(v));

// --- 1. Toute image référencée par le code existe -----------------------------
const fichiersSource = [];
(function marcher(dir) {
  for (const e of readdirSync(dir)) {
    // `scripts/` est de l'outillage, pas des pages rendues. L'audit visuel y
    // référence volontairement une image inexistante pour prouver que son
    // contrôle « image cassée » sait échouer — ce n'est pas un défaut du site.
    if (["node_modules", ".next", ".git", "public", "scripts"].includes(e)) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) marcher(p);
    else if (/\.(jsx?|mjs)$/.test(e)) fichiersSource.push(p);
  }
})(RACINE);

const refs = new Map(); // chemin image -> [fichiers qui la référencent]
for (const f of fichiersSource) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(/["'`](\/images\/[^"'`\s)]+\.(?:jpe?g|png|svg|webp))["'`]/g)) {
    if (!refs.has(m[1])) refs.set(m[1], []);
    refs.get(m[1]).push(f.replace(RACINE + "/", ""));
  }
}
for (const [img, ou] of refs) {
  if (!existsSync(join(PUBLIC, img)))
    erreurs.push(`Image RÉFÉRENCÉE mais ABSENTE du disque : ${img}\n    → ${[...new Set(ou)].join(", ")}`);
}

// --- 2. Le registre pointe sur des fichiers qui existent ----------------------
for (const [cle, p] of Object.entries(PHOTOS)) {
  if (!existsSync(join(PUBLIC, p.src)))
    erreurs.push(`PHOTOS["${cle}"] pointe sur un fichier absent : ${p.src}`);
}

// --- 3. Seule une photo réelle peut nommer une ville -------------------------
for (const [cle, p] of Object.entries(PHOTOS)) {
  const reelle = p.src.startsWith(REEL_PREFIX);
  if (reelle) continue;
  if (p.ville)
    erreurs.push(`PHOTOS["${cle}"] n'est pas sous ${REEL_PREFIX} et porte pourtant ville="${p.ville}".`);
  const trouvees = nommeUneVille(p.alt);
  if (trouvees.length)
    erreurs.push(
      `PHOTOS["${cle}"] n'est pas une vraie photo (${p.src}) mais son alt nomme ${trouvees.join(", ")}.\n` +
      `    Une image générée ne peut pas être présentée comme un chantier réel.\n` +
      `    → alt actuel : "${p.alt}"`);
}

// --- 4. Une photo par ville, jamais partagée ---------------------------------
const prises = new Map();
for (const [slug, cle] of Object.entries(CITY_PHOTO)) {
  if (!cle) continue;
  if (!PHOTOS[cle]) { erreurs.push(`CITY_PHOTO["${slug}"] → clé inconnue "${cle}".`); continue; }
  if (prises.has(cle))
    erreurs.push(`La photo "${cle}" sert à la fois à "${prises.get(cle)}" et à "${slug}".\n` +
                 `    Une maison ne peut pas illustrer deux villes.`);
  else prises.set(cle, slug);
}

// --- 5. Une page de ville ne montre jamais la photo d'une AUTRE ville -------
// C'est le contrôle qui manquait : les cartes de service choisissaient leur
// image par type de service et court-circuitaient le mappage par ville.
// /secteur/laval affichait la maison de Terrebonne, légendée « à Terrebonne ».
for (const slug of Object.keys(CITY_PHOTO)) {
  const sienne = cityPhoto(slug);
  const verifier = (p, ou) => {
    if (!p || !p.ville) return;                 // générique : autorisé partout
    if (sienne && p.src === sienne.src) return; // sa propre photo : autorisé
    erreurs.push(
      `${ou} pour « ${slug} » utilise une photo SITUÉE à ${p.ville}.\n` +
      `    ${p.src}\n` +
      `    alt : "${p.alt}"\n` +
      `    Une page de ville montre sa photo ou une générique — jamais celle d'une autre ville.`);
  };
  verifier(cityHeroPhoto(slug), "L'en-tête");
  for (const sv of SERVICES) verifier(servicePhoto(sv, slug), `La carte « ${sv} »`);
}

// --- 6. Une photo générique ne revendique aucun lieu ------------------------
for (const cle of CLES_GENERIQUES) {
  const p = PHOTOS[cle];
  if (p.ville)
    erreurs.push(`PHOTOS["${cle}"] est déclarée générique mais porte ville="${p.ville}".`);
  const t = nommeUneVille(p.alt);
  if (t.length)
    erreurs.push(
      `PHOTOS["${cle}"] est générique — elle peut apparaître sur n'importe quelle\n` +
      `    page de ville — mais son alt nomme ${t.join(", ")}.\n    → "${p.alt}"`);
}

// --- Verdict -----------------------------------------------------------------
if (erreurs.length) {
  console.error(`\n✖ check-photos : ${erreurs.length} problème(s)\n`);
  erreurs.forEach((e, i) => console.error(`  ${i + 1}. ${e}\n`));
  process.exit(1);
}
const avecPhoto = Object.values(CITY_PHOTO).filter(Boolean).length;
const sansPhoto = Object.values(CITY_PHOTO).length - avecPhoto;
console.log(
  `✓ check-photos : ${Object.keys(PHOTOS).length} photos réelles, ` +
  `${refs.size} image(s) littérale(s) vérifiée(s), ${avecPhoto} ville(s) illustrée(s), ` +
  `${sansPhoto} sans photo (générique), ${CLES_GENERIQUES.length} générique(s), ` +
  `${PHOTOS_MANQUANTES.length} photo(s) attendue(s).`);
