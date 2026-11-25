"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { flouDe } from "@/components/photos-flou";
import AmbiancesPermanent from "@/components/AmbiancesPermanent";
import PhotoCadree from "@/components/PhotoCadree";

// =============================================================================
// /realisations — la galerie, PAR CHANTIER (components/realisations.js)
// =============================================================================
// Une carte = un chantier, avec 1 à N photos. Les compteurs des pastilles
// comptent des chantiers. Une carte à plusieurs photos se feuillette au
// doigt (glisser de côté) ou par ses points ; un simple toucher ouvre la
// visionneuse sur la photo affichée. La maison du permanent passe d'une
// ambiance à l'autre (AmbiancesPermanent), dans la carte comme dans la
// visionneuse.
//
// Visionneuse : glisser ou ← → passe à la photo suivante du chantier, puis
// au chantier suivant ; Échap ferme et le focus revient à la carte.
//
// GROUPES PAR VILLE / SITE (2026-11-24, avant : « Saison 2026 » puis le reste) :
// voir le calcul de `groupes` plus bas. Un filtre qui ne
// garde aucun chantier de la saison n'affiche aucun titre — la page d'avant.
// Quand le groupe de la saison compte un nombre impair de cartes, la première
// prend toute la largeur (la « vedette ») : pas de trou dans la grille.
//
// CADRAGES : une photo qui a ses recadrages montre le 16:9 dans une carte
// large et le 4:5 dans une carte carrée ou haute (téléphone) ; la visionneuse
// montre toujours la photo ENTIÈRE. Chaque image porte son alt — ce qu'on a
// installé — et plus un alt vide.
// =============================================================================
const TELEPHONE = "(max-width: 640px)";
const PLUS_LARGE = "(min-width: 641px)";   // son complément (préchargement)
// La forme de la carte dit le cadrage et la largeur demandée à l'optimiseur.
const TAILLES = {
  vedette: "(max-width: 1180px) 100vw, 1132px",
  large: "(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 580px",
  carre: "(max-width: 1100px) 50vw, 580px",
};
const SEUIL_GLISSE = 40;

// Un geste horizontal sur un élément : `fin(dx)` reçoit le déplacement si
// c'est un glissement, `toucher()` si c'est un simple toucher. Pas de
// `preventDefault` : le défilement vertical reste à la page (pan-y en CSS).
function useGeste({ glisse, toucher }) {
  const g = useRef(null);
  return {
    onPointerDown: (e) => { g.current = { x: e.clientX, y: e.clientY, id: e.pointerId }; },
    onPointerCancel: () => { g.current = null; },
    onPointerUp: (e) => {
      const d = g.current; g.current = null;
      if (!d || d.id !== e.pointerId) return;
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (Math.abs(dx) > SEUIL_GLISSE && Math.abs(dx) > Math.abs(dy)) glisse(dx < 0 ? 1 : -1);
      else if (Math.abs(dx) < 8 && Math.abs(dy) < 8) toucher?.();
    },
  };
}

