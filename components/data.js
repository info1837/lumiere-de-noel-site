// =============================================================================
// Solution Lumière de Noël inc. — données centrales (tokens de marque + contenu)
// -----------------------------------------------------------------------------
// Source de vérité : palette/typo/structure extraites de la spec du site
// Squarespace expiré. Les copies longues marquées DRAFT sont reconstruites
// dans la voix de marque — à remplacer si le texte original est récupéré.
// =============================================================================

// --- Palette — LES QUATRE COULEURS DU KIT, et rien d'autre -------------------
//
// La spec Squarespace d'origine donnait un marine un peu vert (#0B1B2B) et
// un champagne (#E9DCC0). Le kit logo, lui, est déjà en service sur
// /simulateur, dans app/manifest.js et dans tout le CSS du simulateur. Deux
// palettes sur un site, c'est une seule palette mal appliquée : on retient
// celle du kit.
//
//   Marine nuit  #0A1524  fond principal
//   Crème        #F0EADE  texte, bouton primaire
//   Ambre        #F0BA54  LA LUMIÈRE — seul accent
//   Bleu acier   #A2B4CC  texte secondaire, avec parcimonie
//
// ⚠️ L'AMBRE NE SERT PAS DE FOND, NI DE BORDURE, NI DE BOUTON.
// C'est la couleur de ce qu'on vend : la lumière. Une puce qui brille, un
// état actif, une lueur. Dès qu'elle devient un aplat — un bandeau jaune,
// un bouton jaune — elle cesse de signifier « lumière » et se met à
// signifier « avertissement ». Le bouton primaire est CRÈME.
export const marine = "#0A1524";
export const creme = "#F0EADE";
export const ambre = "#F0BA54";
export const acier = "#A2B4CC";

// --- Les anciens noms, maintenant des alias ---------------------------------
// Ils sont importés par une trentaine de fichiers. Les repointer ici fait
// basculer tout le site d'un coup, sans trente diffs qui diraient la même
// chose.
export const navy = marine;          // arrière-plans sombres
export const ivory = creme;          // titres et texte sur fond sombre
export const gold = ambre;           // accent — TEXTE et lueurs seulement
export const charcoal = "#1C1C1C";   // texte sur fond clair
export const offWhite = "#FAFAFA";   // arrière-plans clairs (pages internes)
export const heroScrim = "rgba(5,10,20,0.82)"; // voile sur image hero

// Dérivés utilitaires (contraste / états)
export const navyDeep = "#060E18";
// ⚠️ L'ambre #F0BA54 sur fond clair ne passe PAS le AA (2,0:1). Ce brun doré
// est sa doublure pour le texte sur fond clair.
//
// ⚠️ ASSOMBRI DE #8A6A1C À #7A5E17, ET C'EST MESURÉ.
// L'ancienne valeur avait été réglée sur #FAFAFA (4,84:1, juste au-dessus
// du seuil). La section de réservation est maintenant sur le CRÈME du kit
// (#F0EADE), plus sombre : le même brun n'y donnait plus que 4,21:1, donc
// SOUS le minimum AA — Lighthouse l'a signalé sur l'accueil. La nouvelle
// valeur passe sur les deux fonds : 5,09:1 sur crème, 5,85:1 sur #FAFAFA.
// Ne pas l'éclaircir sans revérifier les DEUX.
export const goldText = "#7A5E17";
export const line = "rgba(240,234,222,0.20)"; // séparateurs sur fond sombre
export const textMuted = "#5A5A5A";

// --- Coordonnées de l'entreprise ---------------------------------------------
// Domaine de Solution Lumière de Noël Inc. — SOURCE UNIQUE pour les adresses
// courriel. Domaine actif depuis le 2026-08-25 (remplace lumieredenoelinc.ca).
// L'origine du site (baseUrl) est résolue via lib/site-url.js pour supporter
// les previews Vercel et un override par variable d'environnement.
import { getSiteUrl } from "@/lib/site-url";
import { PHOTOS, cityVisuel, legendeVisuel, servicePhoto } from "@/components/photos";
import { lireUtm } from "@/lib/utm";

const DOMAIN = "lumieredenoelinc.com";

export const company = {
  // Raison sociale EXACTE, telle qu'enregistrée et telle qu'affichée sur
  // la fiche Google Business — une divergence de nom est un signal local
  // négatif. shortName existe pour l'affichage court.
  name: "Solution Lumière de Noël inc.",
  shortName: "Lumière de Noël",
  // Suffixe des <title> : la raison sociale complète mange 30 caractères
  // sur les 60 que Google affiche. « inc. » ne sert à rien dans la SERP,
  // il reste dans le JSON-LD et le pied de page (SEO P0 §5.1).
  titleSuffix: "Solution Lumière de Noël",
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
  // Comptes publics RÉELS, vérifiés le 2026-10-14 (page Facebook « Lumière
  // de Noël inc. | Blainville QC », Instagram @lumieredenoelinc). Lus par
  // le pied de page ET par le `sameAs` du JSON-LD (components/reviews.js) :
  // un seul endroit à changer.
  social: {
    instagram: { label: "Instagram", handle: "@lumieredenoelinc", href: "https://www.instagram.com/lumieredenoelinc/" },
    facebook: { label: "Facebook", handle: "Lumière de Noël inc.", href: "https://www.facebook.com/profile.php?id=61594775012079" },
  },
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
  { label: "Estimer mon projet", href: "/calculatrice" },
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
  // Troisième carte : la grille de l'accueil est en 3 colonnes. Depuis le
  // retrait du volet municipal elle n'en avait plus que deux, et la troisième
  // colonne restait vide. L'éclairage permanent est un vrai service, avec sa
  // page et ses photos — il remplit la colonne honnêtement, et c'est le seul
  // des trois qui se vend toute l'année.
  {
    key: "permanent",
    title: "Éclairage permanent",
    image: PHOTOS["permanent-01"].src,
    imageAlt: PHOTOS["permanent-01"].alt,
    bullets: [
      "Pastilles DEL discrètes sous les soffites — invisibles le jour",
      "Couleurs et animations par application, installé une seule fois",
    ],
  },
];

