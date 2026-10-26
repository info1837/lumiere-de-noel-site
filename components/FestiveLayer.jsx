"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { mouvementReduit, CLASSE_RACINE } from "@/lib/mouvement";

// Les apparitions au défilement — et RIEN D'AUTRE.
//
// ⚠️ PASSE « EFFETS SOBRES » (2026-10-26). Cette couche faisait quatre
// choses : la neige du hero (17 flocons en boucle infinie), la guirlande
// injectée sous l'entête (28 ampoules en cascade), la frise tracée au
// défilement (un écouteur `scroll` sur toute la page), et les apparitions.
// Il ne reste que la dernière, réduite à la règle de l'agence :
//
//   · AU-DESSUS DE LA LIGNE DE FLOTTAISON, RIEN NE S'ANIME. Ce qui est à
//     l'écran au moment où le script tourne est affiché tel quel — pas de
//     fondu sur le hero ni sur le titre.
//   · PLUS BAS : opacité + 10 px de montée, 320 ms, ease-out, UNE fois.
//     Déclenchée tôt (rootMargin de 15 % sous l'écran) : l'élément a fini
//     d'apparaître quand il entre vraiment dans la vue.
//   · CASCADE BORNÉE À TROIS : les éléments qui entrent ensemble se
//     décalent de 0, 60 et 120 ms ; au-delà, tous partent à 120 ms.
//   · MOUVEMENT RÉDUIT : la classe racine n'est pas posée. Aucune
//     animation, rien de masqué.
//   · SANS JAVASCRIPT (ou s'il tarde), rien n'est caché : l'état masqué
//     n'existe que sous `html.mvt`, posé ici.
//
// Plus aucun écouteur de défilement : l'IntersectionObserver ne coûte
// rien pendant que le doigt fait défiler la page.

const PAS_MS = 60;
const CASCADE_MAX = 3;

const TEXTES = "h2, h3, p, .section-lien, .offre-liste li, .frise-etape, a[class*='cta'], button[class*='cta']";

export default function FestiveLayer() {
  // Le calque est monté une fois, dans le layout : sans le chemin en
  // dépendance, une page atteinte par un lien interne n'aurait aucune
  // apparition.
  const chemin = usePathname();

  useEffect(() => {
    if (mouvementReduit() || typeof IntersectionObserver === "undefined") return;
    const racine = document.documentElement;

    const io = new IntersectionObserver((entrees) => {
      let rang = 0;
      for (const e of entrees) {
        if (!e.isIntersecting) continue;
        const el = e.target;
        el.style.setProperty("--rv-d", `${Math.min(rang, CASCADE_MAX - 1) * PAS_MS}ms`);
        el.classList.add("est-la");
        io.unobserve(el);
        rang += 1;
      }
    }, { threshold: 0, rootMargin: "0px 0px 15% 0px" });

    // Le premier écran n'a pas d'apparition : ni le hero du gabarit, ni un
    // premier écran marqué `data-sans-apparition` (/concours).
    const sections = Array.from(document.querySelectorAll("main section"))
      .filter((s) => !s.classList.contains("hero-section") && !s.hasAttribute("data-sans-apparition"));

    // Les photos sont révélées par leur cadre (figure), le texte élément
    // par élément. Rien qui vive déjà dans un bloc révélé : le second
    // décalage s'ajouterait au premier.
    const vus = new Set();
    for (const section of sections) {
      for (const f of section.querySelectorAll("figure")) if (f.querySelector("img")) vus.add(f);
      for (const el of section.querySelectorAll(TEXTES)) if (!el.closest("figure")) vus.add(el);
    }
    const candidats = Array.from(vus).filter((el) => {
      for (let p = el.parentElement; p; p = p.parentElement) if (vus.has(p)) return false;
      return true;
    });

    // ⚠️ TOUTES LES LECTURES D'ABORD, TOUTES LES ÉCRITURES ENSUITE.
    // Lire une position puis poser une classe, en boucle, force le
    // navigateur à recalculer la mise en page à CHAQUE élément — une
    // centaine de fois sur /concours, en plein chargement.
    const vh = window.innerHeight;
    const mesures = candidats.map((el) => el.getBoundingClientRect());

    const masques = [];
    candidats.forEach((el, i) => {
      const r = mesures[i];
      if (r.height <= 8) return;               // séparateurs, pastilles
      if (r.top < vh) return;                  // déjà à l'écran : affiché tel quel
      masques.push(el);
    });
    masques.forEach((el) => { el.classList.add("rv"); io.observe(el); });
    racine.classList.add(CLASSE_RACINE);

    return () => {
      io.disconnect();
      racine.classList.remove(CLASSE_RACINE);
      masques.forEach((el) => el.classList.remove("rv", "est-la"));
    };
  }, [chemin]);

  return null;
}
