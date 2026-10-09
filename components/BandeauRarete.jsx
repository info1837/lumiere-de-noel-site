"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import MesureBandeau from "@/components/MesureBandeau";
import { ligneSaison } from "@/lib/season";

// La valeur retenue pour la durée de la visite. `session` et non `local` :
// le chiffre change toutes les heures, et un onglet rouvert demain doit
// repartir de zéro plutôt que d'afficher la capacité d'hier.
const CLE_SESSION = "lumiere:dispos";

// La ligne de saison — le premier fait que le visiteur lit.
//
// ⚠️ ELLE N'EXISTE QUE SI ELLE EST VRAIE.
//
// Quand le CRM ne répond pas, ou que la capacité n'est pas configurée, ce
// composant rend `null` : pas de barre, pas de squelette, pas de « quelques
// dates encore disponibles ». Une page sans barre ne dit rien ; une page
// avec un chiffre inventé dit quelque chose de faux, et le visiteur qui s'en
// aperçoit doute ensuite du prix.
//
// ⚠️ ELLE EST « use client » POUR UNE SEULE RAISON : LA COHÉRENCE.
//
// Le chiffre arrive du LAYOUT, qui l'a lu côté serveur — c'est ce rendu-là
// qui part dans l'HTML, donc le SEO et le sans-JavaScript voient la ligne.
// Mais le cache de PAGE de Next est par route : l'accueil pouvait porter
// « 26 places » pendant que /simulateur portait encore « 30 places », à une
// heure d'écart. Après hydratation, chaque page se resynchronise sur
// /api/disponibilites — la même réponse pour tout le monde.
//
// Le fond n'est plus ambre. L'ambre est la couleur de la LUMIÈRE sur ce
// site : elle sert aux points qui brillent et aux états actifs, pas aux
// aplats. Une bande jaune pleine largeur en haut de chaque page lisait
// comme un avertissement de navigateur.
export default function BandeauRarete({ rarete }) {
  const [msg, setMsg] = useState(rarete);

  useEffect(() => {
    // ⚠️ On ne resynchronise QUE si le serveur avait déjà quelque chose.
    //
    // Si le serveur a rendu `null`, le layout n'a pas posé `avec-bandeau`
    // sur le <body> : faire apparaître la barre ici la mettrait PAR-DESSUS
    // l'en-tête, sans le décalage qui lui fait sa place. Le cas qu'on
    // répare est la DÉRIVE entre deux pages, pas l'absence.
    if (!rarete) return;

    // ⚠️ UNE SEULE LECTURE PAR VISITE.
    //
    // Le but est que toutes les pages affichent le MÊME chiffre, pas que
    // chaque page aille le redemander. La première page de la visite lit,
    // les suivantes reprennent ce qu'elle a trouvé. Un visiteur qui
    // parcourt six pages faisait six appels pour une donnée qui change
    // une fois l'heure.
    let vivant = true;
    try {
      const garde = sessionStorage.getItem(CLE_SESSION);
      if (garde) { setMsg(JSON.parse(garde)); return; }
    } catch { /* navigation privée, stockage refusé : on lit, c'est tout */ }

    // ⚠️ PAS D'AbortController ICI, ET C'EST DÉLIBÉRÉ.
    //
    // La version précédente annulait la requête au démontage. Mesuré :
    // l'entrée annulée restait comptée comme « en vol » par le navigateur,
    // la page n'atteignait jamais `networkidle`, et
    // scripts/check-logo.mjs — qui enchaîne treize routes sur un même
    // onglet — expirait au bout de 30 s. Annuler ne faisait rien gagner
    // sur 2 Ko de JSON ; on laisse donc la requête finir et on se contente
    // d'ignorer le résultat si le composant est parti.
    fetch("/api/disponibilites")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d || !d.rarete) return;
        try { sessionStorage.setItem(CLE_SESSION, JSON.stringify(d.rarete)); } catch { /* tant pis */ }
        if (vivant) setMsg(d.rarete);
      })
      .catch(() => {});
    return () => { vivant = false; };
  }, [rarete]);

  if (!msg) return null;

  const segments = ligneSaison(msg);
  if (!segments) return null;

  return (
    <div className="bandeau-rarete" role="status" aria-live="polite">
      {/* La hauteur réelle, posée sur --bandeau-h. C'est elle qui décale
          l'en-tête flottant — un chiffre écrit en dur se trompait de 24 px
          sur téléphone, et la pilule recouvrait la barre. */}
      <MesureBandeau />
      <div className="bandeau-rarete__contenu">
        {/* Le point ambre : la seule lumière de la barre. Il respire, il ne
            clignote pas — un point qui bat vite ressemble à une alarme. */}
        <span className="bandeau-rarete__pastille" aria-hidden="true" />
        {/* UNE phrase, composée par lib/season.js. Avant, chaque surface
            écrivait la sienne et elles se contredisaient. */}
        {segments.map((seg, i) => (
          <span
            key={seg}
            className={`bandeau-rarete__seg${i === 0 ? " bandeau-rarete__seg--marque" : ""}`}
          >
            {seg}
          </span>
        ))}
        {msg.listeAttente && (
          <Link href="/soumission?liste-attente=1" className="bandeau-rarete__lien">
            Liste d’attente
          </Link>
        )}
      </div>
    </div>
  );
}