// --- « Pourquoi nous choisir ? » 4 cartes (accueil, section 4) ---------------
// DRAFT COPY — reconstruite
export const whyUs = [
  {
    title: "Clé en main",
    desc: "On conçoit, installe, entretient et désinstalle. Un seul interlocuteur, du premier croquis au retrait de janvier.",
  },
  {
    title: "Matériel commercial",
    desc: "Lumières DEL de qualité commerciale, durables et écoénergétiques — fournies par nous.",
  },
  {
    // ⚠️ ASSURANCE — la police est ACTIVE depuis le 2026-09-29, confirmé
    // par Yahir en une ligne (« Assurance Lumière : yes »). La consigne du
    // 2026-08-30 disait de ne pas écrire « assurée » avant son entrée en
    // vigueur ; elle est levée, et tous les marqueurs // ASSURANCE du dépôt
    // le disent maintenant.
    //
    // Si la police s'interrompait, il faudrait repasser sur CHACUN d'eux :
    // c'est pour ça qu'ils gardent leur étiquette.
    //
    // « Vous ne montez jamais dans l'échelle » vendait le CONFORT : la
    // corvée qu'on s'épargne. Le nouveau titre vend la COMPÉTENCE, et le
    // fond ne bouge pas — sécurité, équipement, assurance.
    title: "Travail en hauteur, par des professionnels assurés",
    desc: "Échelles et équipement de sécurité fournis, équipe formée pour la hauteur, et notre assurance couvre le chantier. Un toit en décembre n'est pas un endroit pour improviser.",  // ASSURANCE
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
    a: "Pour les lumières saisonnières, oui : le retrait est inclus. Nous planifions la désinstallation en janvier et entreposons le matériel jusqu'à la prochaine saison. L'éclairage architectural permanent, lui, reste en place toute l'année : rien à retirer.",
  },
  {
    q: "Que se passe-t-il si une lumière brûle pendant la saison ?",
    a: "Pour les lumières saisonnières, le service après-vente est inclus : un appel et on repasse sans frais, autant de fois qu'il le faut, de la pose au retrait. L'éclairage permanent est garanti 10 ans.",
  },
  {
    q: "Faites-vous aussi de l'éclairage permanent ?",
    a: "Oui. Des pastilles DEL discrètes, installées une seule fois sous les soffites, allumées toute l'année et réglées par application (couleurs, scènes, minuteries). Garantie 10 ans, prix sur soumission.",
  },
  {
    q: "Quelles régions desservez-vous ?",
    a: "La Rive-Nord, Montréal et la Rive-Sud — la liste des villes desservies est juste sous ces questions.",
  },
];

