"use client";
import { useEffect, useRef, useState } from "react";

// Une vidéo verticale de Yahir qui PARLE (V12 garantie, V17 fondateur).
//
// Pas d'autoplay : c'est une vidéo avec du son, le visiteur la lance. Rien
// n'est téléchargé avant le clic (preload="none") — seule l'affiche, une
// image de ~70 Ko, est chargée paresseusement. Aucune animation.
//
// ORDINATEUR (≥ 768 px, 2026-11-11) : plus la barre du navigateur sur
// l'affiche — une affiche propre et UN bouton lecture au style du site ;
// les contrôles du navigateur n'apparaissent qu'une fois la vidéo lancée.
// TÉLÉPHONE (< 768 px) : inchangé, contrôles natifs dès le départ (rendu
// serveur avec `controls` ; ils ne sont retirés qu'après l'hydratation, et
// seulement en desktop).
//
// `paysage` (2026-11-13, promo du Vieux-Montréal) : vidéo 16:9, et l'affiche
// + UN bouton lecture à TOUTES les largeurs, téléphone compris (rendu serveur
// sans `controls`) ; les contrôles natifs, avec le son, n'apparaissent qu'au
// clic. Toujours rien de téléchargé avant le clic, ni autoplay ni boucle.
export default function VideoParlee({ src, affiche, titre, legende, paysage = false }) {
  const ref = useRef(null);
  const [habille, setHabille] = useState(paysage); // affiche + bouton, pas encore lancée

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const v = ref.current;
    if (mq.matches && v && v.paused && v.currentTime === 0) setHabille(true);
  }, []);

  const lancer = () => {
    const v = ref.current;
    if (!v) return;
    setHabille(false);
    v.play().catch(() => {});
  };

  return (
    <figure className={`video-parlee${paysage ? " video-parlee--paysage" : ""}${habille ? " video-parlee--affiche" : ""}`}>
      <div className="video-parlee__cadre">
        <video
          ref={ref}
          controls={!habille}
          playsInline
          preload="none"
          poster={affiche}
          aria-label={titre}
          onPlay={() => setHabille(false)}
        >
          <source src={src} type="video/mp4" />
        </video>
        {habille && (
          <button type="button" className="video-parlee__lecture" onClick={lancer} aria-label={`Lire la vidéo : ${titre}`}>
            <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false">
              <path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.4-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5Z" fill="currentColor" />
            </svg>
          </button>
        )}
      </div>
      {legende && <figcaption>{legende}</figcaption>}
    </figure>
  );
}
