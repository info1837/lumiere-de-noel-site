// Les UTM du visiteur, retenus le temps de la visite.
//
// POURQUOI UN STOCKAGE, ET PAS UNE LECTURE À L'ENVOI.
//
// Le code QR de l'accroche-porte mène à `/?utm_campaign=voisin_2026`.
// Le visiteur atterrit sur l'accueil, lit deux sections, clique
// « Soumission » — et l'URL ne porte plus rien. Lire `location.search`
// au moment du formulaire rendrait donc vide, et la campagne qui a
// payé le carton ne serait créditée nulle part.
//
// `sessionStorage` : la durée d'une visite, exactement ce qu'on veut.
// `localStorage` attribuerait à « voisin_2026 » une demande faite trois
// semaines plus tard, après une pub Facebook.

const CLE = 'lum_utm';
const CHAMPS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

function accessible() {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return false;
    // Navigation privée, stockage bloqué, aperçu : l'accès LÈVE au lieu
    // de rendre null. Sans ce test, le formulaire entier tomberait.
    window.sessionStorage.getItem(CLE);
    return true;
  } catch { return false; }
}

/**
 * À appeler une fois au chargement. N'ÉCRASE RIEN si l'URL courante ne
 * porte aucun UTM : sinon le premier clic interne effacerait la
 * campagne d'arrivée.
 */
export function capturerUtm() {
  if (typeof window === 'undefined') return {};
  let trouves = {};
  try {
    const p = new URLSearchParams(window.location.search);
    for (const c of CHAMPS) {
      const v = (p.get(c) || '').trim();
      if (v) trouves[c] = v.slice(0, 120);
    }
  } catch { return lireUtm(); }

  if (!Object.keys(trouves).length) return lireUtm();

  // La page d'arrivée : savoir que « voisin_2026 » est entré par
  // l'accueil et pas par une page de service aide à lire les chiffres.
  try { trouves.landing = window.location.pathname.slice(0, 120); } catch {}

  if (accessible()) {
    try { window.sessionStorage.setItem(CLE, JSON.stringify(trouves)); } catch {}
  }
  return trouves;
}

/** Ce qu'on a retenu de cette visite. Toujours un objet, jamais null. */
export function lireUtm() {
  if (!accessible()) return {};
  try {
    const v = JSON.parse(window.sessionStorage.getItem(CLE) || '{}');
    return v && typeof v === 'object' ? v : {};
  } catch { return {}; }
}
