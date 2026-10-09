"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

// Le curseur qui allume la maison.
//
// ⚠️ CE N'EST PAS UN « AVANT / APRÈS », ET C'EST VOLONTAIRE.
//
// Les 23 photos du dépôt sont TOUTES des photos de soir, prises après
// installation. Il n'existe aucune photo de jour, ni de façade éteinte, de
// la même maison — le dossier /images/demos/ prévu pour ça n'a jamais été
// livré. Fabriquer un « avant » en assombrissant une photo de nuit, puis le
// légender « avant installation », serait exactement le genre
// d'affirmation que ce dépôt traque ailleurs (voir AUDIT-AFFIRMATIONS.md et
// la règle `estReelle` de components/photos.js).
//
// Ce composant montre donc ce qu'il montre vraiment : la MÊME photo, au
// crépuscule puis illuminée. Le geste raconte « voyez la lumière arriver »
// sans prétendre montrer un chantier avant travaux. Le côté sombre est
// obtenu par filtre CSS sur l'image réelle, et les étiquettes le disent.
//
// Le jour où une vraie paire jour/soir d'une même adresse entre au dépôt,
// `photoAvant` accepte une deuxième source et les étiquettes changent — la
// mécanique du curseur, elle, ne bouge pas.
export default function RevelationLumiere({
  photo,              // { src, alt } — la photo illuminée, réelle
  photoAvant = null,  // { src, alt } — une vraie photo de jour, si elle existe un jour
  legende = null,     // la ville, par exemple
  depart = 38,        // position initiale du curseur, en %
  hauteur = "clamp(280px, 58vw, 560px)",
}) {
  const [position, setPosition] = useState(depart);
  const [aBouge, setABouge] = useState(false);
  const cadre = useRef(null);
  // L'id de la frame vit dans un ref : le nettoyage de l'effet doit pouvoir
  // l'annuler, et il est créé dans le callback de l'observateur — dont la
  // valeur de retour, elle, n'est pas un nettoyage.
  const frame = useRef(0);

  // Un seul balayage, la première fois que le cadre entre dans l'écran :
  // il montre que la poignée se déplace. Ensuite plus jamais — une
  // animation qui boucle sur une page calme devient du clignotement
  // (voir scripts/check-rien-ne-boucle.mjs).
  useEffect(() => {
    if (aBouge) return;
    const el = cadre.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver((entrees) => {
      if (!entrees[0]?.isIntersecting) return;
      io.disconnect();
      const debut = performance.now();
      const duree = 1100;
      const de = depart;
      const vers = 72;
      const pas = (t) => {
        const p = Math.min(1, (t - debut) / duree);
        // Sortie douce : la poignée ralentit en arrivant.
        const e = 1 - (1 - p) ** 3;
        setPosition(de + (vers - de) * e);
        if (p < 1) frame.current = requestAnimationFrame(pas);
      };
      frame.current = requestAnimationFrame(pas);
    }, { threshold: 0.35 });

    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(frame.current); };
  }, [aBouge, depart]);

  const bouger = (v) => { setABouge(true); setPosition(v); };

  return (
    <figure className="revel" ref={cadre} style={{ "--revel-h": hauteur, "--revel-pos": `${position}%` }}>
      <div className="revel-cadre">
        {/* ── Le côté sombre ───────────────────────────────────────────
            Soit une vraie photo de jour (si elle existe), soit la même
            photo passée au crépuscule par filtre. Dans les deux cas,
            c'est une image RÉELLE de ce chantier. */}
        {photoAvant ? (
          <Image className="revel-img" src={photoAvant.src} alt={photoAvant.alt}
            fill sizes="(max-width: 900px) 100vw, 900px" style={{ objectFit: "cover" }} />
        ) : (
          <Image className="revel-img revel-img--crepuscule" src={photo.src} alt="" aria-hidden
            fill sizes="(max-width: 900px) 100vw, 900px" style={{ objectFit: "cover" }} />
        )}

        {/* ── Le côté illuminé, révélé par la largeur ──────────────── */}
        {/* ⚠️ Le découpage se fait au `clip-path`, PAS à la largeur.
            Le motif de .sim-apres (largeur variable + `img { width: 100vw;
            max-width: 560px }`) marche parce que ce conteneur-là a une
            largeur connue écrite en dur. Ici le cadre est fluide : une
            largeur variable écraserait l'image au lieu de la révéler. Le
            clip garde les deux calques à taille réelle.
            L'IntersectionObserver est posé sur le <figure>, un ancêtre
            jamais découpé — un observateur sur l'élément clippé, lui, ne se
            déclencherait jamais. */}
        <div className="revel-apres">
          <Image className="revel-img" src={photo.src} alt={photo.alt}
            fill sizes="(max-width: 900px) 100vw, 900px" style={{ objectFit: "cover" }} />
        </div>

        {/* La couture lumineuse — le seul ambre de la section. */}
        <span className="revel-couture" aria-hidden="true">
          <span className="revel-poignee">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6 4 12l5 6M15 6l5 6-5 6" stroke="currentColor" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </span>

        <span className="revel-etiq revel-etiq--gauche" aria-hidden="true">
          {photoAvant ? "De jour" : "Au crépuscule"}
        </span>
        <span className="revel-etiq revel-etiq--droite" aria-hidden="true">Illuminée</span>

        {/* ⚠️ Le vrai contrôle est un <input type="range"> : il est au
            clavier, il est annoncé, et il marche sans JavaScript de
            glissement. La poignée dessinée n'est que son costume. */}
        <input
          className="revel-curseur"
          type="range" min="0" max="100" step="0.5"
          value={position}
          aria-label="Glisser pour illuminer la maison"
          onChange={(e) => bouger(Number(e.target.value))}
        />
      </div>
      {legende && <figcaption className="revel-legende">{legende}</figcaption>}
    </figure>
  );
}
