// =============================================================================
// Solution Lumière de Noël inc. — données centrales (tokens de marque + contenu)
// -----------------------------------------------------------------------------
// Source de vérité : palette/typo/structure extraites de la spec du site
// Squarespace expiré. Les copies longues marquées DRAFT sont reconstruites
// dans la voix de marque — à remplacer si le texte original est récupéré.
// =============================================================================

// --- Palette de couleurs (HEX exacts de la spec) -----------------------------
export const navy = "#0B1B2B"; // arrière-plans sombres
export const charcoal = "#1C1C1C"; // boutons primaires, texte sur fond clair
export const offWhite = "#FAFAFA"; // arrière-plans clairs
export const gold = "#E9DCC0"; // accent champagne
export const ivory = "#F3E9D2"; // titres hero sur fond sombre
export const heroScrim = "rgba(5,10,20,0.82)"; // voile sur image hero

// Dérivés utilitaires (contraste / états)
export const navyDeep = "#06121F";
// Or foncé — texte AA sur fond clair (#FAFAFA) : contraste ≈ 4.8:1.
// Ne pas remonter cette valeur sans vérifier WCAG 2.1 4.5:1 minimum.
export const goldText = "#8A6A1C";
export const line = "rgba(233,220,192,0.22)"; // séparateurs sur fond sombre
export const textMuted = "#5A5A5A";

// --- Coordonnées de l'entreprise ---------------------------------------------
// Domaine de Solution Lumière de Noël Inc. — SOURCE UNIQUE pour les adresses
// courriel. Domaine actif depuis le 2026-08-25 (remplace lumieredenoelinc.ca).
// L'origine du site (baseUrl) est résolue via lib/site-url.js pour supporter
// les previews Vercel et un override par variable d'environnement.
import { getSiteUrl } from "@/lib/site-url";
import { PHOTOS, cityPhoto, servicePhoto } from "@/components/photos";

const DOMAIN = "lumieredenoelinc.com";

export const company = {
  // Raison sociale EXACTE, telle qu'enregistrée et telle qu'affichée sur
  // la fiche Google Business — une divergence de nom est un signal local
  // négatif. shortName existe pour l'affichage court.
  name: "Solution Lumière de Noël inc.",
  shortName: "Lumière de Noël",
  // Numéro Twilio de Solution Lumière de Noël Inc. (2026-08-25).
  // Sert à la fois de numéro public sur le site ET de numéro à Sophie B.
  // Ce n'est PAS celui de Palencia — les deux entreprises ont chacune le
  // leur, et ils ne doivent jamais se croiser.
  phoneDisplay: "(438) 812-6635",
  phoneHref: "tel:+14388126635",
  // ── DOMAINE — UNE SEULE VALEUR ────────────────────────────────────
  // Tout ce qui suit en dérive : courriel, mailto, affichage, baseUrl,
  // sitemap, robots.txt, JSON-LD, canonicals. Passer de .ca à .com se
  // fait en changeant DOMAIN ci-dessus, et rien d'autre.
  email: `info@${DOMAIN}`,
  emailDisplay: `INFO@${DOMAIN.toUpperCase()}`,
  emailHref: `mailto:info@${DOMAIN}`,
  // Territoire réel : PLUS LARGE que celui de Palencia (Rive-Nord seule).
  // L'Estrie qui était ici était une erreur — elle attirait des leads hors zone.
  region: "Rive-Sud, Montréal et Rive-Nord, Québec",
  baseUrl: getSiteUrl(), // apex canonique — override via NEXT_PUBLIC_SITE_URL
  social: null, // aucun réseau social pour l'instant (pas de faux liens)
  // Tarif d'entrée réel fourni par le client.
  priceFrom: "1 000 $",
};

// --- Navigation ---------------------------------------------------------------
// (Corrige le typo de l'ancien site : /home#servicess — slugs propres ici.)
export const nav = [
  { label: "Accueil", href: "/" },
  {
    label: "Services",
    children: [
      { label: "Lumières de Noël — résidentiel", href: "/services/lumieres-de-noel-residentiel" },
      { label: "Lumières de Noël — commercial", href: "/services/lumieres-de-noel-commercial" },
      { label: "Éclairage architectural permanent", href: "/services/eclairage-architectural-permanent" },
      { label: "Tous les services", href: "/services" },
    ],
  },
  { label: "Zones desservies", href: "/secteur" },
  { label: "Blog", href: "/blog" },
  { label: "Calculatrice", href: "/calculatrice" },
  { label: "Renouvellement", href: "/renouvellement" },
  { label: "Soumission", href: "/soumission" },
];

