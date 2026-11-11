import Image from "next/image";
import { flouDe } from "@/components/photos-flou";
import { CULOT, VERRE, CENTRE, LOGO_CREME, geometrieAmpoule } from "@/lib/logo-ampoule";

// =============================================================================
// Le cadre « ampoule » — signature visuelle du site (2026-11-11)
// =============================================================================
// L'ampoule du logo sert de cadre : contour crème et culot exacts (tracés
// copiés du fichier du logo, lib/logo-ampoule.js), le S retiré, et une photo
// de l'équipe au travail DANS le verre. L'ampoule est inclinée ; la photo,
// elle, reste droite : seuls le masque et le contour tournent. Une lueur
// ambrée entoure le verre, comme si l'ampoule était allumée. Composant
// serveur, sans JavaScript.
//
//   <CadreAmpoule photo={PHOTOS["…"]} inclinaison={17} placement={…} />
//   <CadreAmpouleOffre photo={PHOTOS["…"]} fond="#0A1524" />   (les deux tailles)
//
// PLACEMENT de la photo dans le verre : { pxParUnite, x, y } = combien de
// pixels de la photo par unité du repère du logo, et où tombe son coin
// haut-gauche (unités, repère du logo, APRÈS inclinaison). Ces valeurs se
// CALCULENT (la photo couvre le verre ; tête et mains loin du contour) —
// voir l'entrée de la photo dans components/photos.js.
//
// ÉTALONNAGE (CSS, photo non retouchée) : plus sombre, pierre plus froide,
// marine dans les ombres, guirlandes chaudes.
//
// LA LUEUR respire lentement (opacité d'un calque composité, 5,6 s) — seule
// boucle autorisée hors démo des DEL (check-rien-ne-boucle.mjs,
// check-animations.mjs), demandée par Yahir le 2026-11-11. Coupée sous
// prefers-reduced-motion.
// =============================================================================

const r3 = (n) => Math.round(n * 1000) / 1000;
const r2 = (n) => Math.round(n * 100) / 100;

export default function CadreAmpoule({
  photo,
  inclinaison = 17,
  placement = photo.ampoule,
  placementMobile = null,
  fond = "#0A1524",
  sizes = "(max-width: 900px) 90vw, 640px",
  className = "",
}) {
  const { src, alt, largeur, hauteur } = photo;
  const { vb: VB, tout, culot } = geometrieAmpoule(inclinaison);
  const VIEWBOX = `${VB.x} ${VB.y} ${VB.w} ${VB.h}`;
  const ROTATION = `rotate(${inclinaison} ${CENTRE[0]} ${CENTRE[1]})`;
  const id = `ca${inclinaison}-` + src.replace(/[^a-z0-9]/gi, "").slice(-24);
  const flou = flouDe(src);
  // Repère et placement passés en variables CSS : la mise en page
  // (globals.css) en a besoin pour placer le culot et le haut de l'ampoule.
  const vars = {
    "--cadre-fond": fond,
    aspectRatio: `${VB.w} / ${VB.h}`,
    "--vb-x": VB.x, "--vb-y": VB.y, "--vb-w": VB.w, "--vb-h": VB.h,
    "--ampoule-haut": r2(tout.y0), "--ampoule-bas": r2(tout.y1), "--culot-droite": r2(culot.x1),
    "--photo-x": `${r3(((placement.x - VB.x) / VB.w) * 100)}%`,
    "--photo-y": `${r3(((placement.y - VB.y) / VB.h) * 100)}%`,
    "--photo-l": `${r3((largeur / placement.pxParUnite / VB.w) * 100)}%`,
  };
  // Cadrage propre au téléphone (ampoule plus petite : photo zoomée).
  const pm = placementMobile || placement;
  vars["--photo-x-m"] = `${r3(((pm.x - VB.x) / VB.w) * 100)}%`;
  vars["--photo-y-m"] = `${r3(((pm.y - VB.y) / VB.h) * 100)}%`;
  vars["--photo-l-m"] = `${r3((largeur / pm.pxParUnite / VB.w) * 100)}%`;
  return (
    <figure className={`cadre-ampoule ${className}`.trim()} style={vars}>
      {/* Le masque : le verre du logo, incliné, ramené au repère 0–1 de la
          boîte (objectBoundingBox) — il suit la boîte à toute taille. */}
      <svg className="cadre-ampoule__defs" width="0" height="0" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={`${id}-verre`} clipPathUnits="objectBoundingBox">
            <path transform={`scale(${1 / VB.w} ${1 / VB.h}) translate(${-VB.x} ${-VB.y}) ${ROTATION}`} d={VERRE.d} />
          </clipPath>
          <filter id={`${id}-flou`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
      </svg>
      <div className="cadre-ampoule__verre" style={{ clipPath: `url(#${id}-verre)` }}>
        <Image
          src={src}
          alt={alt}
          width={largeur}
          height={hauteur}
          sizes={sizes}
          placeholder={flou ? "blur" : "empty"}
          blurDataURL={flou}
          className="cadre-ampoule__photo"
        />
        <div className="cadre-ampoule__etalonnage" aria-hidden="true" />
      </div>
      {/* La lueur : le verre tracé en ambre, flouté. Son propre calque, pour
          que la respiration n'anime que l'opacité (composité). */}
      <svg className="cadre-ampoule__lueur" viewBox={VIEWBOX} aria-hidden="true" focusable="false">
        <g transform={ROTATION} filter={`url(#${id}-flou)`}>
          <path d={VERRE.d} fill="none" stroke="#F0BA54" strokeWidth="9" strokeOpacity="0.85" />
        </g>
      </svg>
      {/* Le contour du logo, à son épaisseur d'origine (mise à l'échelle). */}
      <svg className="cadre-ampoule__contour" viewBox={VIEWBOX} aria-hidden="true" focusable="false">
        <g transform={ROTATION} fill="none" stroke={LOGO_CREME}>
          {CULOT.map((c) => (
            <path key={c.d} d={c.d} strokeWidth={c.epaisseur} strokeLinecap="round" />
          ))}
          <path d={VERRE.d} strokeWidth={VERRE.epaisseur} strokeLinejoin="round" />
        </g>
      </svg>
    </figure>
  );
}

// Le cadre des sections « offre » (accueil + page commerciale) : l'ampoule
// debout (17°). Desktop : grand visuel à gauche du texte. Téléphone : petite,
// à droite du prix et du bouton, dans l'espace libre (globals.css), avec son
// propre cadrage zoomé sur l'installateur (`ampouleMobile`).
export function CadreAmpouleOffre({ photo, fond }) {
  return (
    <CadreAmpoule photo={photo} fond={fond} inclinaison={17} placement={photo.ampoule}
      placementMobile={photo.ampouleMobile} sizes="(max-width: 900px) 50vw, 640px" />
  );
}
