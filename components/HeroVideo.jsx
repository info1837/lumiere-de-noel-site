"use client";
import { useEffect, useRef, useState } from "react";
import { MEDIA_PORTRAIT, HERO_MONTAGES } from "@/lib/hero-media";

// Vidéo du hero : vrais plans de drone de nos installations (2026-11-11).
//
// Un seul montage, et seulement pour les téléphones / écrans verticaux :
//   · portrait (1080×1920, 13,1 s, 8 plans en coupes franches) — Terrebonne,
//     Blainville, Sainte-Anne, Saint-Valentin, Lorraine.
//   · paysage : AUCUNE vidéo (HERO_MONTAGES.paysage.video = null) — la photo
//     de Mirabel reste seule, rien n'est téléchargé.
// Le choix suit MEDIA_PORTRAIT (lib/hero-media.js), la même requête que
// l'affiche <picture> de Hero.jsx. Il est fait UNE fois, au chargement : si
// l'écran pivote ensuite, on ne télécharge rien de plus, on cache la vidéo
// et l'affiche du bon format reprend la place (puis la vidéo revient si
// l'écran retrouve son orientation de départ).
//
// Les règles de la page tiennent :
//   · L'affiche (next/image, priority) est l'image LCP. La vidéo n'est même
//     pas demandée avant `load` : aucune <source>, src posé ensuite.
//   · Premier écran immobile : pas de fondu. La vidéo reste invisible tant
//     qu'elle ne joue pas, puis remplace l'affiche d'un coup — et comme elle
//     démarre sur l'image même de l'affiche (`debut`), rien ne bouge.
//   · prefers-reduced-motion ou économie de données : rien ne se charge,
//     l'affiche reste.
export default function HeroVideo() {
  const ref = useRef(null);
  const [joue, setJoue] = useState(false);
  const [masquee, setMasquee] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const eco = navigator.connection?.saveData === true;
    if (reduit || eco) return;

    const mq = window.matchMedia(MEDIA_PORTRAIT);
    const choix = mq.matches ? "portrait" : "paysage";
    const montage = HERO_MONTAGES[choix];
    // Paysage : pas de montage, l'affiche reste. Rien à suivre non plus —
    // si l'écran pivote en portrait, <picture> change d'affiche tout seul.
    if (!montage.video) return;
    let demarree = false;

    const demarrer = () => {
      if (demarree) return;
      demarree = true;
      v.addEventListener("loadedmetadata", () => {
        // Démarrer sur l'image de l'affiche. Si le navigateur refuse de se
        // positionner, la vidéo part du début : moins fluide, pas cassé.
        try { v.currentTime = montage.debut; } catch {}
      }, { once: true });
      // React ne pose pas toujours la PROPRIÉTÉ muted : sans elle, iOS et
      // Chrome refusent la lecture automatique.
      v.muted = true;
      v.src = montage.video;
      v.load();
      v.play().catch(() => {});
    };

    // Rotation / redimensionnement : jamais l'autre fichier.
    const suivre = () => {
      const bonFormat = (mq.matches ? "portrait" : "paysage") === choix;
      setMasquee(!bonFormat);
      if (!demarree) return;
      if (bonFormat) v.play().catch(() => {});
      else v.pause();
    };
    mq.addEventListener("change", suivre);

    // ⚠️ RENDRE LA CONNEXION EN QUITTANT LA PAGE (2026-11-11). Une vidéo en
    // cours de téléchargement garde sa connexion même après la navigation
    // (page mise en cache arrière/avant). Sur les pages de secteur, sept
    // pages vidéo de suite dans le même onglet épuisaient les 6 connexions
    // par hôte de Chrome : la page suivante restait bloquée (reproduit,
    // check-debordement). En partant, on vide la source — le téléchargement
    // s'arrête — et on repart au retour par « Précédent ».
    const liberer = () => {
      if (!demarree) return;
      demarree = false;
      v.pause();
      v.removeAttribute("src");
      v.load();
      setJoue(false);
    };
    const revenir = (e) => { if (e.persisted && mq.matches === (choix === "portrait")) demarrer(); };
    window.addEventListener("pagehide", liberer);
    window.addEventListener("pageshow", revenir);

    if (document.readyState === "complete") demarrer();
    else window.addEventListener("load", demarrer, { once: true });
    return () => {
      window.removeEventListener("load", demarrer);
      window.removeEventListener("pagehide", liberer);
      window.removeEventListener("pageshow", revenir);
      mq.removeEventListener("change", suivre);
      liberer();
    };
  }, []);

  return (
    <video
      ref={ref}
      className={`hero-video${joue && !masquee ? " est-active" : ""}`}
      muted
      loop
      playsInline
      disablePictureInPicture
      disableRemotePlayback
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      onPlaying={() => setJoue(true)}
    />
  );
}