// --- 3 cartes de service (page d'accueil, section 3) -------------------------
export const serviceCards = [
  {
    key: "residentiel",
    title: "Résidentiel",
    // Générique : l'accueil n'est pas une page de ville. La photo de
    // Terrebonne est réservée à Terrebonne.
    image: servicePhoto("lumieres-de-noel-residentiel").src,
    imageAlt: servicePhoto("lumieres-de-noel-residentiel").alt,
    // DRAFT COPY — reconstruite dans la voix de marque
    bullets: [
      "Installation complète : toiture, arbres, arbustes et façade",
      "Matériel professionnel fourni, posé et retiré par notre équipe",
    ],
  },
  {
    key: "commercial",
    title: "Commercial",
    image: PHOTOS["commercial-01"].src,
    imageAlt: PHOTOS["commercial-01"].alt,
    // DRAFT COPY
    bullets: [
      "Façades, vitrines et entrées qui attirent la clientèle",
      "Planification hors-heures pour ne pas nuire à vos opérations",
    ],
  },
];

// --- « Pourquoi nous choisir ? » 4 cartes (accueil, section 4) ---------------
// DRAFT COPY — reconstruite
export const whyUs = [
  {
    title: "Clé en main",
    desc: "On conçoit, installe, entretient et désinstalle. Vous ne touchez jamais à une échelle.",
  },
  {
    title: "Matériel commercial",
    desc: "Lumières DEL de qualité commerciale, durables et écoénergétiques — fournies par nous.",
  },
  {
    // ⚠️ ASSURANCE — la police entre en vigueur au DÉBUT DE LA SAISON
    // (Yahir, 2026-08-30). D'ici là le site ne dit pas « assurée » : c'est
    // une affirmation au présent, lue au présent. Le jour où la police
    // démarre, remettre « assurée » ici et aux autres marqueurs ASSURANCE.
    title: "Vous ne montez jamais dans l'échelle",
    desc: "On fournit l'échelle, le matériel et la main-d'œuvre. Vous ne sortez jamais du salon.",  // ASSURANCE
  },
  {
    title: "Service après-vente",
    desc: "Ampoule brûlée ou section tombée ? On repasse sans frais, autant de fois qu'il le faut — de la pose au retrait.",
  },
];

// --- FAQ accueil (5 questions) -----------------------------------------------
// DRAFT COPY — questions/réponses reconstruites; remplacer par l'original si récupéré
export const faqHome = [
  {
    q: "Quand devrais-je réserver mon installation de lumières de Noël ?",
    a: "Le plus tôt possible. Les agendas d'octobre et novembre se remplissent vite — réserver tôt garantit votre date avant les premières neiges.",
  },
  {
    q: "Fournissez-vous les lumières ou dois-je les acheter ?",
    a: "Nous fournissons tout le matériel : lumières DEL de qualité commerciale, attaches et minuteries. Rien à acheter de votre côté.",
  },
  {
    q: "Est-ce que vous retirez les lumières après les Fêtes ?",
    a: "Oui. Le retrait est inclus. Nous planifions la désinstallation en janvier et entreposons le matériel jusqu'à la prochaine saison.",
  },
  {
    q: "Que se passe-t-il si une lumière brûle pendant la saison ?",
    a: "Le service après-vente est inclus : un appel et on repasse sans frais, autant de fois qu'il le faut, de la pose au retrait.",
  },
  {
    q: "Quelles régions desservez-vous ?",
    a: "La Rive-Sud, Montréal et la Rive-Nord — voir la liste des villes desservies plus bas.",
  },
];

