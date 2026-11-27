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
// SAISON 2026 (2026-11-23) : cinq maisons, en tête de page, dans leur propre
// groupe (`saison: 2026`). L'étiquette dit ce qu'on a installé ; la ville
// n'y figure que quand Yahir l'a donnée. La première photo de chaque chantier
// est sa couverture.
//
// ⚠️ UNE MAISON = UNE CARTE, MÊME D'UNE SAISON À L'AUTRE (Yahir, 2026-11-23).
// Deux des cinq maisons étaient DÉJÀ sur la page avec leur photo de l'an
// dernier, dans une carte à elles : la maison de pierre au balcon est celle
// de Terrebonne, la ferme moderne celle de Sainte-Anne-des-Plaines. La même
// maison dans deux cartes, c'est un chantier compté deux fois. La photo de
// l'an dernier vit donc dans la carte de la saison 2026, après les photos de
// cette année — et c'est elle (photo SITUÉE) qui donne sa ville à
// l'étiquette, comme « Saint-Donat » plus bas. Les photos de 2026 restent
// génériques (alt sans ville) : elles servent aussi sur des pages de ville.
//
// Ce fichier n'importe que le registre des photos : la garde de build peut
// le lire sans l'alias `@/`.
// =============================================================================
import { PHOTOS } from "./photos.js";
import { CHANTIERS_2026, AJOUTS_2026, GROUPES_EXISTANTS_2026 } from "./medias-2026.js";

export const CATEGORIES_CHANTIERS = ["Résidentiel", "Commercial", "Arbres", "Permanent"];

