"use client";
import { useRef, useState } from "react";
import Image from "next/image";

// Le curseur qui allume la maison.
//
// ⚠️ CE N'EST PAS UN « AVANT / APRÈS », ET C'EST VOLONTAIRE.
//
// Les 23 photos du dépôt sont TOUTES des photos de soir, prises après
// installation. Il n'existe aucune photo de jour, ni de façade éteinte, de
// la même maison — le dossier /images/demos/ prévu pour ça n'a jamais été
// livré. Fabriquer un « avant » en assombrissant une photo de nuit, puis le
// légender « avant installation », serait exactement le genre
// d'affirmation que ce dépôt traque ailleurs (voir AUDIT-AFFIRMATIONS.md et
// la règle `estReelle` de components/photos.js).
//
// Ce composant montre donc ce qu'il montre vraiment : la MÊME photo, au
// crépuscule puis illuminée. Le geste raconte « voyez la lumière arriver »
// sans prétendre montrer un chantier avant travaux. Le côté sombre est
// obtenu par filtre CSS sur l'image réelle, et les étiquettes le disent.
//
// ⚠️ MISE À JOUR — LA VRAIE PAIRE EXISTE MAINTENANT.
//
// Deux « avant » ont été produits : la même photo, lumières retirées
// (public/images/before-*.jpg, préparés par
// scripts/preparer-avant-apres.mjs aux dimensions EXACTES de leur
// « après »). Quand `photoAvant` est fourni, le filtre crépuscule n'est
// plus rendu du tout et le comparateur montre un vrai avant/après.
//
// Le repli au filtre reste pour les chantiers qui n'ont pas encore leur
// « avant » — et ses étiquettes continuent de dire ce qu'il est.
//
// ⚠️ LES ÉTIQUETTES SONT FOURNIES PAR L'APPELANT quand il y a une vraie
// paire : « Avant (simulation) » dit que le côté gauche est reconstitué,
// « Après — installation réelle, Léry » dit que le droit ne l'est pas.
// La nuance porte toute l'honnêteté du bloc ; la coder en dur ici la
// rendrait invisible aux pages qui l'affichent.
// Au doigt, la couture ne suit qu'au-delà de ce déplacement HORIZONTAL :
// en dessous, c'est peut-être le début d'un défilement vertical.
const SEUIL_DOIGT = 6;

