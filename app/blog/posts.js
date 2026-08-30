// =============================================================================
// Contenu des articles du blog — bloc-par-bloc (rendu par BlogContent)
// -----------------------------------------------------------------------------
// Types : "p" (paragraphe), "h2", "h3", "ul" (liste), "quote", "cta"
// Le slug doit correspondre à `blogPosts[].slug` dans components/data.js.
// =============================================================================

export const postBodies = {
  "cout-installation-lumieres-de-noel-quebec": [
    { type: "p", text: "Question revenue presque chaque semaine au téléphone : combien ça coûte, l'installation de lumières de Noël au Québec? La réponse honnête : ça dépend. Mais on peut quand même vous donner des fourchettes réelles, celles qu'on facture, et surtout : vous expliquer ce qui fait varier le prix." },

    { type: "h2", text: "Tarif d'entrée résidentiel : à partir de 1 000 $" },
    { type: "p", text: "Pour une résidence québécoise typique — bungalow ou cottage avec une façade, quelques arbustes et une ou deux rangées de toiture — on est généralement entre 1 000 $ et 1 800 $ pour la première saison, matériel et main-d'œuvre inclus, retrait inclus." },
    { type: "p", text: "Les années suivantes, le tarif baisse : le design est déjà conçu, les attaches sont en place, et on connaît votre propriété." },

    { type: "h2", text: "Ce qui fait varier le prix" },
    { type: "ul", items: [
      "La hauteur : un cottage à deux étages demande plus d'équipement et de temps qu'un bungalow.",
      "La longueur de toiture : on calcule au pied linéaire de bordure illuminée.",
      "Le nombre d'arbres et d'arbustes : chaque arbre wrappé = matériel et temps supplémentaires.",
      "Le choix matériel : DEL blanc-chaud, multicolores, ou éclairage RGB programmable.",
      "Le design : façade simple ou « setup magazine » avec rideaux de glace, sapins illuminés, etc.",
    ]},

    { type: "h2", text: "Commercial et municipal : sur soumission" },
    { type: "p", text: "Pour les commerces, restaurants, concessionnaires et bâtiments municipaux, on travaille sur soumission. Les projets varient de 2 500 $ pour une petite vitrine à plus de 25 000 $ pour des illuminations urbaines ou des grands sièges sociaux." },
    { type: "p", text: "Ce qui change le prix : la hauteur du bâtiment, l'accès à l'électricité, les contraintes d'accès, et bien sûr l'envergure du design. La planification hors-heures (soir ou nuit) est aussi un facteur." },

    { type: "h2", text: "Pourquoi payer pour une installation pro?" },
    { type: "p", text: "On comprend la tentation de tout faire soi-même — Costco vend des boîtes de lumières à 50 $. Mais voici ce que vous obtenez en plus avec une installation professionnelle :" },
    { type: "ul", items: [
      "Matériel DEL de qualité commerciale (durée de vie 5×+ supérieure aux lumières grand public).",
      "Le travail en hauteur, c'est notre métier — fini les chutes d'échelle.",  // ASSURANCE
      "Conception personnalisée pour votre propriété, pas une pose aléatoire.",
      "Service après-vente : si une lumière brûle pendant la saison, on revient sans frais.",
      "Retrait inclus en janvier + entreposage du matériel jusqu'à la prochaine saison.",
    ]},

    { type: "h2", text: "Quand réserver pour économiser?" },
    { type: "p", text: "Plus vous réservez tôt (septembre, octobre), plus vous avez de chances d'obtenir un tarif avant que la demande ne sature les équipes. À la dernière minute (mi-novembre), plusieurs entreprises chargent des suppléments d'urgence — quand elles acceptent encore des nouvelles installations." },

    { type: "cta", text: "Une estimation pour votre propriété — gratuite et sans obligation. On vous rappelle rapidement." },
  ],

  "quand-reserver-installation-lumieres-noel": [
    { type: "p", text: "La saison de Noël semble loin en octobre. Mais sur le terrain, c'est exactement le moment idéal pour réserver votre installation de lumières. Voici pourquoi — et ce qui se passe quand vous attendez trop." },

    { type: "h2", text: "La fenêtre idéale : octobre" },
    { type: "p", text: "Octobre est notre mois préféré pour les installations résidentielles. Les feuilles sont tombées (on voit ce qu'on installe), la météo est encore clémente (on travaille en sécurité), et les premières neiges importantes sont encore à 4-6 semaines." },
    { type: "p", text: "Les lumières restent éteintes jusqu'au moment opportun — généralement à la fin novembre. Mais elles sont déjà posées, fonctionnelles et prêtes." },

    { type: "h2", text: "Ce qui se passe quand vous attendez" },
    { type: "h3", text: "Mi-novembre : les agendas se remplissent" },
    { type: "p", text: "Quand la première neige tombe vers la mi-novembre, tout le monde se réveille en même temps. Les téléphones débordent. À ce moment-là, beaucoup d'entreprises sérieuses ont déjà fermé leurs livres pour la saison." },

    { type: "h3", text: "Fin novembre : les conditions deviennent dangereuses" },
    { type: "p", text: "Glace sur les toits, neige sur les échelles, températures sous zéro. Notre équipe travaille dans ces conditions — c'est le métier — mais ça ralentit tout. Une installation qui prendrait 3 h en octobre peut prendre 5-6 h en décembre." },

    { type: "h3", text: "Décembre : on refuse des appels" },
    { type: "p", text: "À ce stade, on n'accepte plus de nouveaux clients pour cette saison. Trop de risques de ne pas livrer à temps, ou de livrer dans des conditions qu'on ne juge pas acceptables." },

    { type: "h2", text: "Le réflexe à adopter" },
    { type: "p", text: "Réservez dès septembre si vous le pouvez. Sinon, octobre. Si vous lisez ceci en novembre : appelez quand même — on garde toujours quelques fenêtres — on vous dira franchement ce qui reste." },

    { type: "ul", items: [
      "Septembre : meilleure sélection de dates, équipes disponibles, conditions parfaites.",
      "Octobre : encore d'excellentes disponibilités, météo douce.",
      "Mi-novembre : possible mais les meilleurs créneaux sont partis.",
      "Décembre : disponibilités limitées — appelez pour valider.",
    ]},

    { type: "h2", text: "Et pour le commercial?" },
    { type: "p", text: "Pour les commerces, nous suggérons de réserver encore plus tôt — idéalement en août ou septembre. Les façades commerciales demandent souvent une planification (permis, accès, alimentation électrique) qui ne se fait pas du jour au lendemain." },

    { type: "cta", text: "Réservez votre date maintenant — soumission gratuite, aucune obligation." },
  ],

  "del-vs-incandescent-lumieres-noel": [
    { type: "p", text: "DEL ou incandescent? Pour les lumières de Noël, le débat est en réalité réglé depuis plusieurs années — mais beaucoup de gens hésitent encore à cause du « rendu visuel » qu'ils associent aux vieilles ampoules. Voici un comparatif honnête, basé sur ce qu'on installe." },

    { type: "h2", text: "Consommation : avantage massif aux DEL" },
    { type: "p", text: "Une guirlande DEL commerciale consomme environ 8 à 12 % de l'électricité d'une guirlande incandescente équivalente. Sur une saison complète d'illumination — disons 6 semaines, 8 h/jour — la différence sur votre facture Hydro se situe autour de 30 à 50 $ pour une résidence moyennement décorée." },

    { type: "h2", text: "Durée de vie : 5 à 10× plus longue" },
    { type: "p", text: "Une DEL de qualité commerciale est conçue pour 25 000 à 50 000 heures d'utilisation. Une ampoule incandescente : 1 000 à 3 000 heures. En pratique, ça veut dire qu'on remplace les DEL aux 8-10 saisons, alors que l'incandescent se remplace presque chaque année." },

    { type: "h2", text: "Sécurité : les DEL gagnent encore" },
    { type: "p", text: "Les ampoules incandescentes chauffent — beaucoup. Posées contre des branches sèches ou des matériaux inflammables, elles ont historiquement causé des incendies. Les DEL restent froides, même après des heures d'utilisation, et acceptent des branchements en série beaucoup plus longs sans risque." },

    { type: "h2", text: "Le rendu visuel : l'argument des sceptiques" },
    { type: "p", text: "Beaucoup de gens disent : « Mais les DEL, ça fait froid, c'est trop blanc, c'est pas la même chaleur. » C'était vrai il y a 15 ans. Aujourd'hui, les DEL de qualité commerciale sont calibrées en blanc-chaud (2 700 K à 3 000 K) qui imite exactement la teinte d'une ampoule incandescente." },
    { type: "p", text: "Côte à côte, la différence est très difficile à voir entre l'incandescent et une DEL blanc-chaud commerciale, sauf en regardant l'ampoule de très près." },

    { type: "h2", text: "Tableau récapitulatif" },
    { type: "ul", items: [
      "Consommation : DEL ~10 % de l'incandescent.",
      "Durée de vie : DEL 25-50k h vs incandescent 1-3k h.",
      "Sécurité : DEL froides ; incandescent chaudes.",
      "Rendu : équivalent en blanc-chaud commercial moderne.",
      "Coût initial : DEL légèrement plus cher (mais amorti en 1-2 saisons).",
      "Variantes : DEL disponibles en RGB programmable — impossible en incandescent.",
    ]},

    { type: "h2", text: "Ce qu'on installe" },
    { type: "p", text: "Chez Solution Lumière de Noël inc., on installe exclusivement des DEL de qualité commerciale, blanc-chaud ou multicolores selon le goût. Pour l'éclairage architectural permanent, on va plus loin avec des pastilles RGB programmables qui changent de couleur selon l'occasion." },

    { type: "cta", text: "Soumission gratuite pour votre installation DEL — résidentiel ou commercial." },
  ],
};

// Petit composant de rendu — utilisé par /blog/[slug]/page.jsx
export function BlogContent({ blocks }) {
  if (!blocks) return null;
  return (
    <div className="blog-content">
      {blocks.map((b, i) => {
        if (b.type === "h2") return <h2 key={i} className="blog-h2">{b.text}</h2>;
        if (b.type === "h3") return <h3 key={i} className="blog-h3">{b.text}</h3>;
        if (b.type === "ul") return (
          <ul key={i} className="blog-ul">
            {b.items.map((it, j) => <li key={j}>{it}</li>)}
          </ul>
        );
        if (b.type === "quote") return <blockquote key={i} className="blog-quote">{b.text}</blockquote>;
        if (b.type === "cta") return <p key={i} className="blog-cta">{b.text}</p>;
        return <p key={i} className="blog-p">{b.text}</p>;
      })}
    </div>
  );
}
