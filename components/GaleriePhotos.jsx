import Image from "next/image";
import { flouDe } from "@/components/photos-flou";

// =============================================================================
// Galerie au format NATUREL (2026-11-24) — pages de ville et études de cas
// =============================================================================
// Les images de la saison 2026 viennent de tournages drone VERTICAUX, de
// photos d'appareil et de plans larges du Vieux-Port : un cadrage unique
// (le 4:3 de `Gallery`) en couperait la moitié. Ici chaque image garde ses
// proportions (largeur / hauteur du registre, donc aucun décalage de mise en
// page), dans une grille en colonnes. Toutes en chargement différé (next/image,
// pas de `priority`) : ces galeries sont toujours sous le premier écran.
// L'alt vient du registre (components/medias-2026.js) : ce qu'on a installé,
// et la ville quand la photo est située.
// =============================================================================
export default function GaleriePhotos({ photos, colonnes = 3 }) {
  if (!photos?.length) return null;
  return (
    <ul className="galerie-photos" style={{ "--colonnes": colonnes }}>
      {photos.map((p) => (
        <li key={p.src}>
          <Image
            src={p.src}
            alt={p.alt}
            width={p.largeur}
            height={p.hauteur}
            sizes={`(max-width: 640px) 100vw, (max-width: 1100px) 50vw, ${Math.round(1180 / colonnes)}px`}
            placeholder={flouDe(p.src) ? "blur" : "empty"}
            blurDataURL={flouDe(p.src)}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </li>
      ))}
    </ul>
  );
}
