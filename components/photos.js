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
//
// TROIS RÈGLES DEPUIS LE 2026-11-23 (photos « Saison 2026 ») :
//   · l'alt DÉCRIT CE QU'ON A INSTALLÉ (ligne de toit, colonnes, arbres…),
//     jamais « maison illuminée pour les Fêtes » ;
//   · une photo peut porter deux RECADRAGES en plus de l'entière : `paysage`
//     (16:9 — cartes, heros) et `portrait` (4:5 — téléphone, galeries). Les
//     composants passent par `cadre()` / `PhotoCadree` ; la visionneuse de
//     /realisations montre toujours l'entière ;
//   · AUCUNE PHOTO SUR PLUS DE 8 PAGES (`npm run check:usage`).
// =============================================================================

import {
  SITUEES_2026, GENERIQUES_2026, CITY_PHOTO_2026, CITY_VISUEL_2026, RESIDENTIEL_PAR_VILLE_2026,
  PERMANENT_PAR_VILLE_2026, COMMERCIAL_PAR_VILLE_2026, PHOTOS_VILLE_2026,
} from "./medias-2026.js";

/** Toute photo dont le src commence par ceci est réelle. */
export const REEL_PREFIX = "/images/reel/";
/**
 * Les dossiers de vraies photos. `/realisations/` (2026-11-24) : les images
 * tirées des tournages de la saison 2026 (drone, caméra, Vieux-Port), rangées
 * par lieu — voir components/medias-2026.js.
 */
export const REEL_PREFIXES = [REEL_PREFIX, "/realisations/"];
export const sousReel = (src) => !!src && REEL_PREFIXES.some((x) => src.startsWith(x));

/** Vrai si cette photo est un vrai chantier (et peut donc nommer sa ville). */
export const estReelle = (p) => !!p && sousReel(p.src);

