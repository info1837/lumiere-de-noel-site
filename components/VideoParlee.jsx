// Une vidéo verticale de Yahir qui PARLE (V12 garantie, V17 fondateur).
//
// Pas d'autoplay : c'est une vidéo avec du son, le visiteur la lance. Rien
// n'est téléchargé avant le clic (preload="none") — seule l'affiche, une
// image de ~70 Ko, est chargée paresseusement. Aucune animation : le cadre
// est immobile, les contrôles sont ceux du navigateur.
export default function VideoParlee({ src, affiche, titre, legende }) {
  return (
    <figure className="video-parlee">
      <video
        controls
        playsInline
        preload="none"
        poster={affiche}
        aria-label={titre}
      >
        <source src={src} type="video/mp4" />
      </video>
      {legende && <figcaption>{legende}</figcaption>}
    </figure>
  );
}
