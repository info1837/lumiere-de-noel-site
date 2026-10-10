"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { mouvementReduit, CLASSE_RACINE, surDefilement, borner } from "@/lib/mouvement";

// La couche qui fait vivre la page.
//
// Elle fait deux choses qui n'ont rien à voir, et c'est volontaire :
// elles partagent le même garde (`prefers-reduced-motion`) et le même
// cycle de vie, et les séparer donnerait deux composants qui doivent se
// surveiller l'un l'autre.
//
//   1. LA NEIGE NE TOMBE QUE DANS LE HERO. Elle était `position: fixed`
//      sur le viewport : elle suivait le visiteur jusque dans le
//      formulaire. De la neige derrière un champ « Téléphone », ce n'est
//      plus une ambiance, c'est du bruit. 17 flocons, deux fois plus
//      lents, dans le premier écran seulement.
//
//   2. TOUT CE QUI S'ALLUME AU DÉFILEMENT. Apparitions, guirlande du
//      hero, frise qui se trace, compteur d'avis.
//
// ⚠️ « MOUVEMENT RÉDUIT » VEUT DIRE « RIEN NE BOUGE », PAS « RIEN ».
// La première version sortait d'ici dès que `prefers-reduced-motion`
// était actif : aucune classe, aucun effet. Sur un Mac où « Réduire les
// animations » est coché — un réglage courant, pas un cas rare — le site
// paraissait mort. Désormais la classe est posée dans les deux cas, et
// c'est la feuille (`@media (prefers-reduced-motion: reduce)`) qui garde
// les FONDUS (300 ms, opacité seule) en retirant tout déplacement — pas
// de montée, pas de dézoom, pas de découpage. Ici : pas de séquence
// d'ampoules, pas de neige, et le compteur affiche le chiffre final.
//
// ⚠️ L'ÉTAT MASQUÉ EST POSÉ PAR CE SCRIPT, JAMAIS PAR LA FEUILLE SEULE.
// Toutes les règles d'apparition sont préfixées `html.mvt`, et c'est ici
// qu'on pose la classe. Si ce fichier ne s'exécute pas — erreur,
// bloqueur, réseau coupé en plein chargement — la page s'affiche
// entière. Masquer du contenu en pariant sur un script, c'est accepter
// qu'il disparaisse le jour où le pari est perdu.

const FLOCONS = 17;

// Combien d'ampoules sous l'entête du hero. Un nombre pair et rond : on
// les répartit en `space-between`, donc elles tombent juste à toutes les
// largeurs.
//
// ⚠️ IL N'Y A PLUS DE GUIRLANDE DE PROGRESSION. Elle courait sous
// l'entête sur toute la page : 40 ampoules qui changeaient à chaque
// geste, collées au contenu qui défilait dessous. Les ampoules ne vivent
// plus que dans deux moments — le hero qui s'allume, et les points de la
// frise. Une lumière partout n'est plus une lumière.
const AMPOULES_HERO = 28;

/** Le décalage entre deux apparitions d'un même groupe. */
const PAS_MS = 60;

