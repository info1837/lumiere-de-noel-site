"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { flouDe } from "@/components/photos-flou";
import AmbiancesPermanent from "@/components/AmbiancesPermanent";

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
// =============================================================================
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

function CarteChantier({ chantier, rang, onOuvrir }) {
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
          sizes="(max-width: 640px) 100vw, 580px" libelleOuvrir="Agrandir" />
        <span className="chantier__etiquette">{chantier.etiquette}{compte && <em>{compte}</em>}</span>
      </div>
    );
  }

  return (
    <div className="chantier" data-chantier={chantier.id}>
      {/* La photo est un VRAI bouton (clavier : Entrée ouvre). Au doigt, le
          clic est remplacé par le geste : un toucher ouvre, un glissement
          feuillette — sinon chaque glissement ouvrirait aussi la
          visionneuse. */}
      <button type="button" className="chantier__photo" {...(n > 1 ? geste : {})}
        onClick={(e) => { if (n === 1 || e.detail === 0) onOuvrir(p); }}
        aria-label={`Agrandir : ${chantier.photos[p].alt}`}>
        {chantier.photos.map((ph, k) => (
          <Image key={ph.cle} src={ph.src} alt="" fill
            sizes="(max-width: 640px) 50vw, (max-width: 1100px) 50vw, 580px"
            priority={rang < 2 && k === 0}
            loading={k === 0 ? undefined : "eager"}
            placeholder={flouDe(ph.src) ? "blur" : "empty"} blurDataURL={flouDe(ph.src)}
            className={`chantier__img${k === p ? " est-active" : ""}`}
            style={{ objectFit: "cover" }} />
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

  const visibles = filtre === "Tout" ? chantiers : chantiers.filter((c) => c.categorie === filtre);

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

      <ul className="galerie">
        {visibles.map((c, k) => (
          <li key={c.id} className="galerie__item">
            <CarteChantier chantier={c} rang={k} onOuvrir={(p) => ouvrir(k, p)} />
          </li>
        ))}
      </ul>

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