// -----------------------------------------------------------------------------
// Photos SITUÉES — un chantier identifié. `ville` autorise l'alt à la nommer,
// et interdit du même coup à la photo de servir ailleurs.
// -----------------------------------------------------------------------------
const SITUEES = {
  "blainville-01": {
    src: `${REEL_PREFIX}noel-blainville-01.jpg`,
    ville: "Blainville",
    alt: "Maison contemporaine à toit plat à Blainville : bordure de toit en ampoules blanc chaud, colonne de pierre enrubannée et arbre illuminé en façade",
  },
  "terrebonne-01": {
    src: `${REEL_PREFIX}noel-terrebonne.jpg`,
    ville: "Terrebonne",
    alt: "Résidence de pierre à Terrebonne, sous la neige : ligne de toit et pignon en blanc chaud, balcon et arbustes illuminés",
  },
  "st-jerome-01": {
    src: `${REEL_PREFIX}noel-st-jerome-01.jpg`,
    ville: "Saint-Jérôme",
    alt: "Maison à Saint-Jérôme : ligne de toit en ampoules ambrées, avant-toit et contour du garage en bleu et blanc chaud, colonne enrubannée",
  },
  "mirabel-01": {
    src: `${REEL_PREFIX}noel-mirabel-01.jpg`,
    ville: "Mirabel",
    alt: "Maison contemporaine à Mirabel : bordures de toit sur deux niveaux en blanc chaud et petits conifères illuminés devant la façade",
  },
  "ste-julienne-01": {
    src: `${REEL_PREFIX}noel-ste-julienne-01.jpg`,
    ville: "Sainte-Julienne",
    alt: "Résidence contemporaine à Sainte-Julienne, à l'heure bleue : bordure de toit en blanc chaud, poteaux de la galerie enrubannés, couronne et guirlande au-dessus des portes de garage",
  },
  "ste-anne-01": {
    src: `${REEL_PREFIX}noel-ste-anne.jpg`,
    ville: "Sainte-Anne-des-Plaines",
    alt: "Maison de style ferme à Sainte-Anne-des-Plaines : pignons et lignes de toit soulignés en blanc chaud, sous la première neige",
  },
  "st-donat-01": {
    src: `${REEL_PREFIX}noel-st-donat-01.jpg`,
    ville: "Saint-Donat",
    alt: "Allée bordée de petits conifères illuminés en blanc chaud à Saint-Donat, de nuit",
  },
  "st-donat-02": {
    src: `${REEL_PREFIX}noel-st-donat-02.jpg`,
    ville: "Saint-Donat",
    alt: "Épinettes enneigées illuminées en blanc chaud devant un chalet à Saint-Donat, en soirée",
  },
  "lery-01": {
    src: `${REEL_PREFIX}noel-lery-01.jpg`,
    ville: "Léry",
    alt: "Grande maison à Léry : chaque pignon souligné en blanc chaud, colonnes de pierre enrubannées et arbustes illuminés",
  },
  "mercier-01": {
    src: `${REEL_PREFIX}noel-mercier-01.jpg`,
    ville: "Mercier",
    // Mercier est SUR la Rive-Sud : la photo peut porter la page de la zone
    // (CITY_VISUEL), et son alt peut le dire.
    zone: "rive-sud",
    alt: "Maison à Mercier, sur la Rive-Sud : lignes de toit des deux étages et avant-toit du garage en blanc froid, sous la neige",
  },
  "montreal-01": {
    src: `${REEL_PREFIX}noel-montreal-01.jpg`,
    ville: "Montréal",
    alt: "Maison à Montréal, sous la neige : ligne de toit et avant-toit de la galerie en blanc chaud, colonnes enrubannées et arbre illuminé",
  },
  // L'équipe au travail (2026-11-11) : sert au cadre « ampoule »
  // (components/CadreAmpoule.jsx). Portrait 1170×1685. Aucun nom de client
  // ni d'entreprise dans l'alt, seulement le quartier.
  "installateur-vieux-montreal": {
    src: `${REEL_PREFIX}installateur-vieux-montreal.jpg`,
    ville: "Montréal",
    largeur: 1170,
    hauteur: 1685,
    // Placement dans le cadre « ampoule » (components/CadreAmpoule.jsx,
    // inclinaison 17°), CALCULÉ par recherche, pas au jugé : la photo couvre
    // tout le verre ; la tête et les deux mains restent à 8,5 unités au
    // moins du contour (demi-trait : 3,25) ; trois des cinq points témoins
    // des arches illuminées sont dans le verre ; il fait 40 % de la hauteur
    // du verre ; la nacelle sous ses pieds n'en occupe que 3,5 %.
    // Desktop (2026-11-11, ampoule entière ≤ 78 % de la hauteur de l'écran) :
    // tout le corps (tête → pieds) dans le verre, à 7,7 unités au moins du
    // contour, centré sur la partie la plus large du verre (écart < 5).
    ampoule: { pxParUnite: 6.25, x: -47.3, y: -31.6 },
    // Téléphone : petite ampoule (~47 % de l'écran) à côté du prix. Zoom
    // maximal qui garde la tête, le harnais, le dos, les deux bras et les
    // deux mains à 5 unités au moins du contour, le corps CENTRÉ dans le
    // verre (écart < 1 unité), six points des guirlandes illuminées dans le
    // verre (tête ≈ 37 px à 390). Calculé, comme les autres.
    ampouleMobile: { pxParUnite: 5.8125, x: -58.4, y: -26.4 },
    alt: "Un de nos installateurs, en harnais sur une nacelle, pose des guirlandes illuminées autour de fenêtres en arche dans le Vieux-Montréal",
  },
  "stratford-01": {
    src: `${REEL_PREFIX}noel-stratford-01.jpg`,
    ville: "Stratford",
    alt: "Maison contemporaine à Stratford : lignes de toit en ampoules multicolores, sur la neige à l'heure bleue",
  },
};

