// Le hero d'accueil a deux montages drone : un PORTRAIT (téléphones, écrans
// étroits ou tenus à la verticale) et un PAYSAGE (le reste). Une seule
// requête média décide des deux côtés — l'affiche (<picture> dans Hero.jsx,
// côté serveur) et la vidéo (HeroVideo.jsx, côté client). Si elles ne
// disaient pas la même chose, l'affiche et la vidéo ne seraient pas le même
// plan, et le passage de l'une à l'autre sauterait.
export const MEDIA_PORTRAIT = "(max-width: 768px), (orientation: portrait)";

// `debut` : l'instant du montage dont l'affiche est tirée (image 25 du
// portrait, image 121 du paysage, à 23,976 i/s — mesuré au PSNR contre
// chaque image). La vidéo démarre là, donc l'affiche devient la vidéo sans
// saut ; la boucle reprend ensuite au début du montage.
export const HERO_MONTAGES = {
  portrait: { video: "/videos/hero-portrait.mp4", affiche: "/videos/hero-portrait.jpg", debut: 1.02 },
  paysage: { video: "/videos/hero-paysage.mp4", affiche: "/videos/hero-paysage.jpg", debut: 5.02 },
};
