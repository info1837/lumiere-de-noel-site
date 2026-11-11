// L'ampoule du logo, en tracés EXACTS (2026-11-11).
//
// Copiés tels quels de public/images/icone-pour-fond-fonce.svg (repère
// 120 × 180) : les deux barres du culot et le verre. Le S ambré n'en fait
// pas partie — dans le cadre « ampoule », c'est la photo qui est dans le
// verre. scripts/check-photos.mjs casse le build si un de ces tracés ne se
// retrouve plus mot pour mot dans le fichier du logo : on ne redessine pas
// le logo.
export const LOGO_SOURCE = "public/images/icone-pour-fond-fonce.svg";
export const LOGO_CREME = "#F5EFE0";
export const CULOT = [
  { d: "M47 12 h26", epaisseur: 7 },
  { d: "M44 26 h32", epaisseur: 7 },
];
export const VERRE = {
  d: "M48 36 C32 48, 26 71, 26 92 C26 129, 41 156, 60 156 C79 156, 94 129, 94 92 C94 71, 88 48, 72 36 Z",
  epaisseur: 6.5,
};
// Centre de rotation : le milieu du repère du logo.
export const CENTRE = [60, 90];

// --- Géométrie de l'ampoule inclinée (sans DOM) ------------------------------
// Échantillonne les tracés (M, h, C, Z suffisent pour le logo) pour connaître
// l'encombrement exact de l'ampoule à n'importe quelle inclinaison : la boîte
// du cadre, la position du culot et du haut/bas de l'ampoule en découlent.
function echantillons(d) {
  const t = d.replace(/,/g, " ").match(/[MCZh]|-?\d*\.?\d+/g);
  let i = 0, x = 0, y = 0, x0 = 0, y0 = 0;
  const pts = [];
  while (i < t.length) {
    const c = t[i++];
    if (c === "M") { x = x0 = +t[i++]; y = y0 = +t[i++]; pts.push([x, y]); }
    else if (c === "h") { const dx = +t[i++]; for (let k = 1; k <= 20; k++) pts.push([x + (dx * k) / 20, y]); x += dx; }
    else if (c === "C") {
      while (i < t.length && !/[A-Za-z]/.test(t[i])) {
        const [a, b, c2, d2, e, f] = t.slice(i, i + 6).map(Number); i += 6;
        for (let k = 1; k <= 60; k++) {
          const s = k / 60, m = 1 - s;
          pts.push([m*m*m*x + 3*m*m*s*a + 3*m*s*s*c2 + s*s*s*e, m*m*m*y + 3*m*m*s*b + 3*m*s*s*d2 + s*s*s*f]);
        }
        x = e; y = f;
      }
    } else if (c === "Z") { pts.push([x0, y0]); x = x0; y = y0; }
  }
  return pts;
}
const tourner = (deg) => ([x, y]) => {
  const r = (deg * Math.PI) / 180, [cx, cy] = CENTRE;
  return [cx + (x - cx) * Math.cos(r) - (y - cy) * Math.sin(r), cy + (x - cx) * Math.sin(r) + (y - cy) * Math.cos(r)];
};
const boite = (pts, marge) => ({
  x0: Math.min(...pts.map((p) => p[0])) - marge, x1: Math.max(...pts.map((p) => p[0])) + marge,
  y0: Math.min(...pts.map((p) => p[1])) - marge, y1: Math.max(...pts.map((p) => p[1])) + marge,
});

// Repères FIXÉS à la main quand une mise en page approuvée en dépend :
// 17° = le desktop approuvé par Yahir le 2026-11-11 — ne pas le recalculer.
const REPERES_FIGES = { 17: { x: 8, y: -2, w: 102, h: 169 } };

/** Encombrement de l'ampoule inclinée de `deg` degrés (repère du logo). */
export function geometrieAmpoule(deg) {
  const verre = boite(echantillons(VERRE.d).map(tourner(deg)), VERRE.epaisseur / 2);
  const culot = boite(CULOT.flatMap((c) => echantillons(c.d)).map(tourner(deg)), CULOT[0].epaisseur / 2);
  const tout = { x0: Math.min(verre.x0, culot.x0), x1: Math.max(verre.x1, culot.x1), y0: Math.min(verre.y0, culot.y0), y1: Math.max(verre.y1, culot.y1) };
  // ~10 unités de marge autour, pour la lueur.
  const vb = REPERES_FIGES[deg] || {
    x: Math.floor(tout.x0 - 10), y: Math.floor(tout.y0 - 10),
    w: Math.ceil(tout.x1 + 10) - Math.floor(tout.x0 - 10), h: Math.ceil(tout.y1 + 10) - Math.floor(tout.y0 - 10),
  };
  return { vb, tout, culot, verre };
}
