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
// Plans : VIDEO 27 (1,75 s → 7,85 s, façade de nuit) + VIDEO 8 (le grand
// arbre de Mercier allumé). Sans texte ni logo. 540×960, ~400 Ko.
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
      onPlaying={() => setJoue(true)}
    >
      <source data-src="/videos/hero-mobile.webm" type="video/webm" />
      <source data-src="/videos/hero-mobile.mp4" type="video/mp4" />
    </video>
  );
}
