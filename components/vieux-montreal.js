// =============================================================================
// /secteur/vieux-montreal — la galerie (2026-11-12)
// =============================================================================
// Images fixes tirées des tournages de nuit dans le Vieux-Montréal, avec le
// même étalonnage que la vidéo du hero (S-Log3 → Rec.709, puis la courbe
// commune des montages). Une entrée = une image ; la page les affiche dans
// cet ordre.
//
// ⚠️ AUCUN NOM DE CLIENT, NULLE PART. Ni dans `alt`, ni dans le nom du
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
  { image: "/images/vieux-montreal/vieux-montreal-01.jpg", alt: "Arche d'entrée en pierre habillée de verdure et d'un rideau de mini-lumières blanc chaud" },
  { image: "/images/vieux-montreal/vieux-montreal-02.jpg", alt: "Jardinière de conifères illuminée au pied d'une façade de pierre grise" },
  { image: "/images/vieux-montreal/vieux-montreal-03.jpg", alt: "Fenêtres en arc encadrées de guirlandes de verdure et de mini-lumières blanc chaud" },
  { image: "/images/vieux-montreal/vieux-montreal-04.jpg", alt: "Rideau de mini-lumières blanc chaud sous l'auvent d'une vitrine" },
  { image: "/images/vieux-montreal/vieux-montreal-05.jpg", alt: "Guirlande de verdure et de baies rouges, éclairée de mini-lumières, au-dessus d'une vitrine" },
  { image: "/images/vieux-montreal/vieux-montreal-06.jpg", alt: "Deux jardinières de conifères illuminées devant une façade de pierre" },
];
