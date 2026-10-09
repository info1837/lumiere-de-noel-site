import Image from "next/image";
import { CTAButton } from "@/components/ui";
import { ivory, company } from "@/components/data";
import { PHOTOS } from "@/components/photos";

// La fiche Google de PALENCIA SERVICES EXTÉRIEUR — pas de Lumière de Noël.
// Reprise telle quelle de components/ObjectionBar.jsx, qui portait les
// quatre cartes retirées du bas du hero. Elle n'a volontairement pas sa
// place dans components/reviews.js : ce fichier-là décrit les avis de
// Solution Lumière de Noël (encore vides), et y poser la fiche de Palencia
// ferait passer ses avis pour ceux de Lumière dans le JSON-LD.
const AVIS_PALENCIA_URL =
  "https://www.google.com/maps/place/?q=place_id:ChIJmbIPyln3rKoR21twSo9uBis";

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

          {/* ⚠️ LES 100+ AVIS SONT CEUX DE PALENCIA, ET ÇA DOIT RESTER ÉCRIT.
              Solution Lumière de Noël n'a pas encore d'avis publiés
              (components/reviews.js : REVIEWS_PENDING = true, aucun
              aggregateRating émis). Écrire « 100+ avis 5★ » tout court sur
              cette page les attribuerait à Lumière — c'est faux, et c'est
              exactement ce que la barre des objections prend soin de dire
              en toutes lettres depuis le début. Trois mots de plus, et la
              preuve sociale reste vraie. */}
          <p className="hero-ligne">
            {/* La preuve reste VÉRIFIABLE : le lien mène à la fiche Google de
                Palencia. Sans lui, le visiteur devrait croire le chiffre sur
                parole — et la carte qui le portait, avec son lien, vient
                d'être retirée du bas du hero. */}
            <a href={AVIS_PALENCIA_URL} target="_blank" rel="noopener noreferrer">
              100+ avis 5★ chez Palencia
            </a>
            <span>À partir de {company.priceFrom}</span>
            <span>Rive-Nord · Montréal · Rive-Sud</span>
          </p>
        </div>
      </div>
    </section>
  );
}
