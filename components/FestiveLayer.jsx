"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Ambiance festive. Deux règles, une par chose qui bouge.
//
// 1. LA NEIGE NE TOMBE QUE DANS LE HERO. Elle était `position: fixed` sur le
//    viewport : elle suivait le visiteur jusque dans le formulaire et jusqu'au
//    pied de page. De la neige derrière un champ « Téléphone », ce n'est plus
//    une ambiance, c'est du bruit. Elle vit maintenant DANS la section du
//    hero, par un portail — mesuré : 34 flocons partout avant, 17 dans le
//    hero seul après, et deux fois plus lents.
//
// 2. LES APPARITIONS NE PORTENT PLUS SUR LES SECTIONS ENTIÈRES, mais sur le
//    titre de la section et son image maîtresse. Faire monter un bloc de
//    1 800 px de haut, c'est faire attendre le lecteur ; faire apparaître son
//    titre, c'est lui montrer où regarder.
//
// Et jamais deux fois le même effet d'affilée.

const FLOCONS = 17;                         // 34 avant

// A · B · C · B · A · B · C · B … — la séquence revient sur B entre chaque
// effet fort, donc aucun voisin ne se répète.
const EFFETS = ["reveal--a", "reveal--b", "reveal--c", "reveal--b"];

export default function FestiveLayer() {
  const [hero, setHero] = useState(null);

  useEffect(() => {
    // Rien ne bouge pour qui a demandé que rien ne bouge : on n'ajoute aucune
    // classe, donc rien n'est masqué en attendant une apparition qui ne
    // viendra pas.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setHero(document.querySelector(".hero-section"));

    const io = new IntersectionObserver(
      (entrees) => {
        entrees.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-visible");
          io.unobserve(e.target);           // une seule fois par élément
        });
      },
      { threshold: 0.2 }
    );

    const vh = window.innerHeight;
    const sections = Array.from(document.querySelectorAll("main section"))
      // Le hero est le premier écran : il est déjà là quand on arrive. Le
      // faire apparaître ferait clignoter la page à l'ouverture.
      .filter((s) => !s.classList.contains("hero-section"));

    // ⚠️ Le compteur n'avance QUE pour les sections qui reçoivent un effet.
    // Indexer sur la position de la section faisait sauter des cases pour
    // celles qui n'ont ni titre ni image — et deux sections voisines
    // tombaient alors sur le même effet, exactement ce qu'on veut éviter.
    let rang = 0;

    sections.forEach((section) => {
      const cibles = [];

      const titre = section.querySelector("h2");
      if (titre) cibles.push(titre);

      // L'image MAÎTRESSE, pas les vignettes ni les fonds : une image de fond
      // en position absolue qui s'éclaircit, c'est la page qui clignote.
      const image = Array.from(section.querySelectorAll("img")).find((img) => {
        const r = img.getBoundingClientRect();
        return r.height >= 140 && getComputedStyle(img).position !== "absolute";
      });
      if (image) cibles.push(image);
      if (!cibles.length) return;

      const effet = EFFETS[rang % EFFETS.length];
      rang += 1;

      cibles.forEach((c) => {
        c.classList.add("reveal", effet);
        if (c.getBoundingClientRect().top < vh * 0.9) {
          c.classList.add("is-visible");    // déjà à l'écran : aucun flash
        } else {
          io.observe(c);
        }
      });
    });

    return () => io.disconnect();
  }, []);

  if (!hero) return null;

  const flocons = Array.from({ length: FLOCONS }, (_, i) => {
    const taille = 2 + (i % 4);
    const gauche = (i * 97) % 100;
    const duree = 18 + (i % 7) * 4;          // 9–21 s avant, 18–42 s maintenant
    const retard = -((i * 1.7) % 12);
    const dx = ((i % 5) - 2) * 16;
    const o = 0.32 + (i % 4) * 0.08;
    return (
      <span
        key={i}
        className="flake"
        style={{
          left: `${gauche}%`,
          width: taille,
          height: taille,
          animationDuration: `${duree}s`,
          animationDelay: `${retard}s`,
          "--dx": `${dx}px`,
          "--o": o,
        }}
      />
    );
  });

  return createPortal(
    <div className="snow" aria-hidden="true">{flocons}</div>,
    hero
  );
}