// -----------------------------------------------------------------------------
// Photos GÉNÉRIQUES — de vraies photos de nos chantiers, mais dont on ne
// revendique pas le lieu. Leur alt ne nomme AUCUNE ville, ce qui les rend
// utilisables partout, y compris sur la page d'une ville qu'on n'a pas
// encore photographiée. Ne jamais leur ajouter `ville`.
// -----------------------------------------------------------------------------
// ── Saison 2026 (2026-11-23) ─────────────────────────────────────────────
// Neuf photos, cinq maisons. GÉNÉRIQUES : aucun alt, aucune légende ne nomme
// un lieu, et elles peuvent donc servir sur n'importe quelle page de ville.
// Deux maisons sont connues (Yahir, 2026-11-23) : C est la maison de
// Sainte-Anne-des-Plaines (`ste-anne-01`), E celle de Terrebonne
// (`terrebonne-01`). Sur /realisations elles partagent UNE carte avec la
// photo de l'an dernier, et c'est cette photo située qui porte la ville
// (components/realisations.js). Ne PAS leur donner `ville` tant qu'elles
// illustrent d'autres pages de ville (RESIDENTIEL_PAR_VILLE) : check-photos
// le refuserait, à raison.
// Préparées par scripts/preparer-photos-2026.mjs (numéros civiques floutés,
// recadrages, 07 et 08 éclaircies ; rien de généré, aucune lumière ajoutée).
// `legende` : ce qu'on y a installé, en trois mots, pour une bande ou la
// vitrine — jamais un lieu.
const S26 = `${REEL_PREFIX}2026/`;
const s26 = (nom, reste) => ({
  src: `${S26}${nom}.jpg`,
  paysage: `${S26}${nom}-16x9.jpg`,
  portrait: `${S26}${nom}-4x5.jpg`,
  saison: 2026,
  ...reste,
});
const SAISON_2026 = {
  // A — maison de brique, escalier en fer forgé. La meilleure de la série.
  "s26-escalier": s26("01-brique-escalier-guirlande", {
    legende: "Rampes, guirlande et fenêtres",
    alt: "Maison de brique : escalier en fer forgé illuminé, arche de guirlande au nœud rouge à l'entrée, contours des fenêtres et ligne de toit en blanc chaud",
  }),
  // B — maison de brique à trois pignons (façade, colonnes, vue de côté).
  "s26-pignons-facade": s26("02-brique-3-pignons-facade", {
    legende: "Trois pignons en C9",
    alt: "Maison de brique à trois pignons : lignes de toit en ampoules C9 blanc chaud, avant-toit du porche et colonnes enrubannées",
  }),
  "s26-pignons-colonnes": s26("03-brique-3-pignons-colonnes", {
    legende: "Colonnes enrubannées",
    alt: "Détail de l'entrée : deux colonnes enrubannées de mini-lumières et avant-toit du porche bordé d'ampoules C9",
  }),
  "s26-pignons-angle": s26("04-brique-3-pignons-angle", {
    legende: "Pignons en C9",
    alt: "La même maison de brique vue de côté : les trois pignons soulignés en ampoules C9 blanc chaud, colonnes du porche enrubannées",
  }),
  // C — ferme moderne blanche (façade, galerie). La maison de `ste-anne-01`.
  "s26-ferme-facade": s26("05-ferme-moderne-facade", {
    legende: "Toit et galerie",
    alt: "Maison blanche de style ferme moderne : pignons, lucarne et avant-toits en blanc chaud, guirlandes suspendues sous la galerie et poteaux enrubannés",
  }),
  "s26-ferme-galerie": s26("06-ferme-moderne-galerie", {
    legende: "Galerie et poteaux",
    alt: "Galerie de la même maison : guirlandes suspendues, poteaux enrubannés de mini-lumières et lignes de toit en blanc chaud",
  }),
  // D — maison contemporaine en pierre (façade, vue de côté).
  "s26-contemporaine-facade": s26("07-contemporaine-pierre-facade", {
    legende: "Toits sur plusieurs niveaux",
    alt: "Maison contemporaine en pierre : bordures de toit sur plusieurs niveaux soulignées d'ampoules blanc chaud",
  }),
  "s26-contemporaine-angle": s26("08-contemporaine-pierre-angle", {
    legende: "Bordures de toit",
    alt: "La même maison contemporaine vue de côté : deux niveaux de bordures de toit en ampoules blanc chaud au-dessus du garage",
  }),
  // E — maison de pierre, balcon en fer forgé. La maison de `terrebonne-01`.
  "s26-balcon": s26("09-pierre-balcon-lanternes", {
    legende: "Balcon et pignon",
    alt: "Maison de pierre : balcon en fer forgé enrubanné de mini-lumières, pignon et corniches soulignés d'ampoules C9 blanc chaud",
  }),
};

