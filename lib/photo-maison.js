// =============================================================================
// Préparer la photo d'une façade avant de l'envoyer
// =============================================================================
// Deux pages s'en servent : le simulateur (ordinateur ou téléphone) et la page
// /simulateur/photo (téléphone, après un scan de QR). Une seule copie, parce
// que deux validations finissent toujours par divergir — et c'est la plus
// laxiste qui décide pour les deux.
//
// ⚠️ L'ORIENTATION EXIF EST LE PIÈGE PRINCIPAL ICI.
//
// Un iPhone tenu droit n'écrit PAS une image portrait : il écrit une image
// paysage plus une étiquette EXIF « tourne-la de 90° ». Dessiner ce bitmap
// dans un canvas sans lire l'étiquette donne une maison couchée sur le côté —
// et le modèle, qui ne sait pas que c'est un accident, allume consciencieuse-
// ment un toit vertical.
//
// `createImageBitmap(blob, { imageOrientation: 'from-image' })` applique
// l'étiquette avant de rendre le bitmap ; ses `width`/`height` sont alors
// celles de l'affichage. On le demande EXPLICITEMENT plutôt que de se fier au
// défaut : le défaut de la spécification a changé en 2021, et les navigateurs
// ne l'ont pas tous suivi au même moment. Un repli sans options couvre les
// Safari anciens, qui lèvent sur un deuxième argument qu'ils ne connaissent
// pas.

/**
 * 1280 px de large suffisent au modèle (mesuré) et ramènent une photo de
 * téléphone de 4 Mo à ~500 Ko. Sans ça, le base64 dépasse la limite de corps
 * de Vercel et l'envoi échoue APRÈS que le visiteur ait attendu.
 */
export const LARGEUR_MAX = 1280;

/**
 * Borne du fichier d'origine, AVANT décodage. 30 Mo laisse passer un 48 Mpx
 * d'iPhone et arrête un film qu'on aurait choisi par erreur dans la pellicule.
 */
export const FICHIER_MAX_OCTETS = 30 * 1024 * 1024;

/** Ce que le serveur accepte en sortie. Le canvas rend toujours du JPEG. */
export const SORTIE_TYPE = "image/jpeg";
export const SORTIE_QUALITE = 0.85;

const MESSAGES = {
  pas_une_image: "Ce fichier n'est pas une image. Choisissez une photo de votre façade.",
  fichier_trop_gros: "Ce fichier est trop lourd. Reprenez la photo, ou choisissez-en une autre.",
  illisible: "Nous n'arrivons pas à lire cette image. Essayez une photo JPEG ou PNG.",
};

/** Le message en français d'un refus. Jamais de détail technique. */
export const messagePhoto = (raison) => MESSAGES[raison] || MESSAGES.illisible;

/**
 * Décode le fichier en appliquant l'orientation EXIF.
 *
 * Le repli n'est pas décoratif : Safari < 15 lève un TypeError sur le second
 * argument. Sans lui, la page refuserait toute photo sur ces appareils — en
 * affichant « image illisible », ce qui serait faux.
 */
async function decoder(fichier) {
  try {
    return await createImageBitmap(fichier, { imageOrientation: "from-image" });
  } catch (e) {
    if (e instanceof TypeError) return await createImageBitmap(fichier);
    throw e;
  }
}

/**
 * Lit un fichier choisi par le visiteur et rend une data-URL JPEG bornée à
 * 1280 px, droite dans le bon sens.
 *
 * Ne lève jamais : rend `{ ok: false, raison, message }`.
 */
export async function preparerPhoto(fichier) {
  if (!fichier) return { ok: false, raison: "illisible", message: messagePhoto("illisible") };

  // `type` est parfois vide — certains sélecteurs Android ne le remplissent
  // pas. On ne refuse donc QUE ce qui s'annonce explicitement autre chose
  // qu'une image : refuser un type vide bloquerait de vraies photos.
  const type = String(fichier.type || "");
  if (type && !type.startsWith("image/")) {
    return { ok: false, raison: "pas_une_image", message: messagePhoto("pas_une_image") };
  }
  if (fichier.size > FICHIER_MAX_OCTETS) {
    return { ok: false, raison: "fichier_trop_gros", message: messagePhoto("fichier_trop_gros") };
  }

  let bitmap;
  try { bitmap = await decoder(fichier); }
  catch { return { ok: false, raison: "illisible", message: messagePhoto("illisible") }; }

  try {
    const ratio = Math.min(1, LARGEUR_MAX / bitmap.width);
    const l = Math.max(1, Math.round(bitmap.width * ratio));
    const h = Math.max(1, Math.round(bitmap.height * ratio));
    const toile = document.createElement("canvas");
    toile.width = l; toile.height = h;
    toile.getContext("2d").drawImage(bitmap, 0, 0, l, h);
    const dataUrl = toile.toDataURL(SORTIE_TYPE, SORTIE_QUALITE);
    return { ok: true, dataUrl, largeur: l, hauteur: h };
  } catch {
    return { ok: false, raison: "illisible", message: messagePhoto("illisible") };
  } finally {
    bitmap.close?.();
  }
}

/**
 * Est-on sur un appareil qui a un appareil photo sous la main ?
 *
 * Deux signaux, pas un. L'`userAgent` seul rate les tablettes Android récentes
 * qui s'annoncent en « Linux », et `pointer: coarse` seul attrape un écran
 * tactile d'ordinateur portable — où « prenez-la avec votre cellulaire » reste
 * la bonne offre. Il faut donc un pointeur grossier ET un écran étroit, OU un
 * userAgent qui le dit franchement.
 *
 * ⚠️ À appeler dans un effet, jamais au rendu : au rendu serveur il n'y a ni
 * `navigator` ni `matchMedia`, et une réponse différente des deux côtés casse
 * l'hydratation.
 */
export function estUnMobile() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const grossier = window.matchMedia?.("(pointer: coarse)")?.matches === true;
  const etroit = window.innerWidth < 900;
  const ua = /Android|iPhone|iPad|iPod|Mobile|Silk/i.test(navigator.userAgent || "");
  // iPadOS 13+ s'annonce « Macintosh » : on le reconnaît à son écran tactile.
  const ipadDeguise = /Macintosh/.test(navigator.userAgent || "") && (navigator.maxTouchPoints || 0) > 1;
  return (grossier && etroit) || ua || ipadDeguise;
}
