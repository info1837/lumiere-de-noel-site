// =============================================================================
// Prépare les photos « Saison 2026 » — public/images/reel/2026/
// =============================================================================
//   node scripts/preparer-photos-2026.mjs <dossier des originaux> [--apercu <dossier>]
//   (npm run images:2026 -- ~/Downloads/lumiere-header/photos/nouvelles)
//   lot 2 : npm run images:2026 -- ~/Downloads/lumiere-header/photos/nouvelles-2 --lot 2
//
// Les originaux (JPEG de l'appareil, 2 576 px) ne sont PAS dans le dépôt.
// Ce script est la trace exacte de ce qu'on leur a fait, et rien d'autre :
//
//   · AUCUNE génération, aucune retouche du sujet : on ne déplace, n'ajoute
//     ni ne retire une seule lumière. Ce sont de vraies photos de chantier.
//   · numéros civiques FLOUTÉS (flou gaussien local, bord fondu) : « 47 » sur
//     02, 03 et 04, « 1050 » sur 09 — plus deux numéros qu'on ne voit qu'à
//     la loupe : celui d'un poteau au bord droit de 05, et celui d'un
//     bâtiment voisin derrière le sapin de 09 ;
//   · RECADRAGES : 02 sans le bac à ordures (bord droit — il portait le nom
//     de la ville), notre pancarte de pelouse gardée ; 05 sans la voiture du
//     premier plan (tout ce qui est sous son toit part : aucun rectangle ne
//     garde le bas de la galerie sans elle) ; 06 sans la pelouse noire ;
//   · 07 et 08, sous-exposées : UNE courbe qui relève les ombres et les tons
//     moyens (la pierre), laisse le ciel noir et ne touche pas aux hautes
//     lumières — les ampoules gardent exactement leur valeur. Luminance
//     seulement : ni saturation, ni halo, ni netteté ajoutée ;
//   · EXIF, IPTC, XMP et profil retirés (sharp convertit en sRGB et n'écrit
//     aucune métadonnée) ; côté long ≤ 2 400 px, jamais agrandi ;
//   · trois cadrages par photo — l'entière, un 16:9 (cartes, heros) et un
//     4:5 (téléphone, galeries) — chacun en JPEG, WebP et AVIF.
//
// Les boîtes sont en pixels de l'ORIGINAL : [gauche, haut, largeur, hauteur].
// =============================================================================
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), "..");
const SORTIE = path.join(ROOT, "public/images/reel/2026");
const COTE_MAX = 2400;
// `--vite` : JPEG seulement, pour juger un cadrage sans attendre l'AVIF.
const VITE = process.argv.includes("--vite");

const h169 = (l) => Math.round((l * 9) / 16);
const h45 = (l) => Math.round((l * 5) / 4);

export const PHOTOS_2026 = [
  {
    n: "01", nom: "01-brique-escalier-guirlande",
    entiere: null,
    paysage: [0, 810, 1932, h169(1932)],
    portrait: [0, 30, 1932, h45(1932)],
  },
  {
    n: "02", nom: "02-brique-3-pignons-facade",
    flous: [[1074, 996, 62, 62]],
    entiere: [0, 0, 2328, 1717],
    paysage: [0, 0, 2328, h169(2328)],
    portrait: [300, 0, 1374, 1717],
  },
  {
    n: "03", nom: "03-brique-3-pignons-colonnes",
    flous: [[1280, 1717, 81, 103]],
    entiere: null,
    paysage: [0, 850, 1717, h169(1717)],
    portrait: [0, 60, 1717, h45(1717)],
  },
  {
    n: "04", nom: "04-brique-3-pignons-angle",
    flous: [[750, 1848, 56, 70]],
    entiere: null,
    paysage: [0, 440, 1717, h169(1717)],
    portrait: [0, 330, 1717, h45(1717)],
  },
  {
    n: "05", nom: "05-ferme-moderne-facade",
    flous: [[2520, 1060, 56, 115]],
    entiere: [0, 40, 2576, 1093],
    paysage: [281, 0, 2014, 1133],
    portrait: [1662, 245, 908, h45(908)],
  },
  {
    n: "06", nom: "06-ferme-moderne-galerie",
    entiere: [0, 130, 1717, 1570],
    paysage: [0, 554, 1717, h169(1717)],
    portrait: [258, 130, 1256, 1570],
  },
  {
    n: "07", nom: "07-contemporaine-pierre-facade",
    releve: 1.8,
    entiere: null,
    paysage: [0, 268, 2576, h169(2576)],
    portrait: [1340, 172, 1236, h45(1236)],
  },
  {
    n: "08", nom: "08-contemporaine-pierre-angle",
    releve: 1.8,
    entiere: null,
    paysage: [0, 620, 1717, h169(1717)],
    portrait: [0, 430, 1717, h45(1717)],
  },
  {
    n: "09", nom: "09-pierre-balcon-lanternes",
    flous: [[1012, 1634, 94, 107], [190, 2335, 145, 65]],
    entiere: null,
    paysage: [0, 540, 1717, h169(1717)],
    portrait: [0, 40, 1717, h45(1717)],
  },
];