const GENERIQUES = {
  ...SAISON_2026,
  ...GENERIQUES_2026,
  "arbre-enrubanne": {
    src: `${REEL_PREFIX}noel-arbre-enrubanne.jpg`,
    alt: "Grand arbre dénudé enrubanné de lumières blanc chaud, du tronc jusqu'aux branches, devant une maison de brique",
  },
  "residentiel-01": {
    src: `${REEL_PREFIX}noel-residentiel-01.jpg`,
    alt: "Maison de pierre : pignons et ligne de toit en blanc chaud, grand conifère illuminé de la base à la cime",
  },
  // La chocolaterie, photos ENTIÈRES (2026-11-13, demande de Yahir) : le
  // camion, la remorque, la vitrine et l'enseigne sur pylône restent dans
  // le cadre. C'est un commerce public qu'on a illuminé, photographié de la
  // rue : on le montre au complet. Les versions recadrées du 2026-11-11
  // (enseigne coupée) sont retirées. Nouveaux noms de fichier pour qu'aucun
  // cache ne remontre l'ancienne version.
  "commercial-01": {
    src: `${REEL_PREFIX}noel-commercial-entiere.jpg`,
    alt: "Chocolaterie : bordures de toit en blanc chaud sur deux niveaux et pylône de l'enseigne enrubanné de lumières",
  },
  "commercial-02": {
    src: `${REEL_PREFIX}noel-commercial-02-entiere.jpg`,
    alt: "La même chocolaterie sous un autre angle : bordures de toit et pylône de l'enseigne illuminés, à la tombée du jour",
  },
  "arbres-01": {
    src: `${REEL_PREFIX}noel-trees-01.jpg`,
    // Sert de visuel à /secteur/laval, qui n'a aucun chantier photographié :
    // l'alt ne nomme donc AUCUNE ville (check-photos §6).
    alt: "Conifères enneigés illuminés en blanc chaud au bord d'un terrain résidentiel",
  },
  "arbres-02": {
    src: `${REEL_PREFIX}noel-trees-02.jpg`,
    alt: "Bosquet d'épinettes illuminées devant un chalet, à l'heure bleue",
  },
  // ⚠️ permanent-hero, -01 et -02 sont LA MÊME MAISON, en trois ambiances
  // (vues sur les photos). /realisations en fait UNE carte qui passe de
  // l'une à l'autre (components/AmbiancesPermanent.jsx). L'alt dit la
  // couleur, puisque c'est la seule chose qui change.
  "permanent-hero": {
    src: `${REEL_PREFIX}perm-led1.jpg`,
    alt: "Maison en éclairage architectural permanent : pastilles DEL sous les soffites et le fronton, ambiance bleu, blanc, rouge",
  },
  "permanent-detail": {
    src: `${REEL_PREFIX}perm-led-02.jpg`,
    alt: "Gros plan des pastilles DEL RGB de l'éclairage permanent, alignées dans leur rail",
  },
  "permanent-01": {
    src: `${REEL_PREFIX}perm-led.jpg`,
    alt: "La même maison, pastilles DEL permanentes réglées en rose et rouge",
  },
  "permanent-02": {
    src: `${REEL_PREFIX}perm-led2.jpg`,
    alt: "La même maison, pastilles DEL permanentes réglées en multicolore",
  },
  "permanent-03": {
    src: `${REEL_PREFIX}perm-led3.jpg`,
    alt: "Pose de l'éclairage permanent en blanc chaud sous les soffites d'une maison à pignons, échelle appuyée sur la façade",
  },
};