export default function FestiveLayer() {
  const [hero, setHero] = useState(null);

  useEffect(() => {
    // Mouvement réduit : la classe racine est posée quand même — les
    // fondus en dépendent — mais la feuille retire tout déplacement, et
    // la neige n'est pas rendue.
    const doux = mouvementReduit();
    const racine = document.documentElement;
    racine.classList.add(CLASSE_RACINE);
    if (!doux) setHero(document.querySelector(".hero-section"));

    const nettoyages = [];

    // ── 1 · Les apparitions ──────────────────────────────────────────
    //
    // Le texte monte de 16 px en fondu, les photos se dévoilent au
    // découpage. Une seule fois par élément.
    const io = new IntersectionObserver((entrees) => {
      entrees.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("est-la");
        io.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    nettoyages.push(() => io.disconnect());

    const vh = window.innerHeight;
    const sections = Array.from(document.querySelectorAll("main section"))
      // Le hero est le premier écran : il a sa propre entrée (la photo
      // qui s'allume). Le faire monter ferait clignoter la page.
      .filter((s) => !s.classList.contains("hero-section"));

    for (const section of sections) {
      // Le texte : titres, paragraphes, boutons. Dans l'ordre du
      // document, pour que le décalage suive la lecture.
      const textes = Array.from(section.querySelectorAll(
        "h2, h3, p, .section-lien, .offre-liste li, .frise-etape, a[class*='cta'], button[class*='cta']",
      )).filter((el) => {
        // Rien qui vive déjà dans un bloc révélé : on révélerait deux
        // fois, et le second décalage s'ajouterait au premier.
        if (el.closest(".rv-t, .rv-p")) return false;
        // Rien d'invisible ni de minuscule (séparateurs, pastilles).
        const r = el.getBoundingClientRect();
        return r.height > 8;
      });

      // Les photos : on observe le PARENT, jamais l'image découpée.
      const photos = Array.from(section.querySelectorAll("figure, .revel"))
        .filter((f) => f.querySelector("img"));

      let rang = 0;
      const poser = (el, classe) => {
        el.classList.add(classe);
        el.style.setProperty("--rv-d", `${Math.min(rang, 6) * PAS_MS}ms`);
        rang += 1;
        // Déjà à l'écran au chargement : on l'affiche sans animer. Un
        // élément qu'on masque pour l'animer alors qu'il est DÉJÀ sous
        // les yeux, c'est un clignotement, pas une apparition.
        if (el.getBoundingClientRect().top < vh * 0.92) el.classList.add("est-la");
        else io.observe(el);
      };

      photos.forEach((f) => poser(f, "rv-p"));
      textes.forEach((el) => poser(el, "rv-t"));
    }

    // ── 2 · La guirlande du hero ─────────────────────────────────────
    const heroEl = document.querySelector(".hero-section");
    if (heroEl && !heroEl.querySelector(".hero-guirlande")) {
      const g = document.createElement("div");
      g.className = "hero-guirlande";
      g.setAttribute("aria-hidden", "true");
      for (let i = 0; i < AMPOULES_HERO; i++) {
        const b = document.createElement("span");
        // Gauche → droite : 34 ms par ampoule, ~0,95 s pour la rangée,
        // donc elle finit en même temps que la photo s'éclaircit. En
        // mouvement réduit, pas de séquence : elles s'allument ensemble.
        b.style.setProperty("--amp-d", doux ? "0ms" : `${i * 34}ms`);
        g.appendChild(b);
      }
      heroEl.appendChild(g);
      nettoyages.push(() => g.remove());
    }

    // ── 3 · La frise se trace ────────────────────────────────────────
    const frise = document.querySelector(".frise");
    const etapes = frise ? Array.from(frise.querySelectorAll(".frise-etape")) : [];

    const auDefilement = () => {
      // La frise se trace, et chaque point s'allume quand elle
      // l'atteint. En mouvement réduit le filet est entier d'emblée (la
      // feuille ignore --frise-p) : seuls les points changent d'état.
      if (frise && etapes.length) {
        const r = frise.getBoundingClientRect();
        const vh2 = window.innerHeight || 1;
        // 0 quand la frise arrive au tiers bas de l'écran, 1 quand elle
        // atteint le milieu : le tracé se fait pendant qu'on la regarde,
        // pas pendant qu'elle est encore en bas.
        const q = borner((vh2 * 0.85 - r.top) / Math.max(1, r.height + vh2 * 0.25), 0, 1);
        frise.style.setProperty("--frise-p", String(q));
        etapes.forEach((e, i) => {
          e.classList.toggle("atteinte", q >= (i + 0.5) / etapes.length);
        });
      }
    };
    nettoyages.push(surDefilement(auDefilement));

    // ── 4 · « 100+ avis » se compte ──────────────────────────────────
    const avis = document.querySelector(".hero-ligne a, .hero-ligne strong");
    if (avis && /\d/.test(avis.textContent || "")) {
      const texte = avis.textContent;
      const cible = parseInt(texte.match(/\d+/)?.[0] || "0", 10);
      // En mouvement réduit, le chiffre final est déjà dans le HTML :
      // on n'y touche pas.
      if (cible > 0 && !doux) {
        const debut = performance.now();
        const duree = 1100;
        let frame = 0;
        const pas = (t) => {
          const x = borner((t - debut) / duree, 0, 1);
          // Sortie douce : le compteur ralentit en arrivant, il ne
          // s'arrête pas net.
          const e = 1 - (1 - x) ** 3;
          avis.textContent = texte.replace(/\d+/, String(Math.round(cible * e)));
          if (x < 1) frame = requestAnimationFrame(pas);
        };
        frame = requestAnimationFrame(pas);
        nettoyages.push(() => {
          cancelAnimationFrame(frame);
          avis.textContent = texte;   // on rend le texte exact au démontage
        });
      }
    }

    return () => {
      nettoyages.forEach((f) => { try { f(); } catch { /* démontage */ } });
      racine.classList.remove(CLASSE_RACINE);
    };
  }, []);

  if (!hero) return null;

  const flocons = Array.from({ length: FLOCONS }, (_, i) => {
    const taille = 2 + (i % 4);
    const gauche = (i * 97) % 100;
    const duree = 18 + (i % 7) * 4;
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
    hero,
  );
}