export default function RevelationLumiere({
  photo,                    // { src, alt } — la photo illuminée, RÉELLE
  photoAvant,               // { src, alt } — la simulation « sans lumières »
  legende = null,           // la ville, par exemple
  etiquetteAvant = null,
  etiquetteApres = null,
  // Les alts décrivent l'ÉTAT de chaque moitié. Sans eux on reprend ceux
  // du registre — mais sur l'accueil la photo de Léry porte aussi le
  // hero, et un lecteur d'écran entendrait deux fois la même phrase.
  altAvant = null,
  altApres = null,
  depart = 50,              // position initiale du curseur, en %
  hauteur = "clamp(280px, 58vw, 560px)",
  // Le comparateur en HAUT de page (/concours) : son « après » est le LCP,
  // on le précharge. L'« avant » est chargé tout de suite aussi, mais sans
  // passer devant : deux images prioritaires se disputent la bande
  // passante et retardent toutes les deux le premier affichage.
  prioritaire = false,
  tailles = "(max-width: 900px) 100vw, 900px",
  // Gardé pour les appelants qui le passent : le défilement ne pilote
  // plus jamais la couture (voir plus bas).
  pilote: _pilote = false, // eslint-disable-line no-unused-vars
}) {
  const [position, setPosition] = useState(depart);
  const figure = useRef(null);

  // ⚠️ LE DÉFILEMENT NE PILOTE PLUS LA POIGNÉE (passe « effets sobres »).
  //
  // La couture suivait le défilement de 15 % à 85 % : un `setState` à
  // chaque image pendant que le doigt faisait défiler la page, donc un
  // rendu React (et deux next/image) par frame — le défilement « pas
  // constant » mesuré sur mobile. Le comparateur reste à sa position de
  // départ et ne bouge que sous le doigt, la souris ou le clavier.

  // ⚠️ PENDANT LE GLISSEMENT, ON ÉCRIT LA VARIABLE CSS, PAS L'ÉTAT.
  // Un rendu React par `pointermove` faisait sauter des images sur un
  // téléphone moyen. La couture suit le doigt à la fréquence de l'écran
  // (une écriture par frame au plus) ; l'état n'est mis à jour qu'au
  // relâchement, pour le curseur clavier et les lecteurs d'écran.
  const enCours = useRef(null);   // { v, raf } — la position en attente d'écriture
  const ecrire = (v) => {
    const el = figure.current;
    if (!el) return;
    const t = enCours.current || (enCours.current = { v, raf: 0 });
    t.v = v;
    if (t.raf) return;
    t.raf = requestAnimationFrame(() => {
      t.raf = 0;
      el.style.setProperty("--revel-pos", `${t.v}%`);
    });
  };
  const bouger = (v) => setPosition(v);

  // ⚠️ LE GLISSEMENT SE FAIT AU POINTEUR, SUR TOUT LE CADRE.
  //
  // Avant : un <input type="range"> invisible tendu sur l'image. Sur un
  // téléphone, un range natif ne bouge que si on saisit SON POUCE — et le
  // pouce était invisible. Le défilement réécrivait la valeur à chaque
  // frame par-dessus. Résultat mesuré à 375 px : impossible de glisser, la
  // maison ne bougeait qu'en défilant.
  //
  // Maintenant le cadre écoute les événements pointeur (souris, doigt,
  // stylet, un seul chemin). La poignée suit le X du doigt n'importe où
  // sur l'image ; un simple toucher l'y fait sauter. `touch-action: pan-y`
  // (globals.css) laisse le défilement VERTICAL à la page : un doigt qui
  // descend fait défiler, un doigt qui glisse de côté déplace la couture.
  // Quand le navigateur prend le geste pour un défilement, il émet
  // `pointercancel` et le glissement s'arrête là.
  //
  // ⚠️ AU DOIGT, ON NE SAUTE PAS AU CONTACT. Un pouce qui défile la page
  // en passant sur l'image pose aussi un `pointerdown` : sauter là, c'est
  // arracher la couture à chaque défilement. Le doigt ne déplace donc la
  // couture qu'en glissant de côté (au-delà de SEUIL_DOIGT px) ou en
  // touchant sans bouger (un vrai toucher, qui se termine par
  // `pointerup`). La souris, elle, saute au clic, comme on s'y attend.
  const glisse = useRef(null);   // { id, x0, suit } — le pointeur qui tient la couture
  const versPosition = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (!r.width) return null;
    return Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
  };
  const placer = (e) => {
    const v = versPosition(e);
    if (v !== null) { ecrire(v); glisse.current.v = v; }
  };
  const auPointeurBas = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const souris = e.pointerType === "mouse";
    glisse.current = { id: e.pointerId, x0: e.clientX, suit: souris };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    if (souris) {
      e.preventDefault();   // pas de glisser-déposer natif, pas de sélection
      placer(e);
    }
  };
  const auPointeurBouge = (e) => {
    const g = glisse.current;
    if (!g || g.id !== e.pointerId) return;
    if (!g.suit && Math.abs(e.clientX - g.x0) > SEUIL_DOIGT) g.suit = true;
    if (g.suit) placer(e);
  };
  const auPointeurHaut = (e) => {
    const g = glisse.current;
    if (!g || g.id !== e.pointerId) return;
    // Un `pointerup` sans glissement, c'est un toucher : on y saute.
    // Un `pointercancel`, c'est le navigateur qui a pris le geste pour un
    // défilement : la couture ne bouge pas.
    if (e.type === "pointerup") placer(e);
    // L'état rattrape la couture : un seul rendu, au relâchement.
    if (g.v !== undefined) setPosition(g.v);
    glisse.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
  };

  // ⚠️ PAS DE COMPARATEUR SANS VRAIE PAIRE — ET LE GARDE EST ICI,
  // APRÈS LES HOOKS.
  //
  // Le repli d'avant assombrissait la photo réelle au filtre CSS pour
  // fabriquer un « avant ». Honnête tant que les étiquettes le disaient,
  // mais les deux appelants ont maintenant une vraie simulation : garder
  // ce chemin en dormance, c'était garder une <img alt=""> et des
  // étiquettes qui mentiraient le jour où quelqu'un oublierait
  // `photoAvant`.
  //
  // Le `return null` ne peut PAS monter au-dessus des `useState` :
  // React compte les hooks à chaque rendu, et un retour anticipé en
  // changerait le nombre dès que la condition bouge. Première version
  // écrite comme ça — corrigée avant de partir.
  if (!photoAvant?.src || !photo?.src) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[RevelationLumiere] paire incomplète — rien n'est rendu.", { photo, photoAvant });
    }
    return null;
  }

  return (
    <figure className="revel" ref={figure} style={{ "--revel-h": hauteur, "--revel-pos": `${position}%` }}>
      <div className="revel-cadre"
        onPointerDown={auPointeurBas}
        onPointerMove={auPointeurBouge}
        onPointerUp={auPointeurHaut}
        onPointerCancel={auPointeurHaut}>
        {/* ⚠️ LE CALQUE DU DESSOUS EST L'« APRÈS ».
            Le découpage ci-dessous révèle depuis le BORD GAUCHE. Le
            calque découpé occupe donc la gauche, et le calque de fond ce
            qui reste — la droite. Comme l'étiquette de gauche dit
            « Avant » et celle de droite « Après », c'est l'APRÈS qui va
            au fond. L'inverse donnait exactement ce qu'on a vu sur la
            première capture : la maison illuminée à gauche sous
            « Avant (simulation) », la maison nue à droite sous
            « installation réelle ». */}
        <Image className="revel-img" src={photo.src}
          alt={altApres || photo.alt}
          fill sizes={tailles} priority={prioritaire} style={{ objectFit: "cover" }} />

        {/* ⚠️ Le découpage se fait au `clip-path`, PAS à la largeur.
            Le motif de .sim-apres (largeur variable + `img { width: 100vw;
            max-width: 560px }`) marche parce que ce conteneur-là a une
            largeur connue écrite en dur. Ici le cadre est fluide : une
            largeur variable écraserait l'image au lieu de la révéler. Le
            clip garde les deux calques à taille réelle.
            L'IntersectionObserver est posé sur le <figure>, un ancêtre
            jamais découpé — un observateur sur l'élément clippé, lui, ne se
            déclencherait jamais. */}
        {/* Le calque découpé : l'AVANT, révélé de la gauche jusqu'à la
            couture. La classe s'appelle `revel-avant` — elle s'appelait
            `revel-apres` et contenait l'après, ce qui rendait le défaut
            invisible à la relecture. */}
        <div className="revel-avant">
          <Image className="revel-img" src={photoAvant.src}
            alt={altAvant || photoAvant.alt}
            fill sizes={tailles} loading={prioritaire ? "eager" : undefined} style={{ objectFit: "cover" }} />
        </div>

        {/* La couture lumineuse — le seul ambre de la section. */}
        <span className="revel-couture" aria-hidden="true">
          <span className="revel-poignee">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6 4 12l5 6M15 6l5 6-5 6" stroke="currentColor" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </span>

        <span className="revel-etiq revel-etiq--gauche" aria-hidden="true">
          {etiquetteAvant || "Avant (simulation)"}
        </span>
        <span className="revel-etiq revel-etiq--droite" aria-hidden="true">
          {etiquetteApres || "Après"}
        </span>

        {/* ⚠️ Le <input type="range"> reste, pour le CLAVIER et les
            lecteurs d'écran : il est annoncé, et les flèches le
            déplacent. Mais il est visuellement masqué et ne couvre PLUS
            l'image — c'est le cadre qui reçoit le doigt. Quand il a le
            focus, c'est la poignée dessinée qui le montre. */}
        <input
          className="revel-curseur"
          type="range" min="0" max="100" step="0.5"
          value={position}
          aria-label="Glisser pour illuminer la maison"
          onChange={(e) => bouger(Number(e.target.value))}
        />
      </div>
      {legende && <figcaption className="revel-legende">{legende}</figcaption>}
    </figure>
  );
}