// -----------------------------------------------------------------------------
// Photos « AVANT » — des SIMULATIONS, pas des photos de chantier.
// -----------------------------------------------------------------------------
// 🚨 CE QUE C'EST, EXACTEMENT. La même photo que son « après », passée par
// un modèle qui en a RETIRÉ les lumières de Noël. Ce n'est donc pas une
// photo prise avant les travaux : c'est une reconstitution de l'état
// « sans lumières » à partir de la vraie photo.
//
// ⚠️ ELLES NE VIVENT PAS SOUS /images/reel/, ET C'EST VOLONTAIRE.
// La règle du dossier est que seule une image sous ce préfixe est une
// vraie photo de chantier, et qu'elle seule peut nommer une ville. Une
// simulation qui dirait « à Léry » laisserait croire qu'on a photographié
// cette maison avant de poser quoi que ce soit. Leur alt décrit donc
// l'ÉTAT, jamais le lieu — et scripts/check-photos.mjs casse le build si
// quelqu'un l'oublie.
//
// Le côté « après » du comparateur, lui, est bien réel et nomme sa ville :
// c'est lui qui porte l'affirmation.
//
// ⚠️ Les dimensions sont CALÉES sur celles de leur « après »
// (scripts/preparer-avant-apres.mjs, fit: 'fill'). Sans ça la ligne de
// toit se décale de part et d'autre de la couture du comparateur.
const AVANT = {
  "avant-lery": {
    src: "/images/before-lery.jpg",
    simulation: true,
    pairAvec: "lery-01",
    alt: "La même grande maison, simulation de la façade sans aucune lumière de Noël",
  },
  "avant-ste-julienne": {
    src: "/images/before-ste-julienne.jpg",
    simulation: true,
    pairAvec: "ste-julienne-01",
    alt: "La même résidence à l'heure bleue, simulation de la façade sans aucune lumière de Noël",
  },
};

export const PHOTOS = { ...SITUEES, ...SITUEES_2026, ...GENERIQUES, ...AVANT };

/** Les clés qui sont des simulations, pas des photos de chantier. */
export const CLES_SIMULATION = Object.keys(AVANT);

/**
 * La paire avant/après d'un chantier, ou null.
 *
 * Rend `{ avant, apres }` — `avant` est une simulation, `apres` la vraie
 * photo. Les deux ont exactement les mêmes dimensions.
 */
export const paireAvantApres = (cleAvant) => {
  const avant = AVANT[cleAvant];
  if (!avant) return null;
  const apres = { ...SITUEES, ...GENERIQUES }[avant.pairAvec];
  return apres ? { avant, apres } : null;
};

/** Les clés dont la photo ne revendique aucun lieu. */
export const CLES_GENERIQUES = Object.keys(GENERIQUES);

// -----------------------------------------------------------------------------
// Ville → clé photo. `null` = aucune vraie photo de CETTE ville.
// -----------------------------------------------------------------------------
export const CITY_PHOTO = {
  blainville: "blainville-01",
  terrebonne: "terrebonne-01",
  "saint-jerome": "st-jerome-01",
  montreal: "montreal-01",
  laval: null,      // aucun chantier photographié à Laval
  // Léry (Montérégie) est notre seule photo au sud du fleuve, mais la page
  // « Rive-Sud » parle de Brossard, Longueuil, Boucherville — Léry est à ~40 km
  // de là. L'y mettre referait, en plus discret, le coup de « Terrebonne sur
  // Laval ». La page garde donc une générique. À basculer sur "lery-01" si
  // Yahir considère Léry comme faisant partie du territoire Rive-Sud.
  "rive-sud": null,
  // 2026-11-24 — les villes tournées cette saison ont leur photo ; les autres
  // n'en ont aucune (null) et montrent un VISUEL générique (CITY_VISUEL).
  ...CITY_PHOTO_2026,
};

