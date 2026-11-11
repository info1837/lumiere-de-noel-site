import { getImageProps } from "next/image";
import { CTAButton } from "@/components/ui";
import { ivory, company } from "@/components/data";
import HeroVideo from "@/components/HeroVideo";
import { PHOTOS } from "@/components/photos";
import { MEDIA_PORTRAIT, HERO_MONTAGES, AFFICHE_PAYSAGE } from "@/lib/hero-media";

// Hero d'accueil : une vidéo de nos installations, une phrase, deux portes.
//
// ⚠️ LE FORMULAIRE EST PARTI D'ICI, ET CE N'EST PAS UN OUBLI.
//
// Il y avait une carte de réservation à cinq champs collée au premier
// écran. Un commentaire d'août 2026 défendait ce choix — « un seul
// formulaire sur l'accueil, et c'est celui du hero » — contre un second
// formulaire placé dix sections plus bas. L'argument était bon tant que le
// hero devait convertir tout seul.
//
// La page change de métier : elle doit d'abord faire VOIR. Un service
// haut de gamme ne demande pas un numéro de téléphone avant d'avoir montré
// une maison illuminée. Le formulaire vit maintenant une seule fois, en
// bas (section 8), et sur /soumission. Le hero garde deux portes : réserver
// pour qui est déjà décidé, « voir ma maison illuminée » pour les autres —
// c'est-à-dire presque tout le monde.
//
// Conséquence technique agréable : plus d'état, plus de « use client ».
// Le premier écran est redevenu du HTML.
export default function Hero() {
  // DEUX FORMATS, DEUX AFFICHES (2026-11-11) :
  //   · téléphone / écran vertical : l'image 0 du montage drone, que la
  //     vidéo (HeroVideo.jsx) remplace sans saut une fois la page chargée ;
  //   · le reste : la photo de Mirabel, SEULE, sans vidéo. On n'a qu'un plan
  //     de nuit tourné en paysage — un montage desktop attend les plans du
  //     monteur. Mirabel est nativement 16/9, ligne de toit illuminée en
  //     haut du cadre, et n'est pas dans la vitrine (check-photos le vérifie).
  //
  // L'AFFICHE est l'image LCP. <picture> + getImageProps : next/image
  // découpe toujours la bonne largeur et sert de l'AVIF, et le navigateur
  // ne télécharge que l'affiche de SON format (MEDIA_PORTRAIT, la même
  // requête que la vidéo). `priority` : chargement immédiat, fetchpriority
  // haute — c'est la seule image priority de la page.
  const commun = {
    alt: "Maison illuminée par nos installateurs, la nuit",
    fill: true,
    priority: true,
    sizes: "100vw",
  };
  const { props: { srcSet: srcSetPortrait } } = getImageProps({ ...commun, src: HERO_MONTAGES.portrait.affiche });
  const { props: affiche } = getImageProps({ ...commun, src: PHOTOS[AFFICHE_PAYSAGE].src });
  return (
    <section className="hero-section" style={{ position: "relative" }}>
      {/* L'affiche porte le premier écran ; la vidéo la remplace, sur la
          même image, une fois la page chargée. */}
      <picture>
        <source media={MEDIA_PORTRAIT} srcSet={srcSetPortrait} sizes="100vw" />
        <img {...affiche} style={{ ...affiche.style, objectFit: "cover" }} />
      </picture>
      {/* Vraies installations filmées au drone, un seul montage par
          visiteur (HeroVideo.jsx). */}
      <HeroVideo />
      {/* Deux voiles, deux rôles : l'un rend le texte lisible à gauche,
          l'autre fond l'image dans le marine de la section suivante pour
          qu'aucune arête ne coupe la page. Réglés pour des plans de NUIT
          (globals.css, .hero-voile-*) : identiques sur l'affiche et sur la
          vidéo, donc rien ne change quand la vidéo démarre. */}
      <div className="hero-voile-gauche" />
      <div className="hero-voile-bas" />

      <div className="hero-container" style={{ position: "relative", width: "100%" }}>
        <div className="hero-texte">
          <div className="hero-eyebrow">
            Installation clé en main — pose, entretien et retrait inclus
          </div>
          <h1 className="hero-h1" style={{ color: ivory }}>
            Votre maison,<br />illuminée par des professionnels.
          </h1>
          <p className="hero-phrase">
            Conception, installation, entretien et retrait. Un nombre limité de
            propriétés chaque saison.
          </p>

          {/* Deux boutons, deux poids. Le crème décide, le contour
              propose. Trois boutons n'auraient donné aucun choix. */}
          <div className="hero-boutons" data-barre-ancre>
            <CTAButton href="/soumission" variant="creme">Réserver ma date</CTAButton>
            <CTAButton href="/simulateur" variant="outlineCreme">Voir ma maison illuminée</CTAButton>
          </div>

          {/* ⚠️ PLUS DE « 100+ AVIS 5★ CHEZ PALENCIA » (2026-10-14).
              Le site de Lumière n'affiche pas une autre entreprise, même
              attribuée : le compteur partait de 0 (« 0+ avis ») et la ligne
              vendait Palencia en tête de page. La preuve, ce sont les vraies
              réalisations juste en dessous. Une preuve propre à Lumière
              (avis Google de Lumière) reviendra par components/reviews.js. */}
          <p className="hero-ligne">
            <span>3e saison · résidentiel et commercial</span>
            <span>À partir de {company.priceFrom}</span>
            <span>Rive-Nord · Montréal · Rive-Sud</span>
          </p>
        </div>
      </div>
    </section>
  );
}