// --- « Comment ça marche » — 5 étapes datées (accueil + /services) -----------
// Datées pour répondre à "qu'est-ce qui se passe après que j'envoie le formulaire"
// dans les 3 premières secondes.
export const processSteps = [
  { num: "01", title: "Soumission gratuite", when: "Aujourd'hui", desc: "Vous remplissez le formulaire ou vous appelez. Réponse en moins de 24 h avec une première fourchette." },
  { num: "02", title: "Visite et design", when: "Sous 3–5 jours", desc: "On vient mesurer la propriété, comprendre votre vision et confirmer un prix ferme, écrit." },
  { num: "03", title: "Installation", when: "Octobre–novembre", desc: "Notre équipe installe tout en sécurité avant la date convenue — matériel professionnel fourni." },
  { num: "04", title: "Entretien pendant la saison", when: "Décembre", desc: "Une lumière qui brûle ? Un appel et on repasse sans frais. Service après-vente inclus." },
  { num: "05", title: "Retrait et entreposage", when: "Janvier", desc: "On désinstalle après les Fêtes et on garde le matériel chez nous jusqu'à la prochaine saison. Rien à ranger." },
];

// (Pas de section témoignages : aucune avis client réel pour l'instant —
//  on n'affiche pas de faux avis ni de note Google/Facebook inventée.)

// --- Zone de service (SEO local) ---------------------------------------------
// Zones prioritaires pour les pages /secteur/[ville] — couvre le Grand Montréal.
export const serviceArea = [
  "Blainville",
  "Terrebonne",
  "Saint-Jérôme",
  "Laval",
  "Montréal",
  "Rive-Sud",
];

// =============================================================================
// SEO — Pages services dynamiques /services/[slug]
// =============================================================================
// Chaque service est rendu en 1 page service générique + N pages service×ville.
// `body` et `bullets` sont injectés dans le template ; `metaDescription` part
// directement dans la balise <meta name="description">.
export const services = [
  {
    slug: "lumieres-de-noel-residentiel",
    title: "Lumières de Noël — Résidentiel",
    h1: "Installation de lumières de Noël résidentielles",
    kicker: "Service résidentiel clé en main",
    heroImage: servicePhoto("lumieres-de-noel-residentiel").src,
    heroImageAlt: servicePhoto("lumieres-de-noel-residentiel").alt,
    metaDescription:
      "Installation de lumières de Noël résidentielles au Québec — conception, pose, entretien et retrait inclus. Matériel professionnel DEL fourni. Soumission gratuite.",
    intro:
      "On illumine votre maison comme si c'était la nôtre. Toiture, arbres, arbustes, façade et entrée — un design pensé pour votre propriété, installé par notre équipe, retiré après les Fêtes.",
    bullets: [
      "Toiture, corniches, arbres, arbustes et façade",
      "DEL commerciales blanc-chaud ou multicolores",
      "Pose, entretien et retrait inclus — vous ne touchez jamais à une échelle",
      "Rappels sans frais et illimités, de la pose au retrait",
    ],
    body: "Notre équipe se déplace, mesure votre propriété et propose un design qui met votre maison en valeur. Le matériel — guirlandes DEL de qualité commerciale, attaches, minuteries — est fourni et installé en sécurité, conformément aux pratiques d'élagage et de hauteur. En janvier, on revient tout retirer et on entrepose le matériel jusqu'à la prochaine saison.",
    forCity: (city) =>
      `Lumières de Noël résidentielles à ${city} : conception, pose, entretien et retrait — tout inclus, sans que vous touchiez à une échelle. On planifie selon la météo locale et les premières neiges.`,
  },
  {
    slug: "lumieres-de-noel-commercial",
    title: "Lumières de Noël — Commercial",
    h1: "Installation de lumières de Noël commerciales",
    kicker: "Pour vos commerces et bureaux",
    heroImage: servicePhoto("lumieres-de-noel-commercial").src,
    heroImageAlt: servicePhoto("lumieres-de-noel-commercial").alt,
    metaDescription:
      "Installation commerciale de lumières de Noël au Québec : façades, vitrines et entrées. Planification hors-heures, matériel professionnel, échéancier respecté.",
    intro:
      "Façades, vitrines, marquises, entrées — on attire l'œil et la clientèle. Planification hors-heures pour ne pas nuire à vos opérations, et le travail en hauteur fait par notre équipe.",  // ASSURANCE
    bullets: [
      "Façades, vitrines, marquises, entrées",
      "Planification hors-heures (soir / nuit) si requis",
      "Travail en hauteur fait par notre équipe",  // ASSURANCE
      "Maintenance pendant la saison incluse",
    ],
    body: "Restaurants, hôtels, bureaux, centres commerciaux, concessionnaires : conception personnalisée selon votre image de marque, échéancier respecté à la lettre, et un seul interlocuteur du début à la fin. Devis détaillé et soumission gratuite.",
    forCity: (city) =>
      `Pour les commerces de ${city}, on planifie l'installation en dehors des heures d'ouverture quand c'est requis — vos clients voient le résultat, jamais les échelles.`,
  },
  {
    slug: "eclairage-architectural-permanent",
    title: "Éclairage architectural permanent",
    h1: "Éclairage architectural permanent (DEL)",
    kicker: "Installé une seule fois — illuminé toute l'année",
    heroImage: servicePhoto("eclairage-architectural-permanent").src,
    heroImageAlt: servicePhoto("eclairage-architectural-permanent").alt,
    metaDescription:
      "Éclairage architectural permanent DEL au Québec : pastilles discrètes installées sous les soffites, contrôle par application, des millions de couleurs et d'animations. Soumission gratuite.",
    intro:
      "Des pastilles DEL fixées discrètement sous les soffites et les corniches : invisibles le jour, programmables le soir. Blanc-chaud pour le quotidien, couleurs et animations pour chaque occasion — Halloween, Noël, Saint-Valentin, Saint-Jean.",
    bullets: [
      "DEL discrètes, invisibles le jour",
      "Des millions de couleurs et animations via l'application",
      "Contrôle par zones, minuteries et scènes prédéfinies",
      "Rappels sans frais toute la saison, de la pose au retrait",
    ],
    body: "L'éclairage architectural permanent élimine la pose annuelle : un seul investissement et votre propriété change de visage à chaque fête. La technologie DEL utilisée est basse consommation et conçue pour résister aux hivers québécois. La plupart des résidences sont installées en une seule journée.",
    forCity: (city) =>
      `À ${city}, l'éclairage architectural permanent élimine définitivement la pose annuelle de lumières — un seul investissement, illuminé toute l'année.`,
  },
];