function CarteChantier({ chantier, rang, forme = "large", onOuvrir }) {
  const [p, setP] = useState(0);
  const n = chantier.photos.length;
  const geste = useGeste({
    glisse: (pas) => setP((x) => (x + pas + n) % n),
    toucher: () => onOuvrir(p),
  });
  const compte = chantier.ambiances ? `${n} ambiances` : n > 1 ? `${n} photos` : null;

  if (chantier.ambiances) {
    return (
      <div className="chantier chantier--ambiances" data-chantier={chantier.id}>
        <AmbiancesPermanent photos={chantier.photos} onOuvrir={onOuvrir}
          sizes="(max-width: 640px) 100vw, 580px" libelleOuvrir="Agrandir" toutDecrire />
        <span className="chantier__etiquette">{chantier.etiquette}{compte && <em>{compte}</em>}</span>
      </div>
    );
  }

  return (
    <div className={`chantier${n > 1 ? " chantier--plusieurs" : ""}`} data-chantier={chantier.id} data-forme={forme}>
      {/* La photo est un VRAI bouton (clavier : Entrée ouvre). Au doigt, le
          clic est remplacé par le geste : un toucher ouvre, un glissement
          feuillette — sinon chaque glissement ouvrirait aussi la
          visionneuse. */}
      <button type="button" className="chantier__photo" {...(n > 1 ? geste : {})}
        onClick={(e) => { if (n === 1 || e.detail === 0) onOuvrir(p); }}
        aria-label={`Agrandir : ${chantier.photos[p].alt}`}>
        {/* Les photos suivantes d'un chantier se chargent quand la carte
            approche de l'écran (elles sont empilées dans la même boîte) :
            feuilleter est immédiat, sans les télécharger dès l'ouverture. */}
        {chantier.photos.map((ph, k) => (
          <PhotoCadree key={ph.cle} photo={ph} alt={ph.alt}
            sizes={TAILLES[forme]}
            portraitSi={forme === "large" ? null : TELEPHONE} paysageSi={PLUS_LARGE}
            priority={rang < 2 && k === 0}
            className={`chantier__img${k === p ? " est-active" : ""}`} />
        ))}
      </button>
      {n > 1 && (
        <span className="chantier__points" role="group" aria-label={`Photos — ${chantier.etiquette}`}>
          {chantier.photos.map((ph, k) => (
            <button key={ph.cle} type="button" className="chantier__point" aria-pressed={k === p}
              aria-label={`Photo ${k + 1} sur ${n}`} onClick={() => setP(k)} />
          ))}
        </span>
      )}
      <span className="chantier__etiquette">{chantier.etiquette}{compte && <em>{compte}</em>}</span>
    </div>
  );
}