// --- « Comment ça marche » — 6 étapes datées (accueil + /services) -----------
// Datées pour répondre à "qu'est-ce qui se passe après que j'envoie le formulaire"
// dans les 3 premières secondes.
// `court` : l'étiquette d'UN MOT pour la frise de l'accueil. Les cinq
// cartes sont devenues cinq points sur une ligne, et « Retrait et
// entreposage » sous un point de 10 px se replie sur trois lignes.
// Le titre long reste : /services l'affiche encore en cartes.
// ⚠️ LE VRAI PARCOURS (2026-10-14). Le site promettait une « visite
// d'évaluation sous 3–5 jours » et une « réponse sous 24 h ». Ce qui se
// passe vraiment : Sophie B écrit par texto en moins d'une minute (de 8 h à
// 20 h 30 — heures calmes du CRM), fixe un APPEL avec Yahir (avant-midi ou
// après-midi), la toiture se mesure sur Google Maps, et le prix ferme suit
// par écrit. Aucune visite. Le site dit maintenant la même chose que Sophie.
export const processSteps = [
  { num: "01", title: "Réponse par texto", court: "Texto", when: "En moins d'une minute", desc: "Dès l'envoi du formulaire, on vous écrit par texto pour confirmer votre adresse et fixer un court appel (de 8 h à 20 h 30)." },
  { num: "02", title: "Appel avec Yahir", court: "Appel", when: "À votre choix", desc: "Quelques minutes au téléphone, en avant-midi ou en après-midi : ce que vous voulez illuminer, vos goûts. On mesure votre toiture sur Google Maps — pas besoin de visite." },
  { num: "03", title: "Prix ferme, écrit", court: "Prix ferme", when: "Après l'appel", desc: "Vous recevez un prix ferme, par écrit. Vous décidez, puis on réserve votre date." },
  { num: "04", title: "Installation", court: "Installation", when: "Octobre–novembre", desc: "Notre équipe installe tout en sécurité avant la date convenue — matériel professionnel fourni." },
  { num: "05", title: "Entretien pendant la saison", court: "Entretien", when: "Décembre", desc: "Une lumière qui brûle ? Un appel et on repasse sans frais. Service après-vente inclus." },
  { num: "06", title: "Retrait et entreposage", court: "Retrait", when: "Janvier", desc: "Lumières saisonnières : on désinstalle après les Fêtes et on garde le matériel chez nous jusqu'à la prochaine saison. Rien à ranger." },
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
    seoTitle: "Lumières de Noël résidentielles",
    h1: "Installation de lumières de Noël résidentielles",
    kicker: "Service résidentiel clé en main",
    heroImage: servicePhoto("lumieres-de-noel-residentiel").src,
    heroImageAlt: servicePhoto("lumieres-de-noel-residentiel").alt,
    metaDescription:
      "Conception, pose, entretien et retrait de vos lumières de Noël, matériel DEL commercial fourni. À partir de 1 000 $, prix ferme avant l'installation.",
    intro:
      "On illumine votre maison comme si c'était la nôtre. Toiture, arbres, arbustes, façade et entrée — un design pensé pour votre propriété, installé par notre équipe, retiré après les Fêtes.",
    bullets: [
      "Toiture, corniches, arbres, arbustes et façade",
      "DEL commerciales blanc-chaud ou multicolores",
      "Pose, entretien et retrait inclus — travail en hauteur par une équipe assurée",  // ASSURANCE
      "Rappels sans frais et illimités, de la pose au retrait",
    ],
    body: "On mesure votre toiture sur Google Maps, on en parle avec vous au téléphone et on propose un design qui met votre maison en valeur. Le matériel — guirlandes DEL de qualité commerciale, attaches, minuteries — est fourni et installé en sécurité, conformément aux pratiques d'élagage et de hauteur. En janvier, on revient tout retirer et on entrepose le matériel jusqu'à la prochaine saison.",
    // Une question de SERVICE pour les pages ville × service (la ville
    // fournit les autres, voir `villesBrutes[].faq`).
    // Gabarit de service (partie 3) : la bande de 3 photos réelles, ce qui
    // est compris, la paire avant/après quand une VRAIE existe pour ce
    // service, et une FAQ de 5 questions au plus.
    bande: ["blainville-01", "montreal-01", "mercier-01"],
    paire: "avant-ste-julienne",
    compris: {
      texte: "On fournit le matériel professionnel, on l'installe en sécurité, on l'entretient pendant la saison et on le retire après les Fêtes.",
      items: ["Conception sur mesure", "Installation par notre équipe", "Rappels illimités pendant la saison", "Retrait + entreposage inclus"],
      prix: "À partir de 1 000 $",
      prixNote: "prix ferme, écrit",
    },
    faq: [
      { q: "Fournissez-vous les lumières?", a: "Oui, tout le matériel : lumières DEL de qualité commerciale, attaches et minuteries. Rien à acheter de votre côté." },
      { q: "Est-ce que vous montez sur le toit?", a: "Oui, c'est notre métier : le travail en hauteur est fait par une équipe formée et assurée. Vous n'avez pas à sortir l'échelle." },
      { q: "Combien ça coûte?", a: "À partir de 1 000 $ pour une résidence, pose, entretien et retrait inclus. Le prix dépend de la hauteur, de la longueur de toiture et du nombre d'arbres ; il est confirmé par écrit après un court appel." },
      { q: "Et si une lumière brûle en décembre?", a: "Un appel et on repasse sans frais, autant de fois qu'il le faut, de la pose au retrait." },
      { q: "Qui enlève les lumières après les Fêtes?", a: "Nous. Le retrait est inclus en janvier, et on entrepose le matériel jusqu'à la prochaine saison." },
    ],
    faqService: { q: "Est-ce que vous montez sur le toit?", a: "Oui, c'est notre métier : le travail en hauteur est fait par une équipe formée et assurée. Vous n'avez pas à sortir l'échelle." },
  },
  {
    slug: "lumieres-de-noel-commercial",
    title: "Lumières de Noël — Commercial",
    seoTitle: "Lumières de Noël commerciales",
    h1: "Installation de lumières de Noël commerciales",
    kicker: "Pour vos commerces et bureaux",
    heroImage: servicePhoto("lumieres-de-noel-commercial").src,
    heroImageAlt: servicePhoto("lumieres-de-noel-commercial").alt,
    metaDescription:
      "Façades, vitrines et entrées illuminées pour les Fêtes. Installation hors des heures d'ouverture, entretien inclus, retrait en janvier. Sur soumission.",
    intro:
      "Façades, vitrines, marquises, entrées — on attire l'œil et la clientèle. Planification hors-heures pour ne pas nuire à vos opérations, et le travail en hauteur fait par notre équipe, formée et assurée.",  // ASSURANCE
    bullets: [
      "Façades, vitrines, marquises, entrées",
      "Planification hors-heures (soir / nuit) si requis",
      "Travail en hauteur par une équipe formée et assurée",  // ASSURANCE
      "Maintenance pendant la saison incluse",
    ],
    body: "Restaurants, hôtels, bureaux, centres commerciaux, concessionnaires : conception personnalisée selon votre image de marque, échéancier respecté à la lettre, et un seul interlocuteur du début à la fin. Devis détaillé et un nombre limité de propriétés chaque saison.",
    // La chocolaterie du hero, sous un autre angle. Les conifères qui
    // complétaient la bande sont des chantiers RÉSIDENTIELS (l'un est à
    // Saint-Donat) : ils n'ont rien à faire sur la page commerciale.
    bande: ["commercial-02"],
    paire: null,
    compris: {
      texte: "Façades, vitrines, entrées et arbres : on conçoit, on installe hors de vos heures d'ouverture, on entretient et on retire en janvier.",
      items: ["Conception pour votre façade et vos entrées", "Installation hors des heures d'ouverture", "Entretien inclus pendant la saison", "Retrait en janvier"],
      prix: "Sur soumission",
      prixNote: "attestation d'assurance sur demande",
    },
    faq: [
      { q: "Installez-vous en dehors de nos heures d'ouverture?", a: "Oui. La pose se planifie hors des heures d'ouverture, pour que vos clients ne voient que le résultat." },
      { q: "Avez-vous une assurance responsabilité?", a: "Oui, en vigueur toute la saison. On transmet l'attestation à votre gestionnaire ou à votre service des achats sur demande." },
      { q: "Combien coûte un projet commercial?", a: "C'est sur soumission : le prix dépend de la hauteur du bâtiment, de l'accès à l'électricité et de l'envergure du design. Il est confirmé par écrit après un court appel." },
      { q: "L'entretien est-il compris?", a: "Oui. Une section tombe ou une lumière brûle : un appel et on repasse sans frais pendant toute la saison." },
      { q: "Qui retire l'installation?", a: "Nous, en janvier. Le retrait fait partie du service." },
    ],
    faqService: { q: "Avez-vous une assurance responsabilité?", a: "Oui, en vigueur toute la saison. On transmet l'attestation à votre gestionnaire ou à votre service des achats sur demande." },
  },
  {
    slug: "eclairage-architectural-permanent",
    title: "Éclairage architectural permanent",
    seoTitle: "Éclairage architectural permanent",
    h1: "Éclairage architectural permanent (DEL)",
    kicker: "Installé une seule fois — illuminé toute l'année",
    heroImage: servicePhoto("eclairage-architectural-permanent").src,
    heroImageAlt: servicePhoto("eclairage-architectural-permanent").alt,
    metaDescription:
      "Pastilles DEL discrètes sous les soffites, installées une seule fois. Couleurs et animations par application, pour toutes les fêtes de l'année.",
    intro:
      "Des pastilles DEL fixées discrètement sous les soffites et les corniches : invisibles le jour, programmables le soir. Blanc-chaud pour le quotidien, couleurs et animations pour chaque occasion — Halloween, Noël, Saint-Valentin, Saint-Jean.",
    bullets: [
      "DEL discrètes, invisibles le jour",
      "Des millions de couleurs et animations via l'application",
      "Contrôle par zones, minuteries et scènes prédéfinies",
      "Garantie 10 ans",
    ],
    body: "L'éclairage architectural permanent élimine la pose annuelle : un seul investissement et votre propriété change de visage à chaque fête. La technologie DEL utilisée est basse consommation et conçue pour résister aux hivers québécois. La plupart des résidences sont installées en une seule journée.",
    // La maison aux trois ambiances a sa carte animée juste au-dessus
    // (SectionAmbiances) : la bande garde ce qui n'y est pas.
    bande: ["permanent-detail", "permanent-03"],
    ambiances: true,
    paire: null,
    compris: {
      texte: "Des pastilles DEL fixées une seule fois sous les soffites, et une application pour tout le reste de l'année.",
      items: ["Pastilles DEL discrètes, invisibles le jour", "Couleurs et animations par application", "Contrôle par zones, minuteries et scènes", "Installé une seule fois, allumé toute l'année", "Garantie 10 ans"],
      prix: "Sur soumission",
      prixNote: "prix ferme, écrit",
    },
    faqService: { q: "Est-ce que les pastilles se voient le jour?", a: "Très peu. Elles épousent la couleur du soffite ; on remarque l'éclairage seulement une fois allumé." },
    // ⚠️ FUSION DE /eclairage-architectural (partie 2, octobre 2026).
    // Deux pages se disputaient le même sujet, avec le même titre. Ce que
    // l'ancienne avait de mieux vit maintenant ici : la démo de
    // l'application, le gros plan des pastilles (en tête de `bande`), la FAQ. L'ancienne URL
    // redirige en 308 (next.config.mjs).
    appDemo: true,
    faq: [
      { q: "Est-ce que les lumières sont visibles le jour ?", a: "Très peu. Les pastilles épousent la couleur du soffite et restent discrètes ; on remarque l'éclairage seulement une fois allumé." },
      { q: "Puis-je changer les couleurs moi-même ?", a: "Oui. Tout se contrôle depuis une application : couleurs, zones, animations, minuteries et scènes pour chaque fête." },
      { q: "Combien de temps dure l'installation ?", a: "La plupart des résidences se font en une seule visite, selon la dimension et l'architecture du bâtiment." },
      { q: "Est-ce que le système résiste à l'hiver québécois ?", a: "Oui. Les composantes sont conçues pour l'extérieur et les écarts de température du Québec." },
      { q: "Qu'arrive-t-il en cas de bris ?", a: "Le système est garanti 10 ans : un appel et on repasse. Rien n'est retiré en janvier — l'installation reste en place toute l'année." },
    ],
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
      "Lumières de Noël à Blainville : conception, pose, entretien et retrait inclus. À partir de 1 000 $, un nombre limité de propriétés chaque saison.",
    intro:
      "Blainville est au cœur de notre territoire. De Fontainebleau au Plateau, de Chambéry à Notre-Dame — on connaît les rues et les styles d'architecture du secteur.",
    body: "On planifie le secteur Blainville–Boisbriand–Sainte-Thérèse ensemble, pour limiter les déplacements — réserver tôt garantit votre date avant les premières neiges. Le retrait en janvier est inclus, et le matériel reste de qualité commerciale.",
    // ⚠️ DU VRAI LOCAL, PAS UN GABARIT (partie 2). Les pages de ville
    // partageaient ~43 % de leur texte (5-grammes, Blainville vs Laval) et
    // leurs FAQ étaient générées (« Faites-vous l'installation de lumières de
    // noël — résidentiel à Blainville? »). Chaque ville porte maintenant :
    //   local      — 1-2 lignes sur la ville elle-même (quartiers, bâti)
    //   parService — une ligne locale par service (pages ville × service)
    //   faq        — les questions qu'une personne poserait, à elle seule
    // RIEN d'inventé sur des clients, des chiffres ou des avis : les prix et
    // promesses sont ceux que le site affirme déjà partout.
    local: [
      "Le parc résidentiel de Blainville, c'est beaucoup de bungalows et de cottages, et des quartiers plus récents comme Fontainebleau, où l'on voit des toits plats et des façades contemporaines.",
      "Une longue ligne de toit dégagée se prête à une guirlande continue ; un toit à plusieurs pignons demande plus de points d'attache, et un toit plat se souligne par sa bordure.",
    ],
    parService: {
      residentiel: "Bungalow, cottage ou maison contemporaine de Fontainebleau : la guirlande suit votre ligne de toit, qu'elle soit simple, à pignons ou plate.",
      commercial: "Commerces du boulevard du Curé-Labelle et des parcs d'affaires de Blainville : on installe en dehors de vos heures d'ouverture.",
      permanent: "Sur une maison récente aux soffites continus, les pastilles courent d'un bout à l'autre de la façade et disparaissent le jour.",
    },
    faq: [
      { q: "Installez-vous à Blainville?", a: "Oui, partout à Blainville — Fontainebleau, Chambéry, le Plateau, Notre-Dame. On planifie Blainville avec Boisbriand et Sainte-Thérèse, dans la même tournée." },
      { q: "Combien coûte une maison à Blainville?", a: "À partir de 1 000 $ pour une résidence, pose, entretien et retrait inclus. Un bungalow avec une ligne de toit simple reste près de ce tarif ; un cottage à deux étages ou un toit à plusieurs pignons demande plus de matériel et de temps. Le prix exact est confirmé après un court appel." },
      { q: "Mon toit est plat. Est-ce que ça se fait?", a: "Oui. Sur un toit plat, on souligne la bordure de la toiture, et on illumine souvent les colonnes et les arbres de la façade pour donner du relief." },
      { q: "Quand faut-il réserver à Blainville?", a: "Idéalement en octobre. Comme Blainville se planifie avec Boisbriand et Sainte-Thérèse, réserver tôt vous laisse choisir votre date dans la tournée du secteur." },
    ],
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
    local: [
      "Terrebonne réunit le Vieux-Terrebonne, ses maisons anciennes et ses façades patrimoniales, et des quartiers plus récents à Lachenaie et La Plaine, où dominent les cottages et les maisons de ville.",
    ],
    parService: {
      residentiel: "Maison de ville à façade étroite ou cottage sur un grand terrain : on dose la guirlande selon ce qui se voit de la rue.",
      commercial: "Restaurants et boutiques du Vieux-Terrebonne, commerces de Lachenaie : installation hors des heures d'ouverture, pour ne rien déranger.",
      permanent: "Les cottages et maisons de ville de Lachenaie et La Plaine ont souvent de longs soffites continus : les pastilles s'y fondent le jour.",
    },
    faq: [
      { q: "Allez-vous jusqu'à La Plaine et Lachenaie?", a: "Oui. Tout Terrebonne : le Vieux-Terrebonne, Lachenaie, La Plaine et les secteurs entre les deux." },
      { q: "Combien coûte une maison à Terrebonne?", a: "À partir de 1 000 $, pose, entretien et retrait inclus. Une maison de ville à façade étroite reste près de ce tarif ; un cottage avec de grands arbres à enrubanner demande plus de matériel. Le prix exact suit un court appel." },
      { q: "J'habite une maison ancienne dans le Vieux-Terrebonne. Vous installez quand même?", a: "Oui. Le design se décide avec vous à la consultation : sur une façade patrimoniale, on souligne ses lignes plutôt que de la couvrir." },
      { q: "J'ai beaucoup d'arbres. Est-ce compris?", a: "Les arbres et les arbustes font partie du service, au même titre que la toiture. Chaque arbre enrubanné ajoute du matériel et du temps : on en tient compte dans le prix, devant vous." },
    ],
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
    local: [
      "Saint-Jérôme regroupe depuis 2002 les anciennes municipalités de Bellefeuille, Lafontaine et Saint-Antoine : des terrains souvent plus grands qu'en banlieue proche, et des arbres matures en façade.",
    ],
    parService: {
      residentiel: "À Bellefeuille et Lafontaine, les grands arbres en façade s'enrubannent avec la ligne de toit : c'est souvent eux qu'on voit de la rue.",
      commercial: "Centre-ville, rue Saint-Georges et commerces des grands axes de Saint-Jérôme : installation hors des heures d'ouverture.",
      permanent: "Sur les grandes façades de Bellefeuille ou de Lafontaine, les pastilles suivent toute la ligne de toit et se commandent par zones.",
    },
    faq: [
      { q: "Venez-vous à Bellefeuille et Saint-Antoine?", a: "Oui, dans tous les secteurs de Saint-Jérôme : le centre-ville, Bellefeuille, Lafontaine et Saint-Antoine." },
      { q: "Combien coûte une maison à Saint-Jérôme?", a: "À partir de 1 000 $, pose, entretien et retrait inclus. Sur un grand terrain, ce sont surtout les arbres à enrubanner qui font varier le prix. Le montant exact est confirmé après un court appel." },
      { q: "La neige arrive tôt ici. Est-ce trop tard en novembre?", a: "Pas forcément : on planifie Saint-Jérôme avant les secteurs plus au sud, justement à cause de la neige. Mais les dates partent vite, et octobre reste le plus sûr." },
      { q: "Pouvez-vous enrubanner de grands arbres?", a: "Oui. Arbres et arbustes font partie du service, travaillés par une équipe formée pour le travail en hauteur." },
    ],
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
    local: [
      "Laval, ce sont quatorze anciennes municipalités devenues des quartiers, chacun avec son caractère : Chomedey et Vimont plus denses, avec beaucoup de bungalows et de duplex, d'autres secteurs plus aérés vers la rivière des Mille Îles.",
    ],
    parService: {
      residentiel: "Bungalow de Vimont, duplex de Chomedey ou grande maison au bord de la rivière : le design part de votre façade, pas d'un modèle.",
      commercial: "Restaurants, concessionnaires et bureaux du boulevard des Laurentides et le long de l'autoroute 15 : on pose quand vos portes sont fermées.",
      permanent: "Sur un duplex, les pastilles peuvent couvrir toute la façade, et chaque zone se règle séparément dans l'application.",
    },
    faq: [
      { q: "Installez-vous partout à Laval?", a: "Oui, sur toute l'île Jésus : Sainte-Dorothée, Sainte-Rose, Chomedey, Fabreville, Vimont, Saint-François et les autres quartiers." },
      { q: "Combien coûte une maison à Laval?", a: "À partir de 1 000 $, pose, entretien et retrait inclus. Un bungalow reste près de ce tarif ; une grande propriété de Sainte-Dorothée avec plusieurs arbres demande plus. Le prix exact suit un court appel." },
      { q: "J'ai un duplex. Vous l'illuminez au complet?", a: "Oui, toute la façade ou seulement votre partie. Si le bâtiment est partagé, on en parle avec les deux propriétaires à la consultation." },
      { q: "Faites-vous les commerces du boulevard des Laurentides?", a: "Oui : restaurants, concessionnaires, bureaux. On installe en dehors de vos heures d'ouverture." },
    ],
  },
  {
    slug: "montreal",
    name: "Montréal",
    regionLabel: "Île de Montréal",
    metaDescription:
      "Lumières de Noël à Montréal — Plateau, Outremont, Westmount, Ahuntsic, Rosemont. Résidentiel et commercial, places limitées chaque saison.",
    intro:
      "Sur l'île, on installe partout : Outremont, Westmount, le Plateau, Ahuntsic, Rosemont, NDG, Côte-des-Neiges. Façades patrimoniales, duplex et triplex, copropriétés — on adapte le design à votre style architectural.",
    body: "Les ruelles montréalaises et les façades en rangée demandent une approche différente des grands terrains de banlieue : davantage d'attention aux corniches, balcons et alignements de fenêtres. Les contraintes urbaines — stationnement, accès, hauteur — font partie du travail.",
    local: [
      "À Montréal, une grande partie des maisons sont des plex — duplex, triplex — avec escaliers extérieurs, balcons et corniches en façade, souvent collés au voisin.",
    ],
    parService: {
      residentiel: "Plex du Plateau et de Rosemont, cottages d'Ahuntsic, maisons d'Outremont : chaque façade a son design, pas un modèle répété.",
      commercial: "Vitrines de rues commerçantes, restaurants, bureaux : installation hors des heures d'ouverture, stationnement et accès prévus d'avance.",
      permanent: "Sur la corniche d'un plex, les pastilles suivent la ligne du toit plat et restent discrètes le jour.",
    },
    faq: [
      { q: "Installez-vous sur un triplex?", a: "Oui. Sur un plex, on illumine la corniche, les balcons et les garde-corps de l'escalier : c'est ce qui se voit de la rue, puisque le toit est plat." },
      { q: "Combien coûte un plex à Montréal?", a: "À partir de 1 000 $, pose, entretien et retrait inclus. Une façade de plex est étroite mais haute : le prix dépend surtout de la hauteur et du nombre de balcons. Il est confirmé après un court appel." },
      { q: "Et le stationnement, dans une rue étroite?", a: "On s'en occupe. Stationnement, accès et hauteur font partie du travail en ville, et on les prévoit avant de venir." },
      { q: "J'habite un condo. Est-ce possible?", a: "Oui, avec l'accord du syndicat de copropriété : la façade est une partie commune. On en parle ensemble à la consultation." },
    ],
  },
  {
    slug: "rive-sud",
    name: "Rive-Sud",
    regionLabel: "Rive-Sud de Montréal",
    metaDescription:
      "Lumières de Noël sur la Rive-Sud : Brossard, Longueuil, Boucherville, Saint-Bruno, Saint-Lambert. Pose et retrait inclus, à partir de 1 000 $.",
    intro:
      "On dessert toute la Rive-Sud : Brossard, Longueuil, Boucherville, Saint-Bruno, Saint-Lambert, Saint-Hubert, La Prairie, Candiac. Résidentiel et commercial, du DIX30 aux quartiers résidentiels patrimoniaux.",
    body: "On dessert la couronne sud rapprochée. Pour les commerces des grandes artères, on planifie les installations hors-heures. Pour les résidences : développements récents comme quartiers établis (vieux Longueuil, vieux Boucherville).",
    local: [
      "La Rive-Sud s'étend de Saint-Lambert, au bord du fleuve, jusqu'à Saint-Bruno, au pied du mont, en passant par les grands quartiers résidentiels de Brossard.",
    ],
    parService: {
      residentiel: "Bungalow, cottage ou maison de ville : un design par maison, jamais le même d'une rue à l'autre.",
      commercial: "Vitrines du boulevard Taschereau, commerces de Brossard ou de Longueuil : la pose se fait le soir ou tôt le matin, jamais pendant vos heures.",
      permanent: "Dans les développements récents de Brossard, Candiac ou La Prairie, les soffites continus se prêtent bien aux pastilles permanentes.",
    },
    faq: [
      { q: "Allez-vous à Brossard, Longueuil et Boucherville?", a: "Oui, et aussi à Saint-Bruno, Saint-Lambert, Saint-Hubert, La Prairie et Candiac." },
      { q: "Combien coûte une maison sur la Rive-Sud?", a: "À partir de 1 000 $, pose, entretien et retrait inclus. Le prix varie avec la hauteur, la longueur de toiture et le nombre d'arbres, et il est confirmé après un court appel." },
      { q: "Si une lumière brûle, vous traversez le pont?", a: "Oui. Les rappels sont sans frais et illimités de la pose au retrait, sur la Rive-Sud comme ailleurs." },
      { q: "Mon commerce est sur le boulevard Taschereau. Vous installez la nuit?", a: "Oui, hors des heures d'ouverture, pour que vos clients ne voient que le résultat." },
    ],
  },
];

