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
//   4. une entrée du registre dont le fichier est absent ;
//   5. LA MÊME PHOTO DE CHANTIER DEUX FOIS SUR L'ACCUEIL (une maison en
//      hero et la même dans la vitrine : on a l'air de n'en avoir qu'une).
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
        PREFIXES_OPTIONNELS, cityPhoto, cityHeroPhoto, servicePhoto } =
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
const optionnelles = [];
for (const [img, ou] of refs) {
  if (existsSync(join(PUBLIC, img))) continue;
  // Préfixes déclarés optionnels : signalés, jamais bloquants (le rendu les
  // masque tant que le fichier n'est pas là). Voir PREFIXES_OPTIONNELS.
  if ((PREFIXES_OPTIONNELS || []).some((p) => img.startsWith(p))) {
    optionnelles.push(`${img}  (optionnelle — ${[...new Set(ou)].join(", ")})`);
    continue;
  }
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

// --- 7. 🚨 Jamais DEUX FOIS la même photo de chantier sur l'accueil ---------
//
// Léry a tenu le hero pleine page ET le côté « après » du comparateur,
// deux sections plus bas. Personne ne l'a vu pendant une PR entière :
// chaque bloc était juste pris isolément, et c'est l'accueil COMPLET qui
// ne l'était pas. Une maison deux fois sur un écran laisse croire qu'on
// n'en a qu'une — sur un site dont tout l'argument est « voilà ce qu'on
// a fait », c'est cher payé.
//
// ⚠️ ON RÉSOUT LES TROIS SOURCES, ON NE DEVINE PAS.
//
// Les photos de l'accueil n'apparaissent pas dans app/page.jsx : le hero
// a la sienne dans son composant, la vitrine vient de données, et le
// comparateur passe par une paire. Chercher « PHOTOS[ » dans page.jsx ne
// trouverait donc rien et la garde se déclarerait verte sur zéro
// résultat — le pire mode de panne. Chaque source est donc résolue
// explicitement, ET son extraction doit aboutir : si quelqu'un
// restructure l'un des trois fichiers, c'est une ERREUR, pas un silence.
{
  const lireSrc = (f) => readFileSync(join(RACINE, f), "utf8");
  const { paireAvantApres } = await import(join(RACINE, "components/photos.js"));

  // ⚠️ On NE PEUT PAS importer components/data.js ici : il importe
  // `@/lib/site-url.js`, et l'alias « @ » n'existe que sous le résolveur
  // de Next. `check-photos` tourne en Node nu, avant `next build` — c'est
  // tout l'intérêt, il casse le build AVANT qu'il commence. On lit donc
  // la vitrine dans le SOURCE, et l'extraction doit aboutir (voir plus
  // bas) plutôt que de rendre une liste vide.
  const data = lireSrc("components/data.js");
  const vitrineSrcs = (() => {
    const mIdx = data.match(/HOME_VITRINE_INDICES = \[([^\]]*)\]/);
    if (!mIdx) return null;
    const indices = mIdx[1].split(",").map((x) => Number(x.trim())).filter((n) => Number.isInteger(n));
    // La galerie de noelPage : celle dont les entrées portent une légende.
    const iNoel = data.indexOf("export const noelPage");
    if (iNoel < 0) return null;
    const iGal = data.indexOf("gallery: [", iNoel);
    if (iGal < 0) return null;
    const bloc = data.slice(iGal, data.indexOf("\n  ],", iGal));
    const cles = [...bloc.matchAll(/\{ image: PHOTOS\["([^"]+)"\]/g)].map((m) => m[1]);
    if (!cles.length || !indices.length) return null;
    return indices.map((i) => ({ cle: cles[i], photo: PHOTOS[cles[i]] }));
  })();

  /** `PHOTOS["cle"]` dans un fichier — la clé, ou null. */
  const clePhotoDe = (src, apres) => {
    const i = src.indexOf(apres);
    const m = (i >= 0 ? src.slice(i) : src).match(/PHOTOS\["([^"]+)"\]/);
    return m ? m[1] : null;
  };

  const usages = []; // { src, ou }

  // a. Le hero.
  const hero = lireSrc("components/Hero.jsx");
  const cleHero = clePhotoDe(hero, "const photo =");
  if (!cleHero || !PHOTOS[cleHero]) {
    erreurs.push(
      `Impossible de lire la photo du hero dans components/Hero.jsx.\n` +
      `    La garde « deux fois la même photo sur l'accueil » ne peut pas faire son travail.\n` +
      `    Si le hero a changé de forme, mettre à jour scripts/check-photos.mjs §7.`);
  } else {
    usages.push({ src: PHOTOS[cleHero].src, ou: "le hero" });
  }

  // b. La vitrine (4 photos, lues dans components/data.js).
  if (!vitrineSrcs || vitrineSrcs.some((v) => !v.photo)) {
    erreurs.push(
      `Impossible de lire la vitrine de l'accueil dans components/data.js ` +
      `(HOME_VITRINE_INDICES + noelPage.gallery).\n` +
      `    §7 ne peut pas vérifier les doublons — mettre à jour scripts/check-photos.mjs.`);
  } else {
    vitrineSrcs.forEach((v) => usages.push({ src: v.photo.src, ou: `la vitrine (${v.cle})` }));
  }

  // c. Le comparateur — les DEUX moitiés.
  const page = lireSrc("app/page.jsx");
  const mPaire = page.match(/paireAvantApres\("([^"]+)"\)/);
  if (!mPaire) {
    erreurs.push(`Aucun paireAvantApres() trouvé dans app/page.jsx — §7 ne peut pas vérifier le comparateur.`);
  } else {
    const paire = paireAvantApres(mPaire[1]);
    if (!paire) {
      erreurs.push(`app/page.jsx demande la paire « ${mPaire[1] } », qui n'existe pas.`);
    } else {
      usages.push({ src: paire.apres.src, ou: "le comparateur (après)" });
      usages.push({ src: paire.avant.src, ou: "le comparateur (avant)" });
    }
  }

  // Seules les VRAIES photos comptent : une simulation est par
  // construction la jumelle de son « après », et les deux doivent bien
  // se retrouver côte à côte dans le comparateur.
  const compte = new Map();
  for (const u of usages) {
    if (!u.src || !u.src.startsWith(REEL_PREFIX)) continue;
    if (!compte.has(u.src)) compte.set(u.src, []);
    compte.get(u.src).push(u.ou);
  }
  for (const [src, endroits] of compte) {
    if (endroits.length > 1) {
      erreurs.push(
        `🚨 ${src} apparaît ${endroits.length} fois sur l'accueil : ${endroits.join(" et ")}.\n` +
        `    Une même maison à deux endroits de la page laisse croire qu'on n'en a qu'une.\n` +
        `    Choisir une autre photo pour l'un des deux (components/photos.js les liste).`);
    }
  }

  // La garde doit avoir vu quelque chose : zéro usage = extraction
  // cassée, pas accueil vide.
  if (usages.length < 5) {
    erreurs.push(
      `§7 n'a résolu que ${usages.length} image(s) d'accueil — il en faut au moins 5 ` +
      `(1 hero + 4 vitrine + 2 comparateur). L'extraction est cassée.`);
  }
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
  // ⚠️ Les SIMULATIONS ne sont pas des photos réelles, et ce compteur
  // disait le contraire dès qu'on en a ajouté deux. C'est le genre de
  // ligne qu'on relit en diagonale et qui finit par servir de preuve.
  `✓ check-photos : ${Object.keys(PHOTOS).filter((k) => PHOTOS[k].src.startsWith(REEL_PREFIX)).length} photos réelles, ` +
  `${Object.keys(PHOTOS).filter((k) => PHOTOS[k].simulation).length} simulation(s) avant/après, ` +
  `${refs.size} image(s) littérale(s) vérifiée(s), ${avecPhoto} ville(s) illustrée(s), ` +
  `${sansPhoto} sans photo (générique), ${CLES_GENERIQUES.length} générique(s), ` +
  `${PHOTOS_MANQUANTES.length} photo(s) attendue(s).`);
// Les optionnelles ne bloquent pas, mais elles ne se cachent pas non plus :
// tant qu'elles manquent, la section correspondante ne s'affiche pas.
if (optionnelles.length) {
  console.log(`  ↳ ${optionnelles.length} image(s) optionnelle(s) encore absente(s) — section masquée tant qu'elles manquent :`);
  optionnelles.forEach((o) => console.log(`     · ${o}`));
}
