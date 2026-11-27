"use client";
import { useEffect, useState } from "react";

// =============================================================================
// Rendre des images SOUS le premier écran seulement après `load` (2026-11-26)
// =============================================================================
// Pourquoi : `loading="lazy"` ne suffit pas sous un hero. Chrome commence les
// images différées à ~2 500 px de l'écran sur une connexion lente : la bande
// et la galerie de la page commerciale (sept photos, ~220 Ko) partaient EN
// MÊME TEMPS que l'affiche du hero et lui volaient la bande passante. Mesuré
// en production (ordinateur, 1,6 Mb/s, 150 ms) : LCP 2,46 s → 3,11 s avec les
// photos du lot 2, 2,5 s en les bloquant.
//
// Ici : rien n'est demandé avant l'événement `load` (qui suit l'image LCP).
// `reserve` occupe la place en attendant — la boîte parente porte déjà la
// taille (aucun décalage de mise en page) — et peut contenir un <noscript>
// avec la vraie <img> : les robots et `check:usage` lisent l'image dans le HTML.
// =============================================================================
export default function ApresChargement({ children, reserve = null }) {
  const [pret, setPret] = useState(false);
  useEffect(() => {
    const go = () => setPret(true);
    if (document.readyState === "complete") { go(); return undefined; }
    window.addEventListener("load", go, { once: true });
    return () => window.removeEventListener("load", go);
  }, []);
  return pret ? children : reserve;
}
