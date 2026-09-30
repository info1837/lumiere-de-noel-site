"use client";
import { useEffect } from "react";

// La hauteur du bandeau, MESURÉE plutôt que devinée.
//
// ⚠️ Elle change avec le contenu, pas seulement avec la largeur.
// « Octobre : 35 dates restantes, −15 % · Novembre : 34 dates » tient sur
// deux lignes à 390 px ; « Novembre : 4 dates » tiendra sur une. Et le jour
// où octobre se remplit, la ligne raccourcit d'un coup.
//
// Un chiffre écrit en dur dans le CSS était faux de 24 px dès le premier
// essai sur téléphone — l'en-tête se replaçait à 70 px pendant que le
// bandeau en faisait 86, donc PAR-DESSUS. C'est exactement le défaut qu'on
// répare.
//
// Le CSS garde une valeur de départ proche : elle évite le sursaut avant
// que ce script tourne. Ensuite c'est la mesure qui décide.
export default function MesureBandeau() {
  useEffect(() => {
    const barre = document.querySelector(".bandeau-rarete");
    if (!barre) return;

    const poser = () => {
      const h = Math.ceil(barre.getBoundingClientRect().height);
      if (h > 0) document.documentElement.style.setProperty("--bandeau-h", `${h}px`);
    };
    poser();

    // Le texte se replie quand la fenêtre change, et les polices arrivent
    // après le premier rendu : les deux changent la hauteur.
    const ro = new ResizeObserver(poser);
    ro.observe(barre);
    if (document.fonts?.ready) document.fonts.ready.then(poser).catch(() => {});

    return () => ro.disconnect();
  }, []);

  return null;
}