const BRUTS = [
  // ── Saison 2026 — résidentiel ────────────────────────────────────────────
  { id: "s26-escalier", saison: 2026, categorie: "Résidentiel", etiquette: "Escalier, guirlande et fenêtres", photos: ["s26-escalier"] },
  // LOT 2 (2026-11-26) — la victorienne au nœud rouge (aucune ville donnée).
  { id: "s26-victorienne", saison: 2026, categorie: "Résidentiel", etiquette: "Nœud géant, galerie et escalier", photos: ["s26-victorienne"] },

  // ── Saison 2026 — commerces du Vieux-Montréal, lot 2 (2026-11-26) ────────
  // Photos GÉNÉRIQUES (elles portent les cartes commerciales de pages de
  // ville) : l'étiquette nomme le commerce mais pas la ville — c'est le titre
  // du groupe, « Vieux-Montréal », qui la porte (check-photos §9).
  { id: "vm-nelligan", saison: 2026, groupe: "Vieux-Montréal", categorie: "Commercial", etiquette: "Hôtel Nelligan — entrée et jardinières", photos: ["s26-nelligan-face", "s26-nelligan-angle"] },
  { id: "vm-mama-c", saison: 2026, groupe: "Vieux-Montréal", categorie: "Commercial", etiquette: "Mama C, cuisine grecque — jardinières de fenêtres", photos: ["s26-mama-c-facade", "s26-mama-c-jardiniere"] },
  { id: "s26-ferme-moderne", saison: 2026, categorie: "Résidentiel", etiquette: "Ferme moderne — Sainte-Anne-des-Plaines", photos: ["s26-ferme-facade", "s26-ferme-galerie", "ste-anne-01"] },
  { id: "s26-balcon", saison: 2026, categorie: "Résidentiel", etiquette: "Balcon et pignon de pierre — Terrebonne", photos: ["s26-balcon", "terrebonne-01"] },

  // ── Résidentiel ──────────────────────────────────────────────────────────
  { id: "blainville", categorie: "Résidentiel", etiquette: "Blainville", photos: ["blainville-01"] },
  { id: "saint-jerome", categorie: "Résidentiel", etiquette: "Saint-Jérôme", photos: ["st-jerome-01"] },
  { id: "mirabel", categorie: "Résidentiel", etiquette: "Mirabel", photos: ["mirabel-01"] },
  { id: "sainte-julienne", categorie: "Résidentiel", etiquette: "Sainte-Julienne", photos: ["ste-julienne-01"] },
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

// SAISON 2026, PAR VILLE / SITE (2026-11-24) — components/medias-2026.js.
// Les maisons déjà sur la page reçoivent leurs images 2026 dans LEUR carte :
// photos 2026 d'abord (la couverture reste celle de la carte), la photo de
// l'an dernier en dernier. L'ordre du tableau fixe l'ordre des groupes.
const avecAjouts = (c) => {
  const plus = AJOUTS_2026[c.id];
  if (!plus) return c;
  const anciennes = c.photos.filter((k) => !k.startsWith("s26-"));
  const recentes = c.photos.filter((k) => k.startsWith("s26-"));
  return { ...c, saison: 2026, groupe: GROUPES_EXISTANTS_2026[c.id], photos: [...recentes, ...plus, ...anciennes] };
};
const parId = Object.fromEntries(BRUTS.map((c) => [c.id, avecAjouts(c)]));
// Vieux-Montréal (2026-11-26) : Nelligan, Place d'Armes, Modavie, Mama C,
// puis Kyo. Cinq cartes : le Nelligan en vedette.
const ORDRE_2026 = [
  "vm-nelligan", "vm-hotel-place-d-armes", "vm-modavie", "vm-mama-c", "vm-kyo", "blainville-2026",
  "s26-balcon", "terrebonne-sapin", "lorraine-2026", "s26-ferme-moderne",
  "saint-valentin-2026", "beaconsfield-2026", "lery",
];
// Photos d'appareil EN TÊTE d'une carte 2026 (couverture), devant les images
// tirées des vidéos et du drone :
//   · lot 2 (2026-11-26) : la vraie photo de chaque commerce déjà présent ;
//   · UNE MAISON = UNE CARTE (Yahir, 2026-11-27) : la maison B (brique, trois
//     pignons : 02, 03, 04) EST celle de Blainville, la maison D (contemporaine
//     en pierre : 07, 08) celle de Lorraine. Leurs cartes « Trois pignons et
//     colonnes » et « Contemporaine en pierre » sont fondues dans celles de la
//     ville. Les photos restent GÉNÉRIQUES (elles portent les cartes
//     résidentielles d'autres villes) : c'est l'étiquette de la carte, et ses
//     photos de drone situées, qui portent la ville.
const PHOTOS_EN_TETE = {
  "vm-hotel-place-d-armes": ["s26-place-darmes"],
  "vm-modavie": ["s26-modavie"],
  "blainville-2026": ["s26-pignons-facade", "s26-pignons-colonnes", "s26-pignons-angle"],
  "lorraine-2026": ["s26-contemporaine-facade", "s26-contemporaine-angle"],
};
const nouveaux = Object.fromEntries(CHANTIERS_2026.map((c) => [c.id, PHOTOS_EN_TETE[c.id] ? { ...c, photos: [...PHOTOS_EN_TETE[c.id], ...c.photos] } : c]));
const ORDONNES = [
  ...ORDRE_2026.map((id) => nouveaux[id] || parId[id]),
  ...BRUTS.map((c) => parId[c.id]).filter((c) => !ORDRE_2026.includes(c.id)),
];

/** Les chantiers, chaque photo résolue depuis le registre. */
export const CHANTIERS = ORDONNES.map((c) => ({
  ...c,
  photos: c.photos.map((cle, i) => ({
    cle,
    src: PHOTOS[cle]?.src,
    // Les recadrages, quand la photo en a : la carte montre le 16:9 (le 4:5
    // dans une carte carrée ou haute), la visionneuse l'entière.
    paysage: PHOTOS[cle]?.paysage || null,
    portrait: PHOTOS[cle]?.portrait || null,
    alt: PHOTOS[cle]?.alt,
    ville: PHOTOS[cle]?.ville || null,
    ...(c.couleurs ? { couleur: c.couleurs[i] } : {}),
  })),
}));

/** Les trois ambiances de la maison du permanent — réutilisées ailleurs. */
export const AMBIANCES_PERMANENT = CHANTIERS.find((c) => c.ambiances).photos;