// La photo d'une ville vient UNIQUEMENT du registre (components/photos.js).
// `image`/`imageAlt` valent null quand aucune vraie photo n'existe pour cette
// ville — les pages n'affichent alors aucune image, jamais celle d'ailleurs.
// ⚠️ Chaque zone a une image (check-photos casse le build sinon) : sa
// propre photo, ou son VISUEL (components/photos.js → CITY_VISUEL) — une
// photo d'une ville de la zone, ou une générique qui ne nomme aucun lieu.
// `legende` n'existe que si la photo est vraiment située : sous une
// générique, on n'écrit RIEN (jamais « Laval » sous des conifères d'ailleurs).
export const cities = villesBrutes.map((v) => {
  const ph = cityVisuel(v.slug);
  return { ...v, image: ph?.src ?? null, imageAlt: ph?.alt ?? null, legende: legendeVisuel(v.slug, v.name) };
});

// La clé courte d'un service, pour `villesBrutes[].parService`.
export const cleService = (slug) =>
  slug.includes("commercial") ? "commercial" : slug.includes("permanent") ? "permanent" : "residentiel";

// La FAQ d'une page ville × service : deux questions de LA ville, une du
// service. Pour le commercial, la question de ville qui parle de commerce
// passe devant quand il y en a une.
export function faqVilleService(ville, service) {
  const [couverture, prix, ...autres] = ville.faq;
  const cle = cleService(service.slug);
  const locale = cle === "commercial"
    ? (autres.find((f) => /commerce|boulevard/i.test(f.q)) || autres[0])
    : autres[0];
  return [couverture, ...(cle === "residentiel" ? [prix] : []), locale, service.faqService].filter(Boolean);
}

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
    seoTitle: "Prix des lumières de Noël au Québec 2026",
    excerpt:
      "Tarifs réels par type de propriété, ce qui fait varier le prix, et quand réserver pour économiser. Guide pratique pour résidences et commerces.",
    metaDescription:
      "Combien coûte l'installation de lumières de Noël au Québec ? Tarifs par type de propriété, ce qui fait varier le prix, et quand réserver.",
    image: PHOTOS["blainville-01"].src,
    imageAlt: PHOTOS["blainville-01"].alt,
    date: "2026-08-01",
    readingTime: "6 min",
    tags: ["Tarifs", "Résidentiel", "Commercial"],
  },
  {
    slug: "quand-reserver-installation-lumieres-noel",
    title: "Quand réserver son installation de lumières de Noël?",
    seoTitle: "Quand réserver ses lumières de Noël ?",
    excerpt:
      "Pourquoi octobre est le meilleur moment, ce qui se passe quand vous attendez trop, et comment garantir votre date avant les premières neiges.",
    metaDescription:
      "Quand réserver ses lumières de Noël ? Pourquoi octobre est le bon moment et comment garantir sa date avant les premières neiges.",
    image: PHOTOS["terrebonne-01"].src,
    imageAlt: PHOTOS["terrebonne-01"].alt,
    date: "2026-07-15",
    readingTime: "4 min",
    tags: ["Planification", "Saison"],
  },
  {
    slug: "del-vs-incandescent-lumieres-noel",
    title: "DEL ou incandescent? Quel type de lumières de Noël choisir",
    seoTitle: "DEL ou incandescent : que choisir ?",
    excerpt:
      "Consommation, durée de vie, intensité lumineuse, rendu visuel : tableau comparatif honnête entre les DEL commerciales et les lumières traditionnelles.",
    metaDescription:
      "DEL ou incandescent ? Comparatif honnête : consommation, durée de vie, rendu visuel, et pourquoi les DEL commerciales dominent.",
    image: PHOTOS["permanent-detail"].src,
    imageAlt: "Détail de guirlandes DEL professionnelles sur une corniche",
    date: "2026-08-20",
    readingTime: "5 min",
    tags: ["Matériel", "DEL"],
  },
];