// =============================================================================
// SEO — Pages villes /secteur/[ville]
// =============================================================================
// `intro` et `body` doivent rester uniques à chaque ville (contenu mince = pénalité).
// `cities` ⊆ `serviceArea` (par slug). `regionLabel` apparaît sous le H1.
const villesBrutes = [
  {
    slug: "blainville",
    name: "Blainville",
    regionLabel: "Couronne nord — Laurentides",
    metaDescription:
      "Installation de lumières de Noël et d'éclairage architectural à Blainville. Service clé en main : conception, pose, entretien et retrait. Soumission gratuite.",
    intro:
      "Blainville est au cœur de notre territoire. De Fontainebleau au Plateau, de Chambéry à Notre-Dame — on connaît les rues et les styles d'architecture du secteur.",
    body: "On planifie le secteur Blainville–Boisbriand–Sainte-Thérèse ensemble, pour limiter les déplacements — réserver tôt garantit votre date avant les premières neiges. Le retrait en janvier est inclus, et le matériel reste de qualité commerciale.",
  },
  {
    slug: "terrebonne",
    name: "Terrebonne",
    regionLabel: "Lanaudière — couronne nord",
    metaDescription:
      "Installation de lumières de Noël à Terrebonne — quartiers Lachenaie, La Plaine et Vieux-Terrebonne. Service complet, matériel fourni, retrait inclus.",
    intro:
      "De Lachenaie à La Plaine en passant par le Vieux-Terrebonne, nous illuminons résidences et commerces dans tout le secteur. Architecture variée — bungalows, cottages, maisons de ville — on adapte le design à votre propriété.",
    body: "Le Vieux-Terrebonne demande des installations soignées, qui mettent en valeur les façades patrimoniales ; les nouveaux développements de Lachenaie et La Plaine demandent souvent des dégagements d'arbres et arbustes plus généreux. Devis personnalisé pour chaque adresse.",
  },
  {
    slug: "saint-jerome",
    name: "Saint-Jérôme",
    regionLabel: "Laurentides",
    metaDescription:
      "Installation de lumières de Noël à Saint-Jérôme et environs — Bellefeuille, Lafontaine, Saint-Antoine. Service clé en main avec retrait inclus.",
    intro:
      "Saint-Jérôme et ses anciens secteurs (Bellefeuille, Lafontaine, Saint-Antoine) sont dans notre territoire. Centre-ville historique, secteurs résidentiels et propriétés commerciales — on installe pour tout.",
    body: "L'hiver arrive vite en haut des Laurentides : on planifie les installations Saint-Jérôme avant les autres pour devancer les premières chutes de neige importantes. Réservez tôt pour garantir votre date.",
  },
  {
    slug: "laval",
    name: "Laval",
    regionLabel: "Île Jésus",
    metaDescription:
      "Installation de lumières de Noël à Laval — Sainte-Dorothée, Sainte-Rose, Chomedey, Fabreville, Vimont. Service résidentiel et commercial, retrait inclus.",
    intro:
      "Laval est sur notre territoire principal : Sainte-Dorothée, Sainte-Rose, Chomedey, Fabreville, Vimont, Saint-François. Quartiers résidentiels et commerces — on couvre toute l'île Jésus.",
    body: "Les grandes propriétés de Sainte-Dorothée et Sainte-Rose se prêtent bien aux designs haut de gamme. Côté commercial : restaurants, concessionnaires et bureaux le long du boulevard des Laurentides et de l'autoroute 15.",
  },
  {
    slug: "montreal",
    name: "Montréal",
    regionLabel: "Île de Montréal",
    metaDescription:
      "Installation de lumières de Noël à Montréal — Plateau, Outremont, Westmount, Ahuntsic, Rosemont, NDG. Résidentiel et commercial, soumission gratuite.",
    intro:
      "Sur l'île, on installe partout : Outremont, Westmount, le Plateau, Ahuntsic, Rosemont, NDG, Côte-des-Neiges. Façades patrimoniales, duplex et triplex, copropriétés — on adapte le design à votre style architectural.",
    body: "Les ruelles montréalaises et les façades en rangée demandent une approche différente des grands terrains de banlieue : davantage d'attention aux corniches, balcons et alignements de fenêtres. Les contraintes urbaines — stationnement, accès, hauteur — font partie du travail.",
  },
  {
    slug: "rive-sud",
    name: "Rive-Sud",
    regionLabel: "Rive-Sud de Montréal",
    metaDescription:
      "Installation de lumières de Noël sur la Rive-Sud de Montréal — Brossard, Longueuil, Boucherville, Saint-Bruno, Saint-Lambert, Saint-Hubert. Service complet.",
    intro:
      "On dessert toute la Rive-Sud : Brossard, Longueuil, Boucherville, Saint-Bruno, Saint-Lambert, Saint-Hubert, La Prairie, Candiac. Résidentiel et commercial, du DIX30 aux quartiers résidentiels patrimoniaux.",
    body: "On dessert la couronne sud rapprochée. Pour les commerces des grandes artères, on planifie les installations hors-heures. Pour les résidences : développements récents comme quartiers établis (vieux Longueuil, vieux Boucherville).",
  },
];

