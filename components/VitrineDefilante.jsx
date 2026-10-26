"use client";
import { useRef } from "react";
import Image from "next/image";

// La bande des réalisations : une rangée qu'on fait défiler soi-même.
//
// ⚠️ PLUS DE BOUCLE (passe « effets sobres », 2026-10-26). La bande
// défilait toute seule en `infinite`, avec la liste dupliquée pour ne pas
// laisser de trou, et un glissement maison en `transform` au-dessus. C'était
// une exception à la règle « rien ne boucle » ; la règle a gagné :
//
//   · le défilement est NATIF (overflow-x), au doigt comme au pavé tactile,
//     sans aimantation (pas de scroll-snap) ;
//   · à la souris, on peut tirer la bande : le geste déplace `scrollLeft`,
//     c'est-à-dire le défilement natif lui-même, pas une transformation ;
//   · plus de clones : chaque photo apparaît une fois, et les lecteurs
//     d'écran n'entendent plus la liste deux fois ;
//   · les photos passent par next/image (AVIF/WebP à la bonne largeur) au
//     lieu des JPEG d'origine, jusqu'à 650 Ko chacun.
//
// `secondesParItem` n'a plus d'effet ; le paramètre reste accepté.
// Suit `.defile-item { width: clamp(240px, 38vw, 420px) }`.
export const TAILLES_VITRINE = "(max-width: 631px) 240px, (max-width: 1105px) 38vw, 420px";

export default function VitrineDefilante({ items = [] }) {
  const bande = useRef(null);
  const tire = useRef(null);   // { x0, s0, bouge } — la souris qui tient la bande

  const auPointeurBas = (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    tire.current = { x0: e.clientX, s0: bande.current.scrollLeft, bouge: false };
  };
  const auPointeurBouge = (e) => {
    const t = tire.current;
    if (!t) return;
    const d = e.clientX - t.x0;
    if (!t.bouge && Math.abs(d) < 6) return;     // un clic n'est pas un geste
    if (!t.bouge) { t.bouge = true; bande.current.classList.add("saisi"); }
    bande.current.scrollLeft = t.s0 - d;
  };
  const relacher = () => {
    if (!tire.current) return;
    tire.current = null;
    bande.current?.classList.remove("saisi");
  };

  if (!items.length) return null;

  return (
    <div
      ref={bande}
      className="defile"
      onPointerDown={auPointeurBas}
      onPointerMove={auPointeurBouge}
      onPointerUp={relacher}
      onPointerCancel={relacher}
      onPointerLeave={relacher}
    >
      <div className="defile-piste">
        {items.map((p, i) => (
          <figure className="defile-item" key={`${i}-${p.image}`}>
            <Image src={p.image} alt={p.alt} fill sizes={TAILLES_VITRINE}
              draggable={false} style={{ objectFit: "cover" }} />
            <figcaption>{p.caption}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
