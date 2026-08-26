import { company } from "@/components/data";

// Manifeste web — c'est lui qui donne un usage réel à favicon-192.png et
// favicon-512.png du kit logo (Android, écran d'accueil, splash).
// Next.js le sert sur /manifest.webmanifest et injecte tout seul la balise
// <link rel="manifest"> : ne pas l'ajouter à la main dans le <head>.
//
// background_color = #0A1524 (Marine nuit du kit) : c'est exactement la
// couleur de fond des PNG favicon-192/512, donc le splash ne montre aucune
// bordure autour de l'icône. theme_color reste le navy du site (#0B1B2B),
// celui de la barre du navigateur, déjà déclaré dans layout.jsx.
export default function manifest() {
  return {
    name: company.name,
    short_name: "Lumière de Noël",
    description:
      "Installation clé en main de lumières de Noël et d'éclairage " +
      "architectural permanent au Québec — résidentiel, commercial et municipal.",
    lang: "fr-CA",
    start_url: "/",
    display: "standalone",
    background_color: "#0A1524",
    theme_color: "#0B1B2B",
    icons: [
      { src: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