// La photo d'une ville vient UNIQUEMENT du registre (components/photos.js).
// `image`/`imageAlt` valent null quand aucune vraie photo n'existe pour cette
// ville — les pages n'affichent alors aucune image, jamais celle d'ailleurs.
export const cities = villesBrutes.map((v) => {
  const ph = cityPhoto(v.slug);
  return { ...v, image: ph?.src ?? null, imageAlt: ph?.alt ?? null };
});

// Helper : retrouve un service ou une ville par slug (utilisé dans les routes)
export const findService = (slug) => services.find((s) => s.slug === slug);
export const findCity = (slug) => cities.find((c) => c.slug === slug);

// Préposition adaptée au nom de la zone : "sur la Rive-Nord/Rive-Sud",
// "à Blainville/Terrebonne/Laval/Montréal/Saint-Jérôme". Le "à Rive-Sud"
// grammaticalement faux tirait des mauvais signaux SEO en plus de sonner amateur.
export function cityPreposition(cityName) {
  return /^rive-/i.test(cityName) ? "sur la" : "à";
}
export function inCity(cityName) {
  return `${cityPreposition(cityName)} ${cityName}`;
}

// =============================================================================
// Blog — métadonnées des articles SEO
// =============================================================================
// Le contenu Markdown-like de chaque article vit dans `app/blog/posts.js`.
export const blogPosts = [
  {
    slug: "cout-installation-lumieres-de-noel-quebec",
    title: "Combien coûte l'installation de lumières de Noël au Québec en 2026?",
    excerpt:
      "Tarifs réels par type de propriété, ce qui fait varier le prix, et quand réserver pour économiser. Guide pratique pour résidences et commerces.",
    metaDescription:
      "Guide 2026 : combien coûte l'installation de lumières de Noël au Québec? Tarifs par type de propriété, facteurs de prix, et quand réserver. Estimation gratuite.",
    image: PHOTOS["blainville-01"].src,
    imageAlt: PHOTOS["blainville-01"].alt,
    date: "2026-08-01",
    readingTime: "6 min",
    tags: ["Tarifs", "Résidentiel", "Commercial"],
  },
  {
    slug: "quand-reserver-installation-lumieres-noel",
    title: "Quand réserver son installation de lumières de Noël?",
    excerpt:
      "Pourquoi octobre est le meilleur moment, ce qui se passe quand vous attendez trop, et comment garantir votre date avant les premières neiges.",
    metaDescription:
      "Quand réserver son installation de lumières de Noël au Québec? Pourquoi octobre est le moment idéal et comment garantir votre date avant les premières neiges.",
    image: PHOTOS["terrebonne-01"].src,
    imageAlt: PHOTOS["terrebonne-01"].alt,
    date: "2026-07-15",
    readingTime: "4 min",
    tags: ["Planification", "Saison"],
  },
  {
    slug: "del-vs-incandescent-lumieres-noel",
    title: "DEL ou incandescent? Quel type de lumières de Noël choisir",
    excerpt:
      "Consommation, durée de vie, intensité lumineuse, rendu visuel : tableau comparatif honnête entre les DEL commerciales et les lumières traditionnelles.",
    metaDescription:
      "DEL ou incandescent pour vos lumières de Noël? Comparatif honnête : consommation, durée de vie, rendu visuel. Pourquoi les DEL commerciales dominent en 2026.",
    image: PHOTOS["permanent-detail"].src,
    imageAlt: "Détail de guirlandes DEL professionnelles sur une corniche",
    date: "2026-08-20",
    readingTime: "5 min",
    tags: ["Matériel", "DEL"],
  },
];

