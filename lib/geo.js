// =============================================================================
// Mesure d'une ligne tracée sur une carte — côté SERVEUR uniquement
// =============================================================================
// Le navigateur calcule aussi la longueur, pour l'afficher pendant que le
// visiteur trace. Cette valeur-là ne sert JAMAIS à un prix : une distance
// venue du client est une distance choisie par le client. Le serveur
// recalcule à partir des points bruts, et c'est ce résultat qui va au moteur.
// =============================================================================

// Rayon terrestre WGS-84, le même que celui de
// google.maps.geometry.spherical.computeLength — les deux mesures
// concordent alors à 0,1 % près, donc un écart réel se voit.
const R_TERRE_M = 6378137;
const M_VERS_PI = 3.28084;

const rad = (d) => (d * Math.PI) / 180;

/** Distance en mètres entre deux points, formule de haversine. */
export function haversineMetres(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const lat1 = rad(a.lat);
  const lat2 = rad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R_TERRE_M * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Un point est-il exploitable ? */
export const pointValide = (p) =>
  !!p && Number.isFinite(p.lat) && Number.isFinite(p.lng)
  && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180;

/**
 * Longueur totale, en pieds linéaires, d'un ensemble de lignes brisées.
 * Chaque ligne est mesurée séparément (façade avant, garage, côtés) puis
 * additionnée. Les lignes de moins de 2 points valides ne comptent pas —
 * elles ne peuvent pas porter de distance.
 */
export function piLineaires(lignes) {
  if (!Array.isArray(lignes)) return 0;
  let metres = 0;
  for (const ligne of lignes) {
    if (!Array.isArray(ligne)) continue;
    const pts = ligne.filter(pointValide);
    for (let i = 1; i < pts.length; i++) metres += haversineMetres(pts[i - 1], pts[i]);
  }
  return Math.round(metres * M_VERS_PI);
}

/** Nombre de lignes réellement mesurables (≥ 2 points valides). */
export const lignesMesurables = (lignes) =>
  (Array.isArray(lignes) ? lignes : [])
    .filter((l) => Array.isArray(l) && l.filter(pointValide).length >= 2).length;