export const findPost = (slug) => blogPosts.find((p) => p.slug === slug);


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
  // « cette saison » était faux dès la saison suivante : les photos sont
  // de 2025. Une phrase qui reste vraie.
  intro:
    "Des installations réalisées par notre équipe, photographiées sur place. Chaque photo indique sa ville.",
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

// --- /realisations : UNE CARTE PAR CHANTIER -----------------------------------
// Voir components/realisations.js (lu aussi par check-photos au build).
export { CHANTIERS, CATEGORIES_CHANTIERS, AMBIANCES_PERMANENT } from "@/components/realisations";

// 6 vignettes pour l'aperçu portfolio — gardé pour /services et les pages
// de ville, qui montrent encore une grille.
export const homePortfolio = HOME_PORTFOLIO_INDICES.map((i) => noelPage.gallery[i]);

// ⚠️ QUATRE photos pour l'accueil, pas six.
//
// Six vignettes en 4/3 sur une largeur de 1180 px donnent des timbres-poste
// de 380 px : à cette taille, une maison illuminée n'est plus une preuve,
// c'est une texture. Quatre photos en deux colonnes font 580 px chacune —
// on voit la ligne de toit, et c'est elle qu'on vend.
//
// Léry est EXCLUE : elle porte maintenant le hero en pleine page. La même
// maison en haut et en vignette plus bas laisse croire qu'on n'en a qu'une.
// Sainte-Julienne est exclue aussi — c'est elle qui tient le curseur de la
// section du simulateur.
//   0 Blainville · 2 Saint-Jérôme · 9 Mercier · 10 Montréal
const HOME_VITRINE_INDICES = [0, 2, 10, 9];
export const homeVitrine = HOME_VITRINE_INDICES.map((i) => noelPage.gallery[i]);

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