export const findPost = (slug) => blogPosts.find((p) => p.slug === slug);

// --- Page : Éclairage architectural ------------------------------------------
export const eclairagePage = {
  slug: "eclairage-architectural",
  navLabel: "Éclairage architectural",
  heroKicker: "Éclairage permanent",
  heroTitle: "LUMIÈRE PERMANENTE",
  // DRAFT COPY
  heroSubtitle:
    "Un système DEL architectural installé une seule fois — illuminez votre propriété toute l'année, des Fêtes à la Saint-Jean, par simple application.",
  heroImage: PHOTOS["permanent-hero"].src,
  heroImageAlt: "Maison avec éclairage architectural permanent allumé la nuit",
  // DRAFT COPY
  feature: {
    title: "Qu'est-ce que l'éclairage architectural permanent ?",
    body: "Les pastilles DEL sont fixées discrètement sous les soffites et les corniches. Invisibles le jour, programmables le soir : blanc chaud pour le quotidien, couleurs et animations pour chaque occasion. Fini les échelles, fini la pose annuelle.",
    points: [
      "DEL discrètes, invisibles le jour",
      "Des millions de couleurs et d'animations via l'application",
      "Contrôle par zones, minuteries et scènes prédéfinies",
      "Rappels sans frais toute la saison, de la pose au retrait",
    ],
  },
  whyChoose: [
    { title: "Installé une fois", desc: "Aucune réinstallation annuelle — le système reste en place toute l'année." },
    { title: "Toutes les occasions", desc: "Halloween, Noël, Saint-Valentin, fête nationale : un thème par soir." },
    { title: "Écoénergétique", desc: "DEL basse consommation, durée de vie de plusieurs années." },
    { title: "Discret de jour", desc: "Profil mince couleur soffite — on ne voit que la lumière, le soir." },
  ],
  // DRAFT COPY — 8 questions reconstruites
  faq: [
    { q: "Est-ce que les lumières sont visibles le jour ?", a: "Très peu. Les pastilles épousent la couleur du soffite et restent discrètes ; on remarque l'éclairage seulement une fois allumé." },
    { q: "Puis-je changer les couleurs moi-même ?", a: "Oui. Tout se contrôle depuis une application : couleurs, zones, animations, minuteries et scènes pour chaque fête." },
    { q: "Combien de temps dure l'installation ?", a: "La plupart des résidences se font en une seule visite, selon la dimension et l'architecture du bâtiment." },
    { q: "Quelle est la durée de vie des DEL ?", a: "Plusieurs années en usage normal. Pendant la saison, tout rappel est sans frais." },
    { q: "Est-ce que ça consomme beaucoup d'électricité ?", a: "Non. La technologie DEL utilisée est basse consommation, même utilisée régulièrement." },
    { q: "Est-ce que le système résiste à l'hiver québécois ?", a: "Oui. Les composantes sont conçues pour l'extérieur et les écarts de température du Québec." },
    { q: "Pouvez-vous l'installer sur tout type de bâtiment ?", a: "Résidentiel et commercial. On évalue la faisabilité lors de la soumission gratuite." },
    { q: "Qu'arrive-t-il en cas de bris ?", a: "Un appel et on repasse — sans frais, autant de fois qu'il le faut, de la pose au retrait." },
  ],
  // Vraies installations d'éclairage permanent. Pas de légende de ville :
  // ces photos-là n'ont pas de ville confirmée au dossier.
  gallery: [
    { image: PHOTOS["permanent-01"].src, alt: PHOTOS["permanent-01"].alt },
    { image: PHOTOS["permanent-02"].src, alt: PHOTOS["permanent-02"].alt },
  ],
};

