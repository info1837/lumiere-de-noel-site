"use client";
import { useEffect, useRef, useState } from "react";

// Vidéo du hero, TÉLÉPHONE SEULEMENT (2026-11-08, demande de Yahir).
//
// Pourquoi seulement sous 768 px : les plans de Nathan sont tournés en
// vertical (9:16). Sur un téléphone le hero est vertical aussi, le cadre
// tombe juste. En desktop, le hero est une bande 16:9 : le même plan
// perdrait les deux tiers de son cadre et serait agrandi au flou — la photo
// de Mirabel reste donc la seule image du desktop (voir Hero.jsx).
//
// Les règles de la page tiennent :
//   · La photo next/image reste l'image LCP (priority). La vidéo n'est
//     même pas demandée avant `load` : preload="none", src posé ensuite.
//   · Premier écran immobile : pas de fondu. La vidéo reste invisible tant
//     qu'elle ne joue pas, puis apparaît d'un coup par-dessus la photo.
//   · prefers-reduced-motion ou économie de données : rien ne se charge,
//     la photo reste.
//
// Montage (11 s, 540×960, ~450 Ko, sans texte ni logo) :
//   drone de Mercier (DJI_0328, passé de jour à nuit dans Higgsfield en
//   prenant la vraie photo de nuit de la même maison comme référence : les
//   lumières sont là où elles sont vraiment) → façade de Laval (VIDEO 27)
//   → grand arbre de Mercier allumé (VIDEO 8) → Laval large → drone.
export default function HeroVideo() {
  const ref = useRef(null);
  const [joue, setJoue] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const eco = navigator.connection?.saveData === true;
    if (!mobile || reduit || eco) return;

    const demarrer = () => {
      v.querySelectorAll("source").forEach((s) => { s.src = s.dataset.src; });
      v.load();
      v.play().catch(() => {});
    };
    if (document.readyState === "complete") demarrer();
    else window.addEventListener("load", demarrer, { once: true });
    return () => window.removeEventListener("load", demarrer);
  }, []);

  return (
    <video
      ref={ref}
      className={`hero-video${joue ? " est-active" : ""}`}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      onPlaying={() => {
        setJoue(true);
        // Les deux voiles du hero sont réglés pour une photo claire : sur la
        // vidéo de nuit, ils la cachaient presque au complet (2026-11-08,
        // « la vidéo ne s'affiche pas »). La section passe en mode vidéo
        // et globals.css allège les voiles.
        ref.current?.closest(".hero-section")?.classList.add("hero--video");
      }}
    >
      {/* MP4 d'abord : Safari iOS annonce « maybe » pour le WebM et peut
          s'y arrêter sans jamais jouer. */}
      <source data-src="/videos/hero-mobile.mp4" type="video/mp4" />
      <source data-src="/videos/hero-mobile.webm" type="video/webm" />
    </video>
  );
}
