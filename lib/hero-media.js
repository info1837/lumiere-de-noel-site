// Un hero vidéo a deux formats : PORTRAIT (téléphones, écrans étroits ou
// tenus à la verticale) et PAYSAGE (le reste). Une seule requête média
// décide des deux côtés — l'affiche (<picture>, côté serveur) et la vidéo
// (HeroVideo.jsx, côté client). Si elles ne disaient pas la même chose,
// l'affiche et la vidéo ne seraient pas le même plan, et le passage de
// l'une à l'autre sauterait.
export const MEDIA_PORTRAIT = "(max-width: 768px), (orientation: portrait)";

// Un MONTAGE = deux fichiers montés séparément, un par format. Jamais un
// format recadré dans l'autre : chaque format a ses propres plans, tournés
// dans son orientation.
//
// Chaque format : la vidéo (H.264 sans piste audio, faststart), son
// affiche (une image TIRÉE DU MONTAGE, l'image LCP) et `debut`, l'instant
// du montage d'où l'affiche est tirée — la vidéo démarre là, sur l'image
// même de l'affiche, et le passage ne se voit pas. Nouvelle affiche =
// nouvel instant.
//
// `alt` décrit les deux affiches à la fois (un seul <img> dans <picture>).
export const MONTAGES = {
  // Accueil et pages de secteur (2026-11-11 / 2026-11-12) : plans drone de
  // maisons illuminées. Portrait : Terrebonne, Blainville, Sainte-Anne,
  // Saint-Valentin, Lorraine. Paysage : Beaconsfield et Léry.
  accueil: {
    alt: "Maisons illuminées par nos installateurs, filmées au drone la nuit",
    portrait: { video: "/videos/hero-portrait.mp4", affiche: "/videos/hero-portrait.jpg", debut: 0 },
    paysage: { video: "/videos/hero-paysage.mp4", affiche: "/videos/hero-paysage.jpg", debut: 0 },
  },
  // Page commerciale et /secteur/vieux-montreal (2026-11-12) : décors des
  // Fêtes de commerces du Vieux-Montréal, tournés au niveau de la rue.
  // AUCUN nom de commerce : ni dans les plans (enseignes hors champ ou
  // floutées), ni dans les noms de fichiers.
  vieuxMontreal: {
    alt: "Guirlandes, mini-lumières et jardinières illuminées par notre équipe devant des commerces du Vieux-Montréal, la nuit",
    portrait: { video: "/videos/vieux-montreal-portrait.mp4", affiche: "/videos/vieux-montreal-portrait.jpg", debut: 0 },
    paysage: { video: "/videos/vieux-montreal-paysage.mp4", affiche: "/videos/vieux-montreal-paysage.jpg", debut: 0 },
  },
};

// Le montage du hero d'accueil (Hero.jsx) et, par défaut, de HeroVideo.
export const HERO_MONTAGES = MONTAGES.accueil;