// ── LOT 2 (2026-11-26) : ~/Downloads/lumiere-header/photos/nouvelles-2 ─────
//   node scripts/preparer-photos-2026.mjs <dossier nouvelles-2> --lot 2
// Originaux iPhone 1 932 × 2 576 ; les passants ont été retirés AVANT nous
// (fichiers « _sans-personnes ») — on n'y retouche rien d'autre.
//   · numéros civiques FLOUTÉS : « 106 » sur la porte du Nelligan (c01, c02),
//     « 55 » sur l'auvent de la Place d'Armes (c03), « 1 SAINT-PAUL OUEST »
//     sur l'auvent du Modavie (c04, quatre boîtes qui suivent la pente du
//     lettrage), « 36 » à côté de la porte de la victorienne (r10) ;
//   · c04 RECADRÉE à droite du panneau orange de chantier et du cône : auvent,
//     couronne et tableau du menu gardés ; l'enseigne ronde du bistro sort du
//     cadre (pas de cadre qui la garde sans le panneau) ;
//   · c05 : le bas (pavés vides) retiré de l'entière.
// Les noms de commerces restent : commerces publics photographiés de la rue.
export const PHOTOS_2026_LOT2 = [
  {
    n: "c01", nom: "c01-nelligan-facade-angle",
    flous: [[955, 1288, 72, 38]],
    entiere: null,
    paysage: [0, 500, 1932, h169(1932)],
    portrait: [0, 100, 1932, h45(1932)],
  },
  {
    n: "c02", nom: "c02-nelligan-facade-face",
    flous: [[965, 1332, 70, 38]],
    entiere: null,
    paysage: [0, 494, 1932, h169(1932)],
    portrait: [0, 100, 1932, h45(1932)],
  },
  {
    n: "c03", nom: "c03-place-darmes-sapins",
    flous: [[952, 592, 78, 62]],
    entiere: null,
    paysage: [0, 760, 1932, h169(1932)],
    portrait: [0, 80, 1932, h45(1932)],
  },
  {
    n: "c04", nom: "c04-modavie-saint-paul",
    flous: [[851, 1108, 92, 69], [936, 1060, 98, 75], [1027, 1014, 98, 75], [1118, 975, 101, 72]],
    entiere: [790, 215, 1142, 1932],
    paysage: [790, 1000, 1142, h169(1142)],
    portrait: [790, 730, 1142, h45(1142)],
  },
  {
    n: "c05", nom: "c05-mama-c-facade",
    entiere: [0, 0, 1932, 2200],
    paysage: [0, 644, 1932, h169(1932)],
    portrait: [532, 300, 1400, h45(1400)],
  },
  {
    n: "c06", nom: "c06-mama-c-jardiniere",
    entiere: null,
    paysage: [0, 815, 1932, h169(1932)],
    portrait: [0, 80, 1932, h45(1932)],
  },
  {
    n: "r10", nom: "r10-victorienne-boucle-rouge",
    flous: [[1020, 1474, 40, 30]],
    entiere: null,
    paysage: [0, 780, 1932, h169(1932)],
    portrait: [0, 161, 1932, h45(1932)],
  },
];

// ── La courbe de 07 et 08 ────────────────────────────────────────────────
// y = x + a · x · (1 − x)^4 · pied(x), sur la LUMINANCE (0..1).
//   · (1 − x)^4 : le gain s'éteint dans les hautes lumières — une ampoule à
//     222/255 sort à 222 ; rien ne peut « brûler » qui ne l'était pas ;
//   · pied(x) : rien sous ~3/255, plein effet à partir de ~15/255 — le ciel
//     reste noir au lieu de virer au gris bruité ;
//   · croissante partout pour a ≤ 2,3 (dérivée minimale 1 − 0,216·a).
// Chaque pixel est multiplié par y/x sur ses trois canaux : la teinte et la
// saturation ne bougent pas.
const lisse = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const courbe = (x, a) => x + a * x * (1 - x) ** 4 * lisse(0.012, 0.06, x);

function relever(data, canaux, a) {
  const gain = new Float32Array(256);
  for (let v = 1; v < 256; v++) gain[v] = courbe(v / 255, a) / (v / 255);
  gain[0] = 1;
  for (let i = 0; i < data.length; i += canaux) {
    const y = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    const g = gain[Math.round(y)];
    if (g === 1) continue;
    // Tramage léger (±0,5 niveau) : étirer des ombres codées sur 8 bits
    // sans lui laisse des paliers dans les dégradés.
    const d = Math.random() - 0.5;
    for (let c = 0; c < 3; c++) data[i + c] = Math.max(0, Math.min(255, Math.round(data[i + c] * g + d)));
  }
}