// -----------------------------------------------------------------------------
// Photos attendues mais absentes du dépôt.
// -----------------------------------------------------------------------------
// Plus aucune photo manquante — les trois dernières sont arrivées le
// 2026-08-30. Garder le tableau : il documente le format attendu si une
// photo vient à manquer de nouveau.
export const PHOTOS_MANQUANTES = [];

// Dossiers dont les images sont FOURNIES PLUS TARD et rendues seulement si
// elles existent. La garde de compilation ne doit pas les traiter comme des
// références cassées : le composant qui les affiche teste chaque fichier au
// chargement et masque le bloc entier dès qu'il en manque un (voir
// components/demos.js + le BlocMaquette de la calculatrice).
//
// C'est une exception étroite, par préfixe, et elle reste affichée dans le
// rapport de la garde : une image absente doit rester visible, elle ne doit
// simplement pas casser le build d'une section conçue pour être vide.
export const PREFIXES_OPTIONNELS = [
  "/images/demos/", // avant / maquette / après des 3 cas clients
];

/** Une photo par clé, ou null. */
export const photo = (cle) => (cle && PHOTOS[cle]) || null;

/**
 * La même photo, dans le cadrage demandé : "paysage" (16:9), "portrait"
 * (4:5) ou l'entière. Une photo sans recadrage rend son fichier unique —
 * on peut donc l'appeler sur n'importe quelle photo du registre.
 */
export const cadre = (p, format = "paysage") =>
  p ? { ...p, src: (format === "paysage" ? p.paysage : format === "portrait" ? p.portrait : null) || p.src } : null;

/** La photo propre à une ville, ou null si on n'en a pas. */
export const cityPhoto = (slug) => photo(CITY_PHOTO[slug]);

// -----------------------------------------------------------------------------
// Le VISUEL d'une zone sans photo à elle : carte de /secteur, « À propos ».
// -----------------------------------------------------------------------------
// Deux cas seulement, et check-photos les tient tous les deux :
//   · une vraie photo d'une ville QUI EST dans la zone (Mercier est sur la
//     Rive-Sud — `zone: "rive-sud"` sur la photo) : elle peut le dire ;
//   · sinon une GÉNÉRIQUE, dont l'alt ne nomme aucune ville. Laval n'a aucun
//     chantier photographié : sa carte montre des conifères, sans « Laval ».
export const CITY_VISUEL = {
  laval: "arbres-01",
  "rive-sud": "mercier-01",
  ...CITY_VISUEL_2026,
};

/** Ce que montre une zone : sa photo, sinon son visuel. Jamais null. */
export const cityVisuel = (slug) => cityPhoto(slug) || photo(CITY_VISUEL[slug]);

/**
 * La légende qu'on peut ÉCRIRE sous ce visuel : la ville de la photo si
 * elle est dans la zone, rien si c'est une générique.
 */
export const legendeVisuel = (slug, nomZone) => {
  const p = cityVisuel(slug);
  if (!p?.ville) return null;
  return p.ville === nomZone ? p.ville : `${p.ville} — ${nomZone}`;
};

// -----------------------------------------------------------------------------
// LES DEUX RÉSOLVEURS. Tout le site passe par eux — c'est ce qui empêche
// une page de ville d'afficher la maison d'ailleurs.
// -----------------------------------------------------------------------------

/**
 * Image d'en-tête d'une page de ville : sa propre photo si elle existe,
 * sinon une générique. Jamais celle d'une autre ville.
 */
export const cityHeroPhoto = (slug) =>
  cityVisuel(slug) || photo("arbre-enrubanne");

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
    // Sans ville (page du service, /services) : la maison aux trois pignons.
    return (citySlug && cityPhoto(citySlug)) || photo("s26-pignons-facade");
  }
  if (serviceSlug === "lumieres-de-noel-commercial") return photo("commercial-01");
  if (serviceSlug === "eclairage-architectural-permanent") return photo("permanent-hero");
  return null; // service inconnu — aucune photo plutôt qu'une image au hasard
}

