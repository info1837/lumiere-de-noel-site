// Le hero d'accueil a deux affiches : PORTRAIT (téléphones, écrans étroits
// ou tenus à la verticale) et PAYSAGE (le reste). Une seule requête média
// décide des deux côtés — l'affiche (<picture> dans Hero.jsx, côté serveur)
// et la vidéo (HeroVideo.jsx, côté client). Si elles ne disaient pas la même
// chose, l'affiche et la vidéo ne seraient pas le même plan, et le passage
// de l'une à l'autre sauterait.
export const MEDIA_PORTRAIT = "(max-width: 768px), (orientation: portrait)";

// Clé PHOTOS de l'affiche paysage, résolue dans Hero.jsx (composant serveur :
// photos.js n'entre pas dans le paquet client de HeroVideo).
// scripts/check-photos.mjs la lit ici pour la compter dans « jamais deux fois
// la même photo sur l'accueil ».
export const AFFICHE_PAYSAGE = "mirabel-01";

// PORTRAIT : montage de 8 plans drone (2026-11-11). L'affiche est l'image 0
// du montage, d'où `debut: 0` : la vidéo démarre sur l'image même de
// l'affiche, le passage ne se voit pas. Nouvelle affiche = nouvel instant.
//
// PAYSAGE : PAS de vidéo (`video: null`). On n'a qu'un seul plan de nuit
// tourné en paysage — pas de quoi monter. La photo de Mirabel (16/9 native)
// reste seule, en attendant des plans paysage du monteur. Ne jamais
// recadrer le montage portrait en 16/9.
export const HERO_MONTAGES = {
  portrait: { video: "/videos/hero-portrait.mp4", affiche: "/videos/hero-portrait.jpg", debut: 0 },
  paysage: { video: null },
};
