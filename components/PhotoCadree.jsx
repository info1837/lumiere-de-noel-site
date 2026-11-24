import Image, { getImageProps } from "next/image";
import { flouDe } from "@/components/photos-flou";

// =============================================================================
// Une photo du registre, dans le BON CADRAGE pour la boîte qui la reçoit
// =============================================================================
// Les photos de la saison 2026 existent en trois cadrages (components/photos.js :
// l'entière, `paysage` 16:9, `portrait` 4:5). Une boîte large (carte, hero sur
// ordinateur) reçoit le 16:9 ; la même boîte devenue haute sur téléphone reçoit
// le 4:5 — au lieu de laisser `object-fit: cover` tailler au hasard dans une
// photo verticale, ou de télécharger une photo entière pour n'en montrer
// qu'une bande.
//
//   <PhotoCadree photo={PHOTOS["s26-balcon"]} sizes="…" />
//   <PhotoCadree photo={…} portraitSi="(max-width: 900px)" sizes="…" />
//
// `portraitSi` : la requête média sous laquelle la boîte est plus haute que
// large. Sans elle (ou si la photo n'a pas de 4:5), une seule image.
// `paysageSi` : son complément exact — il ne sert qu'au préchargement.
//
// ⚠️ `priority` + deux cadrages = DEUX PRÉCHARGEMENTS, écrits ici.
// React précharge de lui-même une <img> prioritaire, mais JAMAIS une image
// dans un <picture> (il ne sait pas quelle source le navigateur prendra).
// Sans préchargement, l'image LCP attend derrière la feuille de style et les
// scripts : mesuré sur /services/lumieres-de-noel-residentiel au téléphone
// (4G lente), LCP 2,75 s → 3,97 s. Chaque format a donc son
// <link rel="preload" media="…"> : le navigateur n'en suit qu'un.
// Écrits en JSX (React les remonte dans le <head>) et PAS par
// ReactDOM.preload(), qui jette `media` : les deux formats partaient alors
// ensemble, et un téléphone téléchargeait aussi l'image d'ordinateur.
// `sizesPortrait`, `quality` : pour alléger une image sous un voile (hero).
// Une photo SANS recadrage (toutes celles d'avant 2026) passe telle quelle :
// le composant rend alors exactement le <Image> qu'il remplace.
//
// Pas de hook : utilisable dans un composant serveur comme dans un composant
// client. Toujours en `fill` — la boîte parente porte la taille.
// =============================================================================
export default function PhotoCadree({
  photo, alt, sizes, priority = false, loading, portraitSi = null, paysageSi = null, format = "paysage",
  sizesPortrait = null, quality, className, style, draggable,
}) {
  if (!photo?.src) return null;
  const texte = alt ?? photo.alt ?? "";
  const principale = (format === "paysage" ? photo.paysage : format === "portrait" ? photo.portrait : null) || photo.src;
  const flou = flouDe(principale);
  const commun = {
    alt: texte, fill: true, sizes, quality, priority, loading: priority ? undefined : loading,
    placeholder: flou ? "blur" : "empty", blurDataURL: flou,
    className, draggable, style: { objectFit: "cover", ...style },
  };
  const haute = portraitSi && format === "paysage" && photo.portrait && photo.portrait !== principale ? photo.portrait : null;
  if (!haute) return <Image src={principale} {...commun} />;

  const taillesHaute = sizesPortrait || sizes;
  const { props: imgHaute } = getImageProps({ ...commun, sizes: taillesHaute, src: haute });
  const { props: img } = getImageProps({ ...commun, src: principale });
  const precharger = priority && paysageSi
    ? [[imgHaute, portraitSi], [img, paysageSi]].map(([i, media]) => (
        <link key={media} rel="preload" as="image" imageSrcSet={i.srcSet} imageSizes={i.sizes}
          media={media} fetchPriority="high" />
      ))
    : null;
  return (
    <>
      {/* Avant le <picture>, pas dedans : un <picture> ne contient que des
          <source> et son <img>. */}
      {precharger}
      <picture>
        <source media={portraitSi} srcSet={imgHaute.srcSet} sizes={taillesHaute} />
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img {...img} />
      </picture>
    </>
  );
}