// --- Capture des leads --------------------------------------------------
// UN SEUL chemin : notre propre route serveur, qui relaie au CRM avec la
// clé d'intake. Cette clé vit côté serveur uniquement, jamais dans le
// bundle public.
//
// Web3Forms a été RETIRÉ le 2026-09-28. Il servait de relais de courriel
// et il était bloqué par CORS depuis www.lumieredenoelinc.com : chaque
// soumission affichait « Erreur d'envoi » au client alors que le lead
// était bien enregistré. Sa clé d'accès vivait en clair dans le bundle.
//
// Ce que le client déclenche maintenant, sans aucun tiers : la fiche dans
// le CRM, le courriel de nouveau lead au propriétaire, l'ouverture de
// Sophie B, et le Telegram quand elle qualifie le lead en A.
// Le CRM est la SOURCE DE VÉRITÉ : c'est là que le lead vit, que Sophie
// le prend en charge et que la conversion est réelle. Cette fonction rend
// donc true/false, et c'est elle qui décide du succès.
async function sendLeadToCrm(payload) {
  try {
    // ⚠️ LES UTM S'ATTACHENT ICI, PAS DANS CHAQUE FORMULAIRE.
    //
    // Quatre composants appellent sendLead (Hero, QuoteForm, les deux
    // RenewalForm, la calculatrice). Les ajouter formulaire par
    // formulaire, c'est en oublier un au cinquième — et une campagne
    // qui a payé du carton ne serait créditée nulle part.
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, utm: lireUtm() }),
    });
    if (!res.ok && typeof console !== "undefined") {
      console.warn("[Lumière] CRM intake a répondu", res.status);
    }
    return res.ok;
  } catch (e) {
    if (typeof console !== "undefined") console.warn("[Lumière] CRM intake indisponible:", e?.message);
    return false;
  }
}

