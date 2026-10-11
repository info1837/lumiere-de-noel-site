// =============================================================================
// Génère components/photos-flou.js — l'aperçu flou de chaque photo du registre
// =============================================================================
//   npm run images:flous
//
// POURQUOI
// Les vignettes de /realisations défilaient en RECTANGLES MARINE VIDES : un
// <img loading="lazy"> sans rien à montrer tant que le fichier n'est pas là.
// next/image sait afficher un aperçu flou (`placeholder="blur"`), mais
// seulement pour un import statique — nos photos sont des chemins texte,
// rangés dans un registre. Il lui faut donc un `blurDataURL` par photo.
//
// Ce script les fabrique une fois : 16 px de large, WebP, en base64 (~200
// octets chacun). Le fichier produit est versionné ; check-photos.mjs casse
// le build si une photo du registre n'a pas le sien. Ajouter une photo =
// relancer ce script.
// =============================================================================
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), "..");
const { PHOTOS } = await import(path.join(ROOT, "components/photos.js"));

const sources = [...new Set(Object.values(PHOTOS).map((p) => p.src))]
  .filter((src) => fs.existsSync(path.join(ROOT, "public", src)))
  .sort();

const lignes = [];
for (const src of sources) {
  const buf = await sharp(path.join(ROOT, "public", src))
    .resize(16)
    .webp({ quality: 40 })
    .toBuffer();
  lignes.push(`  ${JSON.stringify(src)}: "data:image/webp;base64,${buf.toString("base64")}",`);
}

const sortie = `// FICHIER GÉNÉRÉ par scripts/generer-flous.mjs — ne pas éditer à la main.
// Un aperçu flou (16 px, WebP) par photo du registre, pour
// next/image \`placeholder="blur"\`. Voir l'en-tête du script.
export const FLOU = {
${lignes.join("\n")}
};

/** L'aperçu flou d'une photo, ou undefined (next/image affiche alors le fond). */
export const flouDe = (src) => FLOU[src];
`;
fs.writeFileSync(path.join(ROOT, "components/photos-flou.js"), sortie);
console.log(`✓ ${sources.length} aperçus flous écrits dans components/photos-flou.js`);
