// =============================================================================
// Registre des photos — Solution Lumière de Noël inc.
// =============================================================================
// DEUX RÈGLES, toutes deux vérifiées à la compilation
// (`scripts/check-photos.mjs`) :
//
//   1. Seule une photo vivant sous /images/reel/ est une VRAIE photo de
//      chantier. Elle seule peut nommer une ville dans son alt.
//   2. Une page de ville ne montre JAMAIS la photo d'une autre ville.
//      Si on n'a rien de cette ville : une photo GÉNÉRIQUE (sans ville
//      dans l'alt), jamais la maison du voisin légendée « à Terrebonne ».
//
// La règle 2 existe parce qu'elle a été violée en production : les cartes
// de service choisissaient leur image par TYPE DE SERVICE et court-
// circuitaient le mappage par ville. Résultat : /secteur/laval affichait
// la maison de Terrebonne, avec « à Terrebonne » dans l'alt. Trois photos
// portaient tout le site. La résolution part donc du LIEU, pas du service.
//
// AJOUTER UNE VRAIE PHOTO :
//   1. Déposer le fichier dans public/images/reel/
//   2. L'ajouter à PHOTOS — avec `ville` si le chantier est identifié,
//      SANS `ville` si la photo doit pouvoir servir n'importe où
//   3. Pointer la ville vers sa clé dans CITY_PHOTO
// =============================================================================

/** Toute photo dont le src commence par ceci est réelle. */
export const REEL_PREFIX = "/images/reel/";

/** Vrai si cette photo est un vrai chantier (et peut donc nommer sa ville). */
export const estReelle = (p) => !!p && p.src.startsWith(REEL_PREFIX);

// -----------------------------------------------------------------------------
// Photos SITUÉES — un chantier identifié. `ville` autorise l'alt à la nommer,
// et interdit du même coup à la photo de servir ailleurs.
// -----------------------------------------------------------------------------
const SITUEES = {
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
    src: `${REEL_PREFIX}noel-st-donat-01.jpg`,
    ville: "Saint-Donat",
    alt: "Résidence illuminée pour les Fêtes à Saint-Donat",
  },
  "st-donat-02": {
    src: `${REEL_PREFIX}noel-st-donat-02.jpg`,
    ville: "Saint-Donat",
    alt: "Maison illuminée pour les Fêtes à Saint-Donat, en soirée",
  },
  "stratford-01": {
    src: `${REEL_PREFIX}noel-stratford-01.jpg`,
    ville: "Stratford",
    alt: "Maison anguleuse illuminée pour les Fêtes à Stratford — ligne de toit multicolore sur la neige",
  },
};

// -----------------------------------------------------------------------------
// Photos GÉNÉRIQUES — de vraies photos de nos chantiers, mais dont on ne
// revendique pas le lieu. Leur alt ne nomme AUCUNE ville, ce qui les rend
// utilisables partout, y compris sur la page d'une ville qu'on n'a pas
// encore photographiée. Ne jamais leur ajouter `ville`.
// -----------------------------------------------------------------------------
const GENERIQUES = {
  "arbre-enrubanne": {
    src: `${REEL_PREFIX}noel-arbre-enrubanne.jpg`,
    alt: "Arbre dénudé entièrement enrubanné de lumières blanches au-dessus de la neige",
  },
  "residentiel-01": {
    src: `${REEL_PREFIX}noel-residentiel-01.jpg`,
    alt: "Maison de pierre illuminée pour les Fêtes, grand conifère décoré en façade",
  },
  "commercial-01": {
    src: `${REEL_PREFIX}noel-commercial.jpg`,
    alt: "Commerce illuminé pour les Fêtes — ligne de toit éclairée et enseigne sur pylône",
  },
  "commercial-02": {
    src: `${REEL_PREFIX}noel-commercial-02.jpg`,
    alt: "Façade commerciale illuminée pour les Fêtes, autre angle",
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
  "permanent-03": {
    src: `${REEL_PREFIX}perm-led3.jpg`,
    alt: "Détail d'éclairage architectural permanent sur une façade",
  },
};

export const PHOTOS = { ...SITUEES, ...GENERIQUES };

/** Les clés dont la photo ne revendique aucun lieu. */
export const CLES_GENERIQUES = Object.keys(GENERIQUES);

// -----------------------------------------------------------------------------
// Ville → clé photo. `null` = aucune vraie photo de CETTE ville.
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
// Photos attendues mais absentes du dépôt.
// -----------------------------------------------------------------------------
export const PHOTOS_MANQUANTES = [
  { fichier: "noel-lery-01.jpg", usage: "Léry (Rive-Sud) + section valeur de l'accueil" },
  { fichier: "noel-mercier-01.jpg", usage: "Mercier — version pivotée, pas celle couchée" },
  { fichier: "noel-montreal-01.jpg", usage: "page ville Montréal" },
];

/** Une photo par clé, ou null. */
export const photo = (cle) => (cle && PHOTOS[cle]) || null;

/** La photo propre à une ville, ou null si on n'en a pas. */
export const cityPhoto = (slug) => photo(CITY_PHOTO[slug]);

// -----------------------------------------------------------------------------
// LES DEUX RÉSOLVEURS. Tout le site passe par eux — c'est ce qui empêche
// une page de ville d'afficher la maison d'ailleurs.
// -----------------------------------------------------------------------------

/**
 * Image d'en-tête d'une page de ville : sa propre photo si elle existe,
 * sinon une générique. Jamais celle d'une autre ville.
 */
export const cityHeroPhoto = (slug) =>
  cityPhoto(slug) || photo("arbre-enrubanne");

/**
 * Image d'une carte de service. `citySlug` = la ville de la page courante
 * (null sur l'accueil et /services).
 *
 * Le résidentiel est le seul service ancré à un lieu : sur une page de
 * ville, il montre la maison de CETTE ville quand on l'a. Le commercial
 * et le permanent sont génériques par nature — un commerce reste un
 * commerce, et on ne revendique pas sa ville.
 */
export function servicePhoto(serviceSlug, citySlug = null) {
  if (serviceSlug === "lumieres-de-noel-residentiel") {
    return (citySlug && cityPhoto(citySlug)) || photo("residentiel-01");
  }
  if (serviceSlug === "lumieres-de-noel-commercial") return photo("commercial-01");
  if (serviceSlug === "eclairage-architectural-permanent") return photo("permanent-hero");
  return null; // municipal : aucune photo, volontairement
}