// Sélection de 6 photos de projets — représentative du territoire réel
// (Rive-Nord + Grand Montréal + Rive-Sud). Utilisée pour l'aperçu accueil.
// Les indices sont figés pour garder une sélection cohérente si la galerie
// complète s'étoffe. Voir noelPage.gallery pour la source.
// Six vignettes VISUELLEMENT distinctes, aucune déjà vue plus haut sur
// l'accueil (hero = arbre enrubanné, section valeur = Léry).
// 0 Blainville · 1 Terrebonne · 2 St-Jérôme · 3 Mirabel · 4 Ste-Julienne
// 5 Ste-Anne · 6 St-Donat · 7 Stratford · 8 Léry · 9 Mercier · 10 Montréal
// 11 Commercial · 12-13 Arbres
const HOME_PORTFOLIO_INDICES = [0, 2, 3, 9, 10, 11];

// --- Page : Lumière de Noël ---------------------------------------------------
export const noelPage = {
  slug: "realisations",
  navLabel: "Lumière de Noël",
  heroKicker: "Service saisonnier clé en main",
  heroTitle: "INSTALLATION DE LUMIÈRES DE NOËL AU QUÉBEC",
  // DRAFT COPY
  heroSubtitle:
    "Conception, installation, entretien et retrait. On s'occupe de tout — vous profitez des Fêtes.",
  // En-tête du portfolio : une photo qui n'est PAS dans la galerie plus bas,
  // sinon la même maison ouvre la page et y réapparaît en vignette.
  heroImage: PHOTOS["st-donat-02"].src,
  heroImageAlt: PHOTOS["st-donat-02"].alt,
  // DRAFT COPY
  intro:
    "Voici des installations réalisées cette saison, à travers notre territoire.",
  // Vraies réalisations, saison 2025. Ces photos-là PEUVENT nommer leur
  // ville : ce sont de vrais chantiers. Une image générée ne le pourrait
  // jamais — scripts/check-photos.mjs casse le build si ça arrive.
  gallery: [
    { image: PHOTOS["blainville-01"].src,   alt: PHOTOS["blainville-01"].alt,   caption: "Blainville" },
    { image: PHOTOS["terrebonne-01"].src,   alt: PHOTOS["terrebonne-01"].alt,   caption: "Terrebonne" },
    { image: PHOTOS["st-jerome-01"].src,    alt: PHOTOS["st-jerome-01"].alt,    caption: "Saint-Jérôme" },
    { image: PHOTOS["mirabel-01"].src,      alt: PHOTOS["mirabel-01"].alt,      caption: "Mirabel" },
    { image: PHOTOS["ste-julienne-01"].src, alt: PHOTOS["ste-julienne-01"].alt, caption: "Sainte-Julienne" },
    { image: PHOTOS["ste-anne-01"].src,     alt: PHOTOS["ste-anne-01"].alt,     caption: "Sainte-Anne-des-Plaines" },
    { image: PHOTOS["st-donat-01"].src,     alt: PHOTOS["st-donat-01"].alt,     caption: "Saint-Donat" },
    { image: PHOTOS["stratford-01"].src,    alt: PHOTOS["stratford-01"].alt,    caption: "Stratford" },
    { image: PHOTOS["lery-01"].src,         alt: PHOTOS["lery-01"].alt,         caption: "Léry" },
    { image: PHOTOS["mercier-01"].src,      alt: PHOTOS["mercier-01"].alt,      caption: "Mercier" },
    { image: PHOTOS["montreal-01"].src,     alt: PHOTOS["montreal-01"].alt,     caption: "Montréal" },
    { image: PHOTOS["commercial-02"].src,   alt: PHOTOS["commercial-02"].alt,   caption: "Commercial" },
    { image: PHOTOS["arbres-01"].src,       alt: PHOTOS["arbres-01"].alt,       caption: "Arbres et arbustes" },
    { image: PHOTOS["arbres-02"].src,       alt: PHOTOS["arbres-02"].alt,       caption: "Arbres et arbustes" },
  ],
};

