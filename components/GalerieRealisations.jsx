"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { flouDe } from "@/components/photos-flou";

// =============================================================================
// /realisations — la galerie (partie 3)
// =============================================================================
// Pastilles de filtre, grille de vraies photos, et une visionneuse plein
// écran : on touche une photo, elle s'ouvre ; on la fait glisser de côté
// pour passer à la suivante. Au clavier : ← → pour naviguer, Échap pour
// fermer, et le focus revient à la photo qui l'a ouverte.
//
// Chaque photo porte sa VILLE si elle est située (registre), sinon sa
// catégorie : on n'écrit jamais un lieu qu'on ne peut pas affirmer.
// =============================================================================
const SEUIL_GLISSE = 50;   // px horizontaux avant de changer de photo

export default function GalerieRealisations({ items, categories }) {
  const [filtre, setFiltre] = useState("Tout");
  const [ouverte, setOuverte] = useState(null);   // index dans `visibles`
  const declencheur = useRef(null);
  const fermer = useRef(null);
  const geste = useRef(null);

  const visibles = filtre === "Tout" ? items : items.filter((it) => it.categorie === filtre);
  const etiquette = (it) => it.ville || it.categorie;

  const aller = useCallback((pas) => {
    setOuverte((i) => (i === null ? null : (i + pas + visibles.length) % visibles.length));
  }, [visibles.length]);

  const ouvrir = (i, e) => { declencheur.current = e.currentTarget; setOuverte(i); };
  const clore = useCallback(() => {
    setOuverte(null);
    // Le focus revient là où il était : sinon il tombe en haut de la page.
    requestAnimationFrame(() => declencheur.current?.focus());
  }, []);

  useEffect(() => {
    if (ouverte === null) return;
    fermer.current?.focus();
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const touche = (e) => {
      if (e.key === "Escape") clore();
      else if (e.key === "ArrowRight") aller(1);
      else if (e.key === "ArrowLeft") aller(-1);
      else if (e.key === "Tab") {
        // Le focus reste DANS la visionneuse tant qu'elle est ouverte.
        const f = [...document.querySelectorAll(".visionneuse button")];
        if (!f.length) return;
        const i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    };
    window.addEventListener("keydown", touche);
    return () => { window.removeEventListener("keydown", touche); document.body.style.overflow = avant; };
  }, [ouverte, aller, clore]);

  // Glisser de côté, au doigt comme à la souris. `touch-action: pan-y`
  // (CSS) : un geste vertical ne fait rien de spécial.
  const bas = (e) => { geste.current = { x: e.clientX, id: e.pointerId }; };
  const haut = (e) => {
    const g = geste.current;
    geste.current = null;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x;
    if (Math.abs(dx) > SEUIL_GLISSE) aller(dx < 0 ? 1 : -1);
  };

  const courante = ouverte === null ? null : visibles[ouverte];

  return (
    <>
      <div className="filtres" role="group" aria-label="Filtrer les réalisations">
        {["Tout", ...categories].map((c) => (
          <button key={c} type="button" className="filtre" aria-pressed={filtre === c}
            onClick={() => { setFiltre(c); setOuverte(null); }}>
            {c}
            <span className="filtre__n">{c === "Tout" ? items.length : items.filter((it) => it.categorie === c).length}</span>
          </button>
        ))}
      </div>

      <ul className="galerie">
        {visibles.map((it, i) => (
          <li key={it.cle} className="galerie__item">
            <button type="button" className="galerie__bouton" onClick={(e) => ouvrir(i, e)}
              aria-label={`Agrandir : ${it.alt}`}>
              <Image src={it.src} alt="" fill
                sizes="(max-width: 640px) 50vw, (max-width: 1100px) 50vw, 580px"
                priority={i < 2}
                placeholder={flouDe(it.src) ? "blur" : "empty"} blurDataURL={flouDe(it.src)}
                style={{ objectFit: "cover" }} />
              <span className="galerie__ville">{etiquette(it)}</span>
            </button>
          </li>
        ))}
      </ul>

      {courante && (
        <div className="visionneuse" role="dialog" aria-modal="true"
          aria-label={`Réalisation — ${etiquette(courante)}`}>
          <div className="visionneuse__scene" onPointerDown={bas} onPointerUp={haut}
            onPointerCancel={() => { geste.current = null; }}>
            <Image key={courante.cle} src={courante.src} alt={courante.alt} fill sizes="100vw"
              placeholder={flouDe(courante.src) ? "blur" : "empty"} blurDataURL={flouDe(courante.src)}
              style={{ objectFit: "contain" }} />
          </div>
          <div className="visionneuse__barre">
            <span className="visionneuse__ville">{etiquette(courante)}</span>
            <span className="visionneuse__compte">{ouverte + 1} / {visibles.length}</span>
          </div>
          <button type="button" className="visionneuse__fermer" ref={fermer} onClick={clore} aria-label="Fermer">×</button>
          {visibles.length > 1 && (
            <>
              <button type="button" className="visionneuse__nav visionneuse__nav--prec" onClick={() => aller(-1)} aria-label="Photo précédente">‹</button>
              <button type="button" className="visionneuse__nav visionneuse__nav--suiv" onClick={() => aller(1)} aria-label="Photo suivante">›</button>
            </>
          )}
        </div>
      )}
    </>
  );
}
