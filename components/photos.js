// =============================================================================
// Registre des photos — Solution Lumière de Noël inc.
// =============================================================================
// UNE SEULE RÈGLE, et elle est vérifiée à la compilation :
//
//   Une photo qui vit sous /images/reel/ est une VRAIE photo de chantier.
//   Elle SEULE a le droit de nommer une ville dans son alt ou sa légende.
//   Tout le reste (image générée, photo d'archive, visuel de stock) reste
//   générique — pour toujours.
//
// Pourquoi ce fichier existe : en 2026-08 le site servait des images
// générées légendées « notre installation à X », et le MÊME fichier servait
// trois villes (noel-blainville-01 apparaissait pour Blainville, Laval et le
// portfolio). Une vraie photo déposée sur ce nom aurait mis une seule maison
// sur trois pages de ville. Le mappage vit donc ici, explicitement, une clé
// par ville — et `scripts/check-photos.mjs` casse le build si la règle est
// violée ou si un fichier référencé n'existe pas sur le disque.
//
// AJOUTER UNE VRAIE PHOTO :
//   1. Déposer le fichier dans public/images/reel/
//   2. L'ajouter à PHOTOS avec sa ville et un alt descriptif
//   3. Pointer la ville vers sa clé dans CITY_PHOTO
//   Ne JAMAIS réutiliser une clé déjà prise par une autre ville.
// =============================================================================

/** Toute photo dont le src commence par ceci est réelle. */
export const REEL_PREFIX = "/images/reel/";

/** Vrai si cette photo est un vrai chantier (et peut donc nommer sa ville). */
export const estReelle = (p) => !!p && p.src.startsWith(REEL_PREFIX);

// -----------------------------------------------------------------------------
// Les photos réelles. Toutes prises entre le 13 novembre et le 10 décembre
// 2025, pendant la vraie saison d'installation. Voir PLAN-IMAGES.md.
// -----------------------------------------------------------------------------
export const PHOTOS = {
  "blainville-01": {
    src: `${REEL_PREFIX}noel-blainville-01.jpg`,
    ville: "Blainville",
    alt: "Maison contemporaine à toit plat illuminée pour les Fêtes à Blainville — ligne de toit, colonnes et arbre en façade",
  },
  "terrebonne-01": {
    src: `${REEL_PREFIX}noel-terrebonne.jpg`,
    ville: "Terrebonne",
    alt: "Résidence illuminée pour les Fêtes à Terrebonne, sous la neige",
  },
  "st-jerome-01": {
    src: `${REEL_PREFIX}noel-st-jerome-01.jpg`,
    ville: "Saint-Jérôme",
    alt: "Résidence illuminée pour les Fêtes à Saint-Jérôme",
  },
  "mirabel-01": {
    src: `${REEL_PREFIX}noel-mirabel-01.jpg`,
    ville: "Mirabel",
    alt: "Maison illuminée pour les Fêtes à Mirabel",
  },
  "ste-julienne-01": {
    src: `${REEL_PREFIX}noel-ste-julienne-01.jpg`,
    ville: "Sainte-Julienne",
    alt: "Résidence illuminée à l'heure bleue à Sainte-Julienne, guirlande blanc-chaud",
  },
  "ste-anne-01": {
    src: `${REEL_PREFIX}noel-ste-anne.jpg`,
    ville: "Sainte-Anne-des-Plaines",
    alt: "Maison illuminée pour les Fêtes à Sainte-Anne-des-Plaines",
  },
  "st-donat-01": {
    src: `${REEL_PREFIX}noel-st-donat-02.jpg`,
    ville: "Saint-Donat",
    alt: "Résidence illuminée pour les Fêtes à Saint-Donat",
  },
  "stratford-01": {
    src: `${REEL_PREFIX}noel-stratford-01.jpg`,
    ville: "Stratford",
    alt: "Maison anguleuse illuminée pour les Fêtes à Stratford — ligne de toit multicolore sur la neige",
  },
  "commercial-01": {
    src: `${REEL_PREFIX}noel-commercial.jpg`,
    // Pas de ville : c'est le commerce qui compte, pas son adresse.
    alt: "Commerce illuminé pour les Fêtes — ligne de toit éclairée et enseigne sur pylône",
  },
  "arbres-01": {
    src: `${REEL_PREFIX}noel-trees-01.jpg`,
    alt: "Conifères enrubannés de lumières dans la neige",
  },
  "arbres-02": {
    src: `${REEL_PREFIX}noel-trees-02.jpg`,
    alt: "Arbres décorés de lumières des Fêtes en soirée",
  },
  "permanent-hero": {
    src: `${REEL_PREFIX}perm-led1.jpg`,
    alt: "Maison complète en éclairage architectural permanent, couleurs changeantes",
  },
  "permanent-detail": {
    src: `${REEL_PREFIX}perm-led-02.jpg`,
    alt: "Gros plan de pastilles DEL RGB d'éclairage permanent sous un soffite",
  },
  "permanent-01": {
    src: `${REEL_PREFIX}perm-led.jpg`,
    alt: "Façade en éclairage architectural permanent la nuit",
  },
  "permanent-02": {
    src: `${REEL_PREFIX}perm-led2.jpg`,
    alt: "Installation d'éclairage permanent en cours, échelle appuyée sur la façade",
  },
};

// -----------------------------------------------------------------------------
// Ville → clé photo. `null` = AUCUNE vraie photo pour cette ville.
//
// Une ville sans photo n'affiche AUCUNE image. Jamais celle d'une autre ville :
// c'est précisément le bogue que ce fichier existe pour rendre impossible.
// -----------------------------------------------------------------------------
export const CITY_PHOTO = {
  blainville: "blainville-01",
  terrebonne: "terrebonne-01",
  "saint-jerome": "st-jerome-01",
  montreal: null,   // PHOTO PERDUE — voir PHOTOS-NEEDED.md
  laval: null,      // aucun chantier photographié à Laval
  "rive-sud": null, // Léry est sur la Rive-Sud — photo perdue, à reverser ici
};

// -----------------------------------------------------------------------------
// Photos attendues mais absentes du dépôt. Déposer le fichier dans
// public/images/reel/, ajouter l'entrée dans PHOTOS, pointer la ville.
// -----------------------------------------------------------------------------
export const PHOTOS_MANQUANTES = [
  { fichier: "noel-lery-01.jpg", usage: "Léry (Rive-Sud) + section valeur de l'accueil" },
  { fichier: "noel-mercier-01.jpg", usage: "Mercier — version pivotée" },
  { fichier: "noel-montreal-01.jpg", usage: "page ville Montréal" },
  { fichier: "lights1.jpg", usage: "2e image commerciale (même commerce, autre angle)" },
  { fichier: "permanent 2.jpg", usage: "galerie éclairage permanent" },
];

/** Une photo par clé, ou null. */
export const photo = (cle) => (cle && PHOTOS[cle]) || null;

/** La photo d'une ville, ou null si on n'en a pas. */
export const cityPhoto = (slug) => photo(CITY_PHOTO[slug]);
