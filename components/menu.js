// Données du tiroir de navigation mobile (components/TiroirMobile.jsx).
//
// Module pur : ni JSX ni hook. Les villes viennent de `cities` (data.js),
// donc ajouter une zone là-bas la fait apparaître dans le tiroir sans
// toucher ce fichier. Les trois services sont ceux du dropdown de bureau
// (ClientLayout.jsx, desktopNav) — mêmes libellés, mêmes hrefs.
import { cities } from "@/components/data";

export const MENU_SERVICES = [
  { label: "Lumières de Noël — résidentiel", href: "/services/lumieres-de-noel-residentiel" },
  { label: "Lumières de Noël — commercial", href: "/services/lumieres-de-noel-commercial" },
  { label: "Éclairage architectural permanent", href: "/services/eclairage-architectural-permanent" },
];

export const MENU_SECTEURS = cities.map((v) => ({ label: v.name, href: `/secteur/${v.slug}` }));