// ── Le flou d'un numéro civique ──────────────────────────────────────────
// La zone est floutée assez fort pour qu'aucun chiffre ne se relise
// (sigma = le tiers du petit côté, au moins 14 px), puis fondue dans la
// photo sur une marge — pas de rectangle visible.
async function flouter(data, info, [gx, gy, gl, gh]) {
  const sigma = Math.max(14, Math.min(gl, gh) / 3);
  const fondu = Math.round(sigma * 0.9);
  const marge = Math.ceil(sigma * 3) + fondu;
  const x0 = Math.max(0, gx - marge), y0 = Math.max(0, gy - marge);
  const x1 = Math.min(info.width, gx + gl + marge), y1 = Math.min(info.height, gy + gh + marge);
  const l = x1 - x0, h = y1 - y0, c = info.channels;
  const zone = Buffer.alloc(l * h * c);
  for (let y = 0; y < h; y++) data.copy(zone, y * l * c, ((y0 + y) * info.width + x0) * c, ((y0 + y) * info.width + x1) * c);
  const floue = await sharp(zone, { raw: { width: l, height: h, channels: c } }).blur(sigma).raw().toBuffer();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < l; x++) {
      const X = x0 + x, Y = y0 + y;
      // Distance au rectangle (0 dedans), ramenée à un poids 1 → 0 sur `fondu`.
      const dx = Math.max(gx - X, 0, X - (gx + gl - 1)), dy = Math.max(gy - Y, 0, Y - (gy + gh - 1));
      const p = 1 - lisse(0, fondu, Math.hypot(dx, dy));
      if (p <= 0) continue;
      const i = (Y * info.width + X) * c, j = (y * l + x) * c;
      for (let k = 0; k < 3; k++) data[i + k] = Math.round(data[i + k] * (1 - p) + floue[j + k] * p);
    }
  }
}

async function ecrire(base, [x, y, l, h], suffixe, nom, dossier) {
  const cote = Math.max(l, h);
  let img = sharp(base.data, { raw: base.info }).extract({ left: x, top: y, width: l, height: h });
  if (cote > COTE_MAX) img = img.resize(l >= h ? { width: COTE_MAX } : { height: COTE_MAX }); // jamais d'agrandissement
  const tampon = await img.png({ compressionLevel: 1 }).toBuffer();
  const sortie = path.join(dossier, `${nom}${suffixe}`);
  // Aucune métadonnée : sharp n'en écrit que si on le lui demande.
  await sharp(tampon).jpeg({ quality: 84, mozjpeg: true, chromaSubsampling: "4:2:0" }).toFile(`${sortie}.jpg`);
  if (!VITE) {
    await sharp(tampon).webp({ quality: 82, effort: 6 }).toFile(`${sortie}.webp`);
    await sharp(tampon).avif({ quality: 58, effort: 6 }).toFile(`${sortie}.avif`);
  }
  const m = await sharp(`${sortie}.jpg`).metadata();
  return { fichier: `${nom}${suffixe}`, l: m.width, h: m.height, ko: (VITE ? ["jpg"] : ["jpg", "webp", "avif"]).map((e) => Math.round(fs.statSync(`${sortie}.${e}`).size / 1024)) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const source = process.argv[2];
  if (!source || !fs.existsSync(source)) { console.error("usage : node scripts/preparer-photos-2026.mjs <dossier des originaux> [--apercu <dossier>]"); process.exit(1); }
  const iAp = process.argv.indexOf("--apercu");
  const dossier = iAp > 0 ? process.argv[iAp + 1] : SORTIE;
  fs.mkdirSync(dossier, { recursive: true });
  const fichiers = fs.readdirSync(source);
  const iLot = process.argv.indexOf("--lot");
  const liste = iLot > 0 && process.argv[iLot + 1] === "2" ? PHOTOS_2026_LOT2 : PHOTOS_2026;
  for (const p of liste) {
    const f = fichiers.find((x) => x.startsWith(`${p.n}-`) && /\.jpe?g$/i.test(x));
    if (!f) { console.error(`✖ original introuvable pour ${p.nom}`); process.exit(1); }
    // `rotate()` applique l'orientation EXIF ; la sortie brute est en sRGB.
    const base = await sharp(path.join(source, f)).rotate().toColourspace("srgb").removeAlpha().raw().toBuffer({ resolveWithObject: true });
    base.info = { width: base.info.width, height: base.info.height, channels: base.info.channels };
    for (const z of p.flous || []) await flouter(base.data, base.info, z);
    if (p.releve) relever(base.data, base.info.channels, p.releve);
    const entiere = p.entiere || [0, 0, base.info.width, base.info.height];
    for (const [boite, suffixe] of [[entiere, ""], [p.paysage, "-16x9"], [p.portrait, "-4x5"]]) {
      if (!boite) continue;
      const r = await ecrire(base, boite, suffixe, p.nom, dossier);
      console.log(`${r.fichier.padEnd(44)} ${String(r.l).padStart(4)}×${String(r.h).padEnd(4)}  ${["jpg", "webp", "avif"].slice(0, r.ko.length).map((e, i) => `${e} ${r.ko[i]} Ko`).join(" · ")}`);
    }
  }
}