export default function GalerieRealisations({ chantiers, categories }) {
  const [filtre, setFiltre] = useState("Tout");
  const [vue, setVue] = useState(null);   // { c, p } : chantier et photo dans la visionneuse
  const declencheur = useRef(null);
  const fermer = useRef(null);

  const filtres = filtre === "Tout" ? chantiers : chantiers.filter((c) => c.categorie === filtre);
  // PAR VILLE / PAR SITE (2026-11-24) : chaque chantier de la saison porte
  // un `groupe` (« Vieux-Montréal », « Lorraine »…) ; un groupe = un titre,
  // dans l'ordre de components/realisations.js. Les chantiers de la saison
  // sans lieu forment « Saison 2026 — autres propriétés » ; les plus anciens
  // restent sous « Réalisations précédentes ». `visibles` est l'ordre
  // d'affichage : la visionneuse et le retour du focus s'y fient.
  const saison = Math.max(0, ...chantiers.map((c) => c.saison || 0));
  const groupes = [];
  for (const c of filtres) {
    const titre = c.groupe || (saison && c.saison === saison ? `Saison ${saison} — autres propriétés` : "Réalisations précédentes");
    let g = groupes.find((x) => x.titre === titre);
    if (!g) groupes.push((g = { cle: titre, titre, items: [] }));
    g.items.push(c);
  }
  // Les anciens toujours en dernier, quel que soit l'ordre du fichier.
  groupes.sort((a, b) => (a.titre === "Réalisations précédentes") - (b.titre === "Réalisations précédentes"));
  let debut = 0;
  for (const g of groupes) { g.debut = debut; debut += g.items.length; }
  // Un filtre sans aucun chantier de la saison (ex. « Permanent ») : aucun
  // titre, la grille d'avant.
  if (groupes.length === 1 && groupes[0].titre === "Réalisations précédentes") groupes[0].titre = null;
  const visibles = groupes.flatMap((g) => g.items);

  // Suivante / précédente : d'abord les photos du chantier, puis le chantier
  // voisin. La maison du permanent change de couleur par ses points : la
  // visionneuse, elle, passe au chantier suivant.
  const aller = useCallback((pas) => {
    setVue((v) => {
      if (!v) return v;
      const ch = visibles[v.c];
      const n = ch.ambiances ? 1 : ch.photos.length;
      const p = v.p + pas;
      if (p >= 0 && p < n) return { c: v.c, p };
      const c = (v.c + pas + visibles.length) % visibles.length;
      const m = visibles[c].ambiances ? 1 : visibles[c].photos.length;
      return { c, p: pas > 0 ? 0 : m - 1 };
    });
  }, [visibles]);

  // Le focus revient à la CARTE qui a ouvert la visionneuse — même quand
  // c'est un doigt qui l'a ouverte (un toucher ne donne le focus à rien).
  const ouvrir = (c, p) => {
    const actif = document.activeElement;
    declencheur.current = actif?.closest?.(".galerie__item")
      ? actif
      : document.querySelectorAll(".galerie__item")[c]?.querySelector("button");
    setVue({ c, p });
  };
  const clore = useCallback(() => {
    setVue(null);
    requestAnimationFrame(() => declencheur.current?.focus?.());
  }, []);

  useEffect(() => {
    if (!vue) return;
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = avant; };
  }, [vue !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!vue) return;
    fermer.current?.focus();
  }, [vue?.c]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!vue) return;
    const touche = (e) => {
      if (e.key === "Escape") clore();
      else if (e.key === "ArrowRight") aller(1);
      else if (e.key === "ArrowLeft") aller(-1);
      else if (e.key === "Tab") {
        const f = [...document.querySelectorAll(".visionneuse button")];
        if (!f.length) return;
        const k = f.indexOf(document.activeElement);
        if (e.shiftKey && k <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && k === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [vue, aller, clore]);

  const geste = useGeste({ glisse: aller });
  const ch = vue ? visibles[vue.c] : null;
  const photo = ch ? ch.photos[vue.p] : null;

  return (
    <>
      <div className="filtres" role="group" aria-label="Filtrer les réalisations">
        {["Tout", ...categories].map((c) => (
          <button key={c} type="button" className="filtre" aria-pressed={filtre === c}
            onClick={() => { setFiltre(c); setVue(null); }}>
            {c}
            <span className="filtre__n" aria-label={`${c === "Tout" ? chantiers.length : chantiers.filter((x) => x.categorie === c).length} chantiers`}>
              {c === "Tout" ? chantiers.length : chantiers.filter((x) => x.categorie === c).length}
            </span>
          </button>
        ))}
      </div>

      {groupes.filter((g) => g.items.length).map((g) => {
        // Nombre impair dans un groupe de la saison : la première en vedette.
        const vedette = !!g.titre && g.titre !== "Réalisations précédentes" && g.items.length % 2 === 1;
        return (
          // Un <div>, pas une <section> : la feuille de style donne à toute
          // <section> la marge d'une bande de page.
          <div key={g.cle} className="galerie__groupe" data-groupe={g.cle}>
            {g.titre && (
              <h2 className="galerie__titre">
                {g.titre}
                <em>{g.items.length} chantier{g.items.length > 1 ? "s" : ""}</em>
              </h2>
            )}
            <ul className={`galerie${vedette ? " galerie--vedette" : ""}`}>
              {g.items.map((c, i) => {
                const k = g.debut + i;
                const forme = vedette ? (i === 0 ? "vedette" : "carre") : i % 3 === 0 ? "large" : "carre";
                return (
                  <li key={c.id} className="galerie__item">
                    <CarteChantier chantier={c} rang={k} forme={forme} onOuvrir={(p) => ouvrir(k, p)} />
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      {ch && (
        <div className="visionneuse" role="dialog" aria-modal="true" aria-label={`Réalisation — ${ch.etiquette}`}>
          <div className="visionneuse__scene" {...geste}>
            {ch.ambiances ? (
              <AmbiancesPermanent key={ch.id} photos={ch.photos} depart={vue.p} sizes="100vw"
                ajustement="contain" className="ambiances--plein" />
            ) : (
              <Image key={photo.cle} src={photo.src} alt={photo.alt} fill sizes="100vw"
                placeholder={flouDe(photo.src) ? "blur" : "empty"} blurDataURL={flouDe(photo.src)}
                style={{ objectFit: "contain" }} />
            )}
          </div>
          <div className="visionneuse__barre">
            <span className="visionneuse__ville">{ch.etiquette}</span>
            <span className="visionneuse__compte">
              {!ch.ambiances && ch.photos.length > 1 && `Photo ${vue.p + 1}/${ch.photos.length} · `}
              Chantier {vue.c + 1} / {visibles.length}
            </span>
          </div>
          <button type="button" className="visionneuse__fermer" ref={fermer} onClick={clore} aria-label="Fermer">×</button>
          <button type="button" className="visionneuse__nav visionneuse__nav--prec" onClick={() => aller(-1)} aria-label="Précédente">‹</button>
          <button type="button" className="visionneuse__nav visionneuse__nav--suiv" onClick={() => aller(1)} aria-label="Suivante">›</button>
        </div>
      )}
    </>
  );
}