// 6 vignettes pour l'aperçu portfolio sur l'accueil.
export const homePortfolio = HOME_PORTFOLIO_INDICES.map((i) => noelPage.gallery[i]);

// --- Formulaire de soumission (7 champs, incl. groupe radio budget) ----------
export const budgetOptions = [
  "1 000 $ et plus",
  "2 000 $ et plus",
  "4 000 $ et plus",
  "Je ne sais pas encore",
];

export const serviceOptions = [
  "Lumière de Noël (résidentiel)",
  "Lumière de Noël (commercial / municipal)",
  "Éclairage architectural permanent",
  "Autre / je ne suis pas certain",
];

// --- Capture des leads (Web3Forms) ------------------------------------------
// Web3Forms = GRATUIT, envois ILLIMITÉS, formulaires illimités, AUCUN compte.
// 1) Va sur https://web3forms.com  2) entre ton courriel  3) copie l'Access Key
// 4) colle-la ci-dessous. UN SEUL endpoint sert TOUT le site (hero + soumission).
// Tant que la clé n'est pas mise : le formulaire SIMULE le succès pour la démo
// mais N'ENVOIE RIEN (clairement signalé en console).
export const WEB3FORMS_ACCESS_KEY = "295b087c-0152-4a3c-854f-edadd1961418";

// Relaie le lead vers le CRM via notre propre route serveur. La clé
// d'intake vit côté serveur uniquement — jamais dans le bundle public.
// Échoue en silence : le CRM ne doit jamais faire perdre un lead à
// Web3Forms, qui reste le chemin de secours.
async function sendLeadToCrm(payload) {
  try {
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok && typeof console !== "undefined") {
      console.warn("[Lumière] CRM intake a répondu", res.status);
    }
  } catch (e) {
    if (typeof console !== "undefined") console.warn("[Lumière] CRM intake indisponible:", e?.message);
  }
}

// Champ honeypot : les bots remplissent tous les champs, y compris ceux
// visuellement cachés. Si _website (ou payload.honeypot) est non vide,
// on retourne "succès" côté client sans rien envoyer — le pourri disparaît
// silencieusement sans alerter le bot.
export const HONEYPOT_FIELD = "_website";

export async function sendLead(payload) {
  if (payload && (payload[HONEYPOT_FIELD] || payload.honeypot)) {
    if (typeof console !== "undefined") console.warn("[Lumière] Honeypot déclenché — envoi ignoré.");
    return true;
  }

  // Toujours tenter le CRM, même en mode démo Web3Forms.
  void sendLeadToCrm(payload);

  if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY === "YOUR_ACCESS_KEY") {
    if (typeof console !== "undefined") {
      console.warn("[Lumière] WEB3FORMS_ACCESS_KEY non configurée — lead NON envoyé (mode démo).", payload);
    }
    await new Promise((r) => setTimeout(r, 600));
    return true; // succès simulé pour la démo
  }
  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        from_name: "Site Solution Lumière de Noël inc.",
        ...payload,
      }),
    });
    const json = await res.json().catch(() => ({}));
    return res.ok && json.success !== false;
  } catch {
    return false;
  }
}
