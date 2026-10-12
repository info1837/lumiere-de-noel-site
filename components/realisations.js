// =============================================================================
// /realisations — UNE CARTE = UN CHANTIER (pas une photo)
// =============================================================================
// La galerie montrait la même propriété plusieurs fois (le restaurant deux
// fois, Saint-Donat deux fois, la maison du permanent trois fois) : on
// avait l'air d'avoir fait MOINS de chantiers, pas plus. Chaque entrée
// ci-dessous est un chantier, avec 1 à N photos. Les compteurs des filtres
// comptent des chantiers.
//
// Les regroupements viennent des photos elles-mêmes (même bâtiment, même
// terrain, même angle) — la liste et la raison de chacun sont dans la PR.
//
// RÈGLES, toutes vérifiées par scripts/check-photos.mjs (au build) :
//   · une photo n'appartient qu'à UN chantier ;
//   · l'étiquette d'un chantier ne nomme une ville que si au moins une de
//     ses photos est SITUÉE dans cette ville ;
//   · un chantier `ambiances` n'a que des photos de la même maison, chacune
//     avec le nom de la couleur VUE sur la photo.
//
// Ce fichier n'importe que le registre des photos : la garde de build peut
// le lire sans l'alias `@/`.
// =============================================================================
import { PHOTOS } from "./photos.js";

export const CATEGORIES_CHANTIERS = ["Résidentiel", "Commercial", "Arbres", "Permanent"];

const BRUTS = [
  // ── Résidentiel ──────────────────────────────────────────────────────────
  { id: "blainville", categorie: "Résidentiel", etiquette: "Blainville", photos: ["blainville-01"] },
  { id: "terrebonne", categorie: "Résidentiel", etiquette: "Terrebonne", photos: ["terrebonne-01"] },
  { id: "saint-jerome", categorie: "Résidentiel", etiquette: "Saint-Jérôme", photos: ["st-jerome-01"] },
  { id: "mirabel", categorie: "Résidentiel", etiquette: "Mirabel", photos: ["mirabel-01"] },
  { id: "sainte-julienne", categorie: "Résidentiel", etiquette: "Sainte-Julienne", photos: ["ste-julienne-01"] },
  { id: "sainte-anne", categorie: "Résidentiel", etiquette: "Sainte-Anne-des-Plaines", photos: ["ste-anne-01"] },
  { id: "stratford", categorie: "Résidentiel", etiquette: "Stratford", photos: ["stratford-01"] },
  { id: "lery", categorie: "Résidentiel", etiquette: "Léry", photos: ["lery-01"] },
  { id: "mercier", categorie: "Résidentiel", etiquette: "Mercier", photos: ["mercier-01"] },
  { id: "montreal", categorie: "Résidentiel", etiquette: "Montréal", photos: ["montreal-01"] },
  { id: "maison-pierre", categorie: "Résidentiel", etiquette: "Maison de pierre et grand conifère", photos: ["residentiel-01"] },

  // ── Arbres ───────────────────────────────────────────────────────────────
  // Saint-Donat : les deux photos situées + noel-trees-02, le MÊME terrain
  // (même rangée d'épinettes devant le même pignon de chalet, de nuit puis
  // à l'heure bleue). noel-trees-02 garde un alt sans ville : c'est
  // l'étiquette du chantier qui porte « Saint-Donat ».
  { id: "saint-donat", categorie: "Arbres", etiquette: "Saint-Donat", photos: ["st-donat-02", "st-donat-01", "arbres-02"] },
  { id: "arbre-enrubanne", categorie: "Arbres", etiquette: "Arbre enrubanné", photos: ["arbre-enrubanne"] },
  { id: "coniferes", categorie: "Arbres", etiquette: "Conifères en blanc chaud", photos: ["arbres-01"] },

  // ── Commercial ───────────────────────────────────────────────────────────
  // Les deux photos montrent la même chocolaterie (même enseigne sur
  // pylône, même façade, même camion) sous deux angles.
  { id: "chocolaterie", categorie: "Commercial", etiquette: "Commercial — chocolaterie", photos: ["commercial-01", "commercial-02"] },

  // ── Permanent ────────────────────────────────────────────────────────────
  // UNE maison, trois ambiances : la carte passe de l'une à l'autre.
  {
    id: "toutes-les-ambiances", categorie: "Permanent", etiquette: "Une maison, toutes les ambiances",
    ambiances: true,
    photos: ["permanent-02", "permanent-hero", "permanent-01"],
    couleurs: ["Multicolore", "Bleu, blanc, rouge", "Rose et rouge"],
  },
  { id: "permanent-blanc-chaud", categorie: "Permanent", etiquette: "Blanc chaud, toute l'année", photos: ["permanent-03"] },
  { id: "pastilles", categorie: "Permanent", etiquette: "Le détail : pastilles DEL dans le rail", photos: ["permanent-detail"] },
];

/** Les chantiers, chaque photo résolue depuis le registre. */
export const CHANTIERS = BRUTS.map((c) => ({
  ...c,
  photos: c.photos.map((cle, i) => ({
    cle,
    src: PHOTOS[cle]?.src,
    alt: PHOTOS[cle]?.alt,
    ville: PHOTOS[cle]?.ville || null,
    ...(c.couleurs ? { couleur: c.couleurs[i] } : {}),
  })),
}));

/** Les trois ambiances de la maison du permanent — réutilisées ailleurs. */
export const AMBIANCES_PERMANENT = CHANTIERS.find((c) => c.ambiances).photos;
