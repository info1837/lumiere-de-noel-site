// =============================================================================
// Garde-fou — aucune photo sur plus de 8 pages
// =============================================================================
//   BASE_URL=http://127.0.0.1:4191 node scripts/check-usage-photos.mjs
//   (npm run check:usage ; `--table` imprime tout le tableau, pas seulement
//    les dépassements ; `--json fichier` l'écrit aussi en JSON)
//
// POURQUOI (2026-11-23)
// Trois photos portaient le site : la maison de pierre (noel-residentiel-01)
// était sur 15 pages, la maison du permanent et la chocolaterie sur 15 et 14.
// Un visiteur qui ouvre trois pages voyait trois fois la même façade : on a
// l'air d'avoir fait trois chantiers. La règle, donnée par Yahir : AUCUNE
// photo sur plus de 8 pages.
//
// CE QUI EST COMPTÉ
//   · les pages du sitemap, telles que le serveur les rend (HTML) ;
//   · chaque <img> et chaque <source> d'une page, y compris à travers
//     /_next/image?url=… ;
//   · une photo = un chantier photographié : ses recadrages (-16x9, -4x5) et
//     ses formats (.jpg, .webp, .avif) comptent pour la MÊME photo ;
//   · seulement les photos de chantier (/images/reel/, /images/vieux-montreal/,
//     /realisations/ — saison 2026).
//     Les affiches des vidéos, les simulations « avant » et les logos n'en
//     sont pas. L'image Open Graph d'une page (une balise, pas une image à
//     l'écran) n'est pas comptée non plus.
// =============================================================================
import fs from "node:fs";

const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
export const MAX_PAGES = 8;
const PREFIXES = ["/images/reel/", "/images/vieux-montreal/", "/realisations/"];
const tout = process.argv.includes("--table");
const iJson = process.argv.indexOf("--json");

/** Le chemin d'une image, débarrassé de l'optimiseur de Next. */
const cheminDe = (url) => {
  try {
    const u = new URL(url.replace(/&amp;/g, "&"), BASE);
    const interne = u.pathname === "/_next/image" ? u.searchParams.get("url") : u.pathname;
    return interne ? decodeURIComponent(interne) : null;
  } catch { return null; }
};
/** Recadrages et formats ramenés à la photo d'origine. */
export const photoDe = (chemin) => chemin.replace(/-(16x9|4x5)(?=\.[a-z]+$)/, "").replace(/\.(jpe?g|webp|avif|png)$/i, "");

const xml = await (await fetch(`${BASE}/sitemap.xml`)).text();
const pages = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
if (pages.length < 20) { console.error(`✖ sitemap illisible (${pages.length} pages) sur ${BASE}`); process.exit(1); }

const usage = new Map(); // photo -> Set(pages)
for (const page of pages) {
  const r = await fetch(BASE + page);
  if (r.status !== 200) { console.error(`✖ ${page} → ${r.status}`); process.exit(1); }
  const html = (await r.text()).replace(/<script[\s\S]*?<\/script>/g, "");
  const urls = [];
  for (const m of html.matchAll(/<(?:img|source)\b[^>]*>/g)) {
    for (const a of m[0].matchAll(/\s(?:src|srcset|srcSet)="([^"]*)"/g)) {
      for (const morceau of a[1].split(",")) urls.push(morceau.trim().split(/\s+/)[0]);
    }
  }
  for (const u of urls) {
    const c = u && cheminDe(u);
    if (!c || !PREFIXES.some((p) => c.startsWith(p))) continue;
    const cle = photoDe(c);
    if (!usage.has(cle)) usage.set(cle, new Set());
    usage.get(cle).add(page);
  }
}

const lignes = [...usage].map(([photo, s]) => ({ photo, n: s.size, pages: [...s].sort() }))
  .sort((a, b) => b.n - a.n || a.photo.localeCompare(b.photo));
if (iJson > 0) fs.writeFileSync(process.argv[iJson + 1], JSON.stringify({ base: BASE, pages: pages.length, lignes }, null, 2));

const trop = lignes.filter((l) => l.n > MAX_PAGES);
if (tout) {
  console.log(`\n${pages.length} pages du sitemap, ${lignes.length} photos de chantier.\n`);
  for (const l of lignes) console.log(`${String(l.n).padStart(3)}  ${l.photo.replace(/^\/images\//, "")}`);
}
if (trop.length) {
  console.error(`\n✖ check-usage-photos : ${trop.length} photo(s) sur plus de ${MAX_PAGES} pages\n`);
  for (const l of trop) console.error(`  ${l.photo} — ${l.n} pages\n    ${l.pages.join("  ")}\n`);
  process.exit(1);
}
console.log(`\n✓ check-usage-photos : ${lignes.length} photos sur ${pages.length} pages, aucune sur plus de ${MAX_PAGES} (max ${lignes[0]?.n ?? 0} : ${lignes[0]?.photo.replace(/^\/images\//, "") ?? "—"}).`);
