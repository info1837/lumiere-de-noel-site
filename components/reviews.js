// =============================================================================
// Témoignages / avis clients — placeholder tant qu'on n'a pas de vrais avis.
// -----------------------------------------------------------------------------
// Comportement :
//   - REVIEWS_PENDING = true  → aucun bloc témoignage ne s'affiche, aucun
//     aggregateRating JSON-LD n'est émis (Google pénalise les faux avis).
//   - REVIEWS_PENDING = false + reviews non vide → la section Testimonials
//     s'affiche et le JSON-LD LocalBusiness gagne aggregateRating + sameAs.
//
// Pour activer : basculer REVIEWS_PENDING à false et remplir reviews[].
// Chaque review : { name, city, rating (1-5), text, date (YYYY-MM-DD) }.
// =============================================================================

export const REVIEWS_PENDING = true;

// Vrais avis clients (nom + ville + citation courte). Vide tant que non collectés.
export const reviews = [];

// Note globale à émettre en JSON-LD (aggregateRating). Null tant que pas d'avis.
// Format : { value: 5.0, count: 12 }
export const aggregateRating = null;

// Comptes publics (Google Business Profile, Facebook, Instagram) — vont dans
// sameAs de LocalBusiness. Chaque URL doit être publique et accessible.
export const sameAs = [];

// Lien vers la fiche Google Business (pour afficher "voir tous nos avis").
export const googleReviewUrl = "";
