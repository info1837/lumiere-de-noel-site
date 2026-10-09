import PhotoCellulaire from "./PhotoCellulaire";

export const metadata = {
  title: "Envoyer la photo",
  // 🚨 JAMAIS INDEXÉE. Cette page n'existe que pendant quinze minutes, pour un
  // visiteur précis, et son URL porte un code. Elle n'a rien à faire dans un
  // index — et un code moissonné par un robot serait un code brûlé.
  robots: { index: false, follow: false, nocache: true },
};

/*
 * 🚨 PAGE NUE : ni bandeau, ni entête, ni menu, ni pied de page.
 *
 * Quelqu'un est debout dehors devant sa maison, au froid, avec quinze minutes
 * pour envoyer une photo. Un menu « Nos services » est une sortie de route,
 * pas une commodité : s'il le suit, il perd son code et l'écran resté ouvert
 * sur son ordinateur attend pour rien.
 *
 * POURQUOI DU CSS ET PAS UNE MISE EN PAGE À PART. Le chrome est monté dans
 * `app/layout.jsx`, qui est la racine : un `layout.jsx` imbriqué ici ne peut
 * pas le retirer. Le faire disparaître proprement demanderait soit de rendre
 * NavBar, BandeauRarete, ServerFooter et MobileBottomBar conditionnels — donc
 * de toucher quatre composants partagés par les quarante pages d'un site en
 * production, pour une seule page éphémère — soit de découper tout le dépôt en
 * groupes de routes avec deux racines. Les deux coûtent plus cher que ce
 * qu'ils achètent.
 *
 * `display: none` ne se contente pas de cacher : l'élément sort du flux, de
 * l'ordre de tabulation ET de l'arbre d'accessibilité. Aucun de ces liens
 * n'est donc atteignable, ni au doigt, ni au clavier, ni au lecteur d'écran.
 * Le `padding-top` du bandeau est remis à zéro avec lui, sans quoi la page
 * s'ouvrirait sur 40 px de vide.
 *
 * ⚠️ `.tiroir` est dans la liste pour une raison qu'on ne voit pas à l'écran :
 * le menu mobile ne vit PAS dans l'entête, c'est un frère du <main> dans le
 * <body>, et fermé il est seulement décalé par une transformation. Ses huit
 * liens gardaient donc un rectangle, une place dans l'ordre de tabulation et
 * une voix chez les lecteurs d'écran. Mesuré : huit liens encore atteignables
 * alors que l'entête avait bien disparu.
 */
const PAGE_NUE = `
  body.avec-bandeau { padding-top: 0; }
  .bandeau-rarete, .entete-pilule, .mobile-bottom-bar, .skip-link,
  .tiroir, body > footer { display: none !important; }
`;

export default function PageEnvoyerPhoto({ searchParams }) {
  // Le code arrive par ?t= ; /p/CODE redirige ici. On ne fait que le passer au
  // composant : c'est le CRM qui le valide, jamais le navigateur.
  const code = typeof searchParams?.t === "string" ? searchParams.t : "";
  return (
    <>
      {/* ⚠️ `dangerouslySetInnerHTML`, et non `<style>{PAGE_NUE}</style>`.
          Le rendu serveur de React ÉCHAPPE le texte d'un <style> : le « > »
          de `body > footer` part en « &gt; », le client écrit « > », et
          l'hydratation échoue. Mesuré : React jetait TOUT le HTML du serveur
          pour re-rendre la page côté client — « The server HTML was replaced
          with client content in <#document> ». Le contenu est une constante
          de ce fichier, pas une entrée. */}
      <style dangerouslySetInnerHTML={{ __html: PAGE_NUE }} />
      <section className="section-y-moyen" style={{ background: "#0A1524", minHeight: "100vh" }}>
        <div className="container" style={{ maxWidth: 480 }}>
          <PhotoCellulaire code={code} />
        </div>
      </section>
    </>
  );
}
