"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { flouDe } from "@/components/photos-flou";

// =============================================================================
// « Une maison, toutes les ambiances » — la même façade, trois couleurs
// =============================================================================
// Trois vraies photos de LA MÊME maison en éclairage permanent, empilées et
// chargées ensemble (dès que la carte approche de l'écran) : passer de
// l'une à l'autre ne montre jamais un trou noir.
//
//   · trois points pour choisir une couleur, et une étiquette qui suit la
//     couleur (le nom vient de ce qu'on VOIT sur chaque photo) ;
//   · le passage est un fondu de 250 ms (aucun en mouvement réduit).
//
// ⚠️ PLUS DE DIAPORAMA AUTOMATIQUE (passe « effets sobres », 2026-10-26).
// La carte changeait de couleur toute seule toutes les 3,3 s : une boucle
// de plus sous les yeux, et des minuteries sur chaque carte de la galerie.
// Elle change quand on la touche, et seulement là.
//
// `onOuvrir` (galerie) : la photo devient un bouton qui ouvre la
// visionneuse ; les points restent des boutons à part, jamais imbriqués.
// =============================================================================
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

  useEffect(() => { onChange?.(i); }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  const choisir = (n) => setI(n);
  const courante = photos[i];

  return (
    <div
      className={`ambiances ${className}`}
      data-ambiance={i}
      data-auto="0"
    >
      {photos.map((p, n) => (
        <Image
          key={p.cle}
          src={p.src}
          alt={n === i ? p.alt : ""}
          aria-hidden={n === i ? undefined : true}
          fill
          sizes={sizes}
          // Paresseuses hors premier écran : les trois calques sont au même
          // endroit, ils arrivent ensemble quand la carte approche de
          // l'écran — le choix d'une couleur ne montre pas de trou.
          loading={prioritaire ? undefined : "lazy"}
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
