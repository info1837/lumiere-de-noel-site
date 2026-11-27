// =============================================================================
// /secteur/vieux-montreal — la galerie (2026-11-12)
// =============================================================================
// Images fixes tirées des tournages de nuit dans le Vieux-Montréal, avec le
// même étalonnage que la vidéo du hero (S-Log3 → Rec.709, puis la courbe
// commune des montages). Une entrée = une image ; la page les affiche dans
// cet ordre.
//
// Cette galerie-ci reste ANONYME (« Ailleurs dans le Vieux-Montréal »). Les
// études de cas NOMMÉES (Kyo, Modavie, Hôtel Place d'Armes) vivent dans
// components/medias-2026.js → CAS_VIEUX_MONTREAL (permis le 2026-11-24).
//
// 2026-11-26 (lot 2) : les six VRAIES photos des commerces (Hôtel Nelligan,
// Hôtel Place d'Armes, Modavie, Mama C) ouvrent la galerie, chacune avec une
// LÉGENDE qui nomme le commerce (permis sur cette page depuis le 2026-11-24) ;
// le 16:9 de public/images/reel/2026/ (la carte est en 4:3). Numéros civiques
// floutés. Les six images tirées des vidéos, plus bas, restent anonymes :
//
// ⚠️ AUCUN NOM DE CLIENT sur les images tirées des vidéos (vieux-montreal-NN). Ni dans `alt`, ni dans le nom du
// fichier (vieux-montreal-NN.jpg, numéroté), ni dans une légende. Une image
// où une enseigne est le sujet, ou dont le nom est lisible à l'écran, n'entre
// pas. Les clients se décrivent comme « hôtels, restaurants et boutiques du
// Vieux-Montréal », sans les compter.
//
// AJOUTER UN CHANTIER : voir CLAUDE.md, « Page Vieux-Montréal ». En bref :
// image 4:3 (1600×1200, le format des cartes de `Gallery`, components/ui.jsx) dans public/images/vieux-montreal/, numéro suivant,
// une entrée ici avec un `alt` qui décrit l'installation (pas le commerce).
// =============================================================================


export const GALERIE_VIEUX_MONTREAL = [
  { image: "/images/reel/2026/c02-nelligan-facade-face-16x9.jpg", caption: "Hôtel Nelligan", alt: "Hôtel Nelligan, Vieux-Montréal : entrée encadrée de guirlandes de verdure et de mini-lumières blanc chaud, guirlande de boules sous la marquise, jardinières illuminées aux fenêtres" },
  { image: "/images/reel/2026/c01-nelligan-facade-angle-16x9.jpg", caption: "Hôtel Nelligan", alt: "Hôtel Nelligan vu de biais : colonnes de verdure enrubannées de mini-lumières de chaque côté de la porte et jardinières de conifères illuminées à l'étage" },
  { image: "/images/reel/2026/c03-place-darmes-sapins-16x9.jpg", caption: "Hôtel Place d'Armes", alt: "Hôtel Place d'Armes, Vieux-Montréal : deux grands sapins couverts de mini-lumières blanc chaud dans des jardinières, de part et d'autre de l'entrée" },
  { image: "/images/reel/2026/c04-modavie-saint-paul-16x9.jpg", caption: "Bistro Modavie — rue Saint-Paul Ouest", alt: "Bistro Modavie, rue Saint-Paul Ouest : lumières en glaçons blanc chaud autour de la vitrine et couronne de sapin aux baies rouges illuminée" },
  { image: "/images/reel/2026/c05-mama-c-facade-16x9.jpg", caption: "Mama C, cuisine grecque", alt: "Mama C, cuisine grecque, Vieux-Montréal : jardinières de verdure illuminées sous les vitrines et guirlandes de verdure autour des fenêtres" },
  { image: "/images/reel/2026/c06-mama-c-jardiniere-16x9.jpg", caption: "Mama C, cuisine grecque", alt: "Jardinière de fenêtre du Mama C : branches de pin, feuilles de magnolia et mini-lumières blanc chaud" },
  { image: "/images/vieux-montreal/vieux-montreal-01.jpg", alt: "Arche d'entrée en pierre habillée de verdure et d'un rideau de mini-lumières blanc chaud" },
  { image: "/images/vieux-montreal/vieux-montreal-02.jpg", alt: "Jardinière de conifères illuminée au pied d'une façade de pierre grise" },
  { image: "/images/vieux-montreal/vieux-montreal-03.jpg", alt: "Fenêtres en arc encadrées de guirlandes de verdure et de mini-lumières blanc chaud" },
  { image: "/images/vieux-montreal/vieux-montreal-04.jpg", alt: "Rideau de mini-lumières blanc chaud sous l'auvent d'une vitrine" },
  { image: "/images/vieux-montreal/vieux-montreal-05.jpg", alt: "Guirlande de verdure et de baies rouges, éclairée de mini-lumières, au-dessus d'une vitrine" },
  { image: "/images/vieux-montreal/vieux-montreal-06.jpg", alt: "Deux jardinières de conifères illuminées devant une façade de pierre" },
];
