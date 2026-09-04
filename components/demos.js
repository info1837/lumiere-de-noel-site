// Trois vrais chantiers, montrés en trois panneaux : la maison de jour, la
// maquette envoyée au client, le résultat installé de nuit. C'est la preuve
// que la maquette n'est pas une promesse en l'air.
//
// Les images vivent dans /public/images/demos/{slug}/{avant,maquette,apres}.jpg
// et sont fournies par Yahir. Tant qu'un dossier est vide, le cas est
// simplement absent de la page — voir `casDemoDisponibles()`. Aucune image
// d'illustration, aucun rendu généré : un panneau vide vaudrait mieux qu'une
// fausse réalisation (et ce site en a déjà payé le prix).
export const CAS_DEMO = [
  { slug: "blainville-cottage", ville: "Blainville", pieds: 165 },
  { slug: "saint-jerome-bungalow", ville: "Saint-Jérôme", pieds: 140 },
  { slug: "mirabel-grand-cottage", ville: "Mirabel", pieds: 245 },
];

export const PANNEAUX = [
  { cle: "avant", titre: "La maison", legende: "Photo prise avant l'installation" },
  { cle: "maquette", titre: "La maquette", legende: "Le design qu'on vous envoie" },
  { cle: "apres", titre: "Le résultat", legende: "Installé, le soir même" },
];

export const cheminPanneau = (slug, cle) => `/images/demos/${slug}/${cle}.jpg`;
