import Image from "next/image";
import { CTAButton } from "@/components/ui";
import { ivory, company } from "@/components/data";
import { PHOTOS } from "@/components/photos";

// Hero d'accueil : une photo, une phrase, deux portes.
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
// La rangée d'ampoules qui pend sous l'entête du hero. Rendue par le
// serveur, allumée et immobile : elle est là dès la première image, comme
// le reste du premier écran (elle était injectée par JS après
// l'hydratation, puis allumée en cascade). 28 : un nombre pair et rond,
// réparti en `space-between`, qui tombe juste à toutes les largeurs.
const AMPOULES_HERO = 28;
export function GuirlandeHero() {
  return (
    <div className="hero-guirlande" aria-hidden="true">
      {Array.from({ length: AMPOULES_HERO }, (_, i) => <span key={i} />)}
    </div>
  );
}

export default function Hero() {
  // ⚠️ LÉRY A QUITTÉ LE HERO — elle ne sert plus qu'au comparateur.
  //
  // Elle tenait les deux : le hero pleine page ET le côté « après » du
  // comparateur, deux sections plus bas. La même maison deux fois sur un
  // écran laisse croire qu'on n'en a qu'une.
  //
  // Mirabel est choisie sur trois critères, mesurés sur captures
  // (docs/hero/) et pas au jugé :
  //
  //   1. ELLE EST NATIVEMENT 16/9 (1920×1080). Le hero est une bande
  //      paysage pleine largeur : les photos PORTRAIT du dossier —
  //      st-donat-02, ste-anne, terrebonne… — y perdent les deux tiers
  //      de leur cadre. st-donat-02 ne montrait plus qu'une rangée de
  //      conifères et une grande étendue de neige vide, sans maison.
  //   2. LA LIGNE DE TOIT ILLUMINÉE TRAVERSE LE HAUT DU CADRE, donc elle
  //      reste visible à côté du titre, qui repose lui sur le voile
  //      sombre. C'est la demande : le titre lisible ET les lumières
  //      visibles derrière.
  //   3. C'EST UNE MAISON, avec une pose professionnelle sur la
  //      toiture — ce qu'on vend. Les conifères illuminés de
  //      st-donat-02 sont jolis et ne montrent pas le métier.
  //
  // Mirabel est dans le territoire réel (Rive-Nord). Stratford, l'autre
  // paysage disponible, est en Estrie — hors territoire, et le site a
  // déjà eu à corriger ça.
  const photo = PHOTOS["mirabel-01"];
  return (
    <section className="hero-section" style={{ position: "relative" }}>
      {/* La photo porte le premier écran. Elle est pleine page, pas
          illustrative : c'est la seule chose ici qu'on ne peut pas
          inventer. */}
      {/* ⚠️ next/image, PAS un <img>. Mesuré, pas supposé.
          En <img> brut, Lighthouse mobile donnait un LCP de 7,2 s sur
          l'accueil : noel-lery-01.jpg fait 1920×1440 et 358 Ko, servis
          tels quels à un écran de 375 px. `next/image` découpe la bonne
          largeur et sert de l'AVIF — next.config.mjs l'attendait déjà
          (« quand on migrera vers next/image »).
          `fill` + `priority` : c'est l'image LCP, elle ne doit pas être
          paresseuse et elle passe devant le reste de la file. */}
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        priority
        sizes="100vw"
        style={{ objectFit: "cover" }}
      />
      {/* Deux voiles, deux rôles : l'un rend le texte lisible à gauche,
          l'autre fond la photo dans le marine de la section suivante pour
          qu'aucune arête ne coupe la page. */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(10,21,36,0.92) 0%, rgba(10,21,36,0.74) 46%, rgba(10,21,36,0.30) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,21,36,0) 46%, rgba(10,21,36,0.82) 84%, #0A1524 100%)" }} />

      <GuirlandeHero />

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