// -----------------------------------------------------------------------------
// LES CARTES DE SERVICE D'UNE PAGE DE VILLE — une photo DIFFÉRENTE par ville
// -----------------------------------------------------------------------------
// Les six pages de ville montraient les trois mêmes photos (la maison de
// pierre, la chocolaterie, la maison du permanent) : 14 à 16 pages chacune.
// Toutes sont GÉNÉRIQUES (check-photos §5) : la photo de la ville, elle,
// reste dans « À propos ».
//
// Résidentiel : la répartition est celle de Yahir (2026-11-23). La page
// ville × résidentiel reprend la MÊME photo en hero (`heroVilleService`).
export const RESIDENTIEL_PAR_VILLE = {
  blainville: "s26-pignons-facade",
  terrebonne: "s26-ferme-facade",
  "saint-jerome": "s26-pignons-angle",
  laval: "s26-escalier",
  montreal: "s26-balcon",
  "rive-sud": "s26-ferme-galerie",
  ...RESIDENTIEL_PAR_VILLE_2026,
};
// Commercial et permanent : leurs pages (service, ville × service) gardent
// commercial-01 et permanent-hero en hero. Pour que ces deux-là ne dépassent
// pas 8 pages, les CARTES des pages de ville montrent l'autre angle de la
// chocolaterie, et une autre ambiance de la maison du permanent (en
// alternance d'une ville à l'autre).
const PERMANENT_PAR_VILLE = {
  blainville: "permanent-01", terrebonne: "permanent-02",
  "saint-jerome": "permanent-01", laval: "permanent-02",
  montreal: "permanent-01", "rive-sud": "permanent-02",
  // 2026-11-24 — les 13 nouvelles villes se partagent les photos du permanent
  // qui avaient encore de la place sous la règle des 8 pages.
  ...PERMANENT_PAR_VILLE_2026,
};
/** `cle` : "residentiel" | "commercial" | "permanent" (data.js → cleService). */
export function carteServiceVille(cle, citySlug) {
  if (cle === "residentiel") return photo(RESIDENTIEL_PAR_VILLE[citySlug]) || servicePhoto("lumieres-de-noel-residentiel");
  if (cle === "commercial") return photo(COMMERCIAL_PAR_VILLE_2026[citySlug] || "commercial-02");
  if (cle === "permanent") return photo(PERMANENT_PAR_VILLE[citySlug] || "permanent-01");
  return null;
}
/** Le hero d'une page ville × service. Jamais la photo d'une autre ville. */
export function heroVilleService(serviceSlug, citySlug) {
  if (serviceSlug === "lumieres-de-noel-residentiel") return carteServiceVille("residentiel", citySlug);
  // Nouvelles villes (2026-11-24) : commercial-01 et permanent-hero sont déjà
  // sur 8 pages. Le commercial montre une image générique du Vieux-Port (sans
  // enseigne, sans nom) ; le permanent n'a plus de photo libre : null, et la
  // page passe au montage vidéo du hero (HeroPage montage).
  if (citySlug in RESIDENTIEL_PAR_VILLE_2026) {
    if (serviceSlug === "lumieres-de-noel-commercial") return photo(COMMERCIAL_PAR_VILLE_2026[citySlug]);
    if (serviceSlug === "eclairage-architectural-permanent") return null;
  }
  return servicePhoto(serviceSlug);
}

/** Les vraies photos de la saison 2026 prises DANS cette ville (galerie de la page). */
export const photosDeVille = (citySlug) => (PHOTOS_VILLE_2026[citySlug] || []).map((cle) => ({ cle, ...PHOTOS[cle] }));
/** La carte d'un service sur /services (sans ville). */
export function carteService(serviceSlug) {
  // Le permanent : une autre ambiance que le hero de sa page (règle des 8 pages).
  if (serviceSlug === "eclairage-architectural-permanent") return photo("permanent-02");
  return servicePhoto(serviceSlug);
}