// Champ honeypot : les bots remplissent tous les champs, y compris ceux
// visuellement cachés. Si _website (ou payload.honeypot) est non vide,
// on retourne "succès" côté client sans rien envoyer — le pourri disparaît
// silencieusement sans alerter le bot.
export const HONEYPOT_FIELD = "_website";

/**
 * Comme sendLead, mais rend aussi l'ID de la fiche créée.
 *
 * Fonction SÉPARÉE à dessein : quatre formulaires appellent sendLead et se
 * contentent d'un booléen. Changer son type de retour, c'est toucher quatre
 * chemins qui marchent pour le besoin d'un cinquième.
 *
 * @returns {Promise<{ok: boolean, id: string|null}>}
 */
export async function sendLeadEtRendreId(payload) {
  if (payload && (payload[HONEYPOT_FIELD] || payload.honeypot)) {
    if (typeof console !== "undefined") console.warn("[Lumière] Honeypot déclenché — envoi ignoré.");
    return { ok: true, id: null };
  }
  try {
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, utm: lireUtm() }),
    });
    const corps = await res.json().catch(() => ({}));
    if (!res.ok && typeof console !== "undefined") console.warn("[Lumière] CRM intake a répondu", res.status);
    return { ok: res.ok, id: corps?.id ?? null };
  } catch (e) {
    if (typeof console !== "undefined") console.warn("[Lumière] CRM intake indisponible:", e?.message);
    return { ok: false, id: null };
  }
}

export async function sendLead(payload) {
  if (payload && (payload[HONEYPOT_FIELD] || payload.honeypot)) {
    if (typeof console !== "undefined") console.warn("[Lumière] Honeypot déclenché — envoi ignoré.");
    return true;
  }

  // Un seul chemin, un seul verdict : le CRM.
  return sendLeadToCrm(payload);
}
