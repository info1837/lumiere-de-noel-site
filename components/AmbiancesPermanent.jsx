"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { flouDe } from "@/components/photos-flou";
import { mouvementReduit } from "@/lib/mouvement";

// =============================================================================
// « Une maison, toutes les ambiances » — la même façade, trois couleurs
// =============================================================================
// Trois vraies photos de LA MÊME maison en éclairage permanent. La carte
// passe de l'une à l'autre : ~2,5 s par couleur, fondu de 800 ms. Les trois
// images sont empilées et chargées d'avance (`loading="eager"`) : le fondu
// ne montre jamais un trou noir entre deux couleurs.
//
//   · trois points pour choisir une couleur à la main, et une étiquette qui
//     suit la couleur (le nom vient de ce qu'on VOIT sur chaque photo) ;
//   · s'arrête au survol, reprend à la sortie ;
//   · s'arrête POUR DE BON au premier toucher ou au premier point choisi :
//     la personne a pris la main ;
//   · ne tourne que pendant qu'elle est à l'écran et l'onglet visible ;
//   · mouvement réduit : jamais de défilement automatique, les points
//     seulement. Le passage d'une couleur à l'autre reste un fondu
//     d'opacité, que les règles de #53 autorisent.
//
// `onOuvrir` (galerie) : la photo devient un bouton qui ouvre la
// visionneuse ; les points restent des boutons à part, jamais imbriqués.
// =============================================================================
export const TENUE_MS = 2500;
export const FONDU_MS = 800;

export default function AmbiancesPermanent({
  photos,
  depart = 0,
  sizes = "(max-width: 640px) 100vw, 580px",
  prioritaire = false,
  ajustement = "cover",
  onOuvrir = null,
  onChange = null,
  libelleOuvrir = "Agrandir",
  className = "",
}) {
  const [i, setI] = useState(depart);
  const [arrete, setArrete] = useState(false);   // la personne a pris la main
  const [survol, setSurvol] = useState(false);
  const [visible, setVisible] = useState(false);
  const [doux, setDoux] = useState(true);         // prudence jusqu'au montage
  const racine = useRef(null);

  useEffect(() => { setDoux(mouvementReduit()); }, []);

  useEffect(() => {
    const el = racine.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (doux || arrete || survol || !visible) return;
    const t = setTimeout(() => {
      if (document.hidden) return;
      setI((n) => (n + 1) % photos.length);
    }, TENUE_MS + FONDU_MS);
    return () => clearTimeout(t);
  }, [i, doux, arrete, survol, visible, photos.length]);

  useEffect(() => { onChange?.(i); }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  const choisir = (n) => { setArrete(true); setI(n); };
  const courante = photos[i];

  return (
    <div
      ref={racine}
      className={`ambiances ${className}`}
      data-ambiance={i}
      data-auto={!doux && !arrete ? "1" : "0"}
      onPointerEnter={(e) => { if (e.pointerType === "mouse") setSurvol(true); }}
      onPointerLeave={(e) => { if (e.pointerType === "mouse") setSurvol(false); }}
      onPointerDown={(e) => { if (e.pointerType !== "mouse") setArrete(true); }}
      style={{ "--fondu": `${FONDU_MS}ms` }}
    >
      {photos.map((p, n) => (
        <Image
          key={p.cle}
          src={p.src}
          alt={n === i ? p.alt : ""}
          aria-hidden={n === i ? undefined : true}
          fill
          sizes={sizes}
          loading="eager"
          priority={prioritaire}
          placeholder={flouDe(p.src) ? "blur" : "empty"}
          blurDataURL={flouDe(p.src)}
          className={`ambiances__img${n === i ? " est-active" : ""}`}
          style={{ objectFit: ajustement }}
        />
      ))}

      {onOuvrir && (
        <button type="button" className="ambiances__ouvrir" onClick={() => onOuvrir(i)}
          aria-label={`${libelleOuvrir} : ${courante.alt}`} />
      )}

      <div className="ambiances__barre">
        <span className="ambiances__etiquette">{courante.couleur}</span>
        <span className="ambiances__points" role="group" aria-label="Choisir une ambiance">
          {photos.map((p, n) => (
            <button key={p.cle} type="button" className="ambiances__point"
              aria-pressed={n === i} aria-label={`Ambiance : ${p.couleur}`}
              onClick={(e) => { e.stopPropagation(); choisir(n); }} />
          ))}
        </span>
      </div>
    </div>
  );
}
