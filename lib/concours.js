// Concours « Gagnez votre installation 2026 » — SOURCE UNIQUE côté site.
//
// ⚠️ Ces valeurs DOIVENT rester alignées sur la config du CRM
// (palencia-crm `lib/concours-2026.js`, CONFIG_DEFAUT / VILLES_CONCOURS /
// VALEUR_PRIX). Une date change des deux côtés en même temps, et dans le
// texte du règlement (app/concours/reglement.jsx), qui les lit d'ici.

/** Fin des inscriptions : 5 novembre 2026, 23 h 59 HE (après le retour à l'heure normale : -05:00). */
export const FIN_INSCRIPTIONS = "2026-11-05T23:59:00-05:00";
export const FIN_TEXTE = "jeudi 5 novembre 2026 à 23 h 59 (heure de l'Est)";
export const TIRAGE_TEXTE = "vendredi 6 novembre 2026";
export const TIRAGE_COURT = "6 novembre";
export const RABAIS_AVANT = "6 novembre 2026"; // réservation faite AVANT cette date (règlement)
export const INSTALLATION_AVANT = "20 novembre 2026";
export const VALEUR_PRIX = "1 000 $";
export const VILLES_CONCOURS = ["Blainville", "Sainte-Thérèse", "Rosemère", "Boisbriand"];
export const CHOIX_ILLUMINER = ["Toiture", "Fenêtres", "Arbres", "Entrée", "Autre"];

const cleVille = (v) => String(v || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/\bste?\b\.?/g, "sainte").replace(/[^a-z]+/g, "");

/** « ste-therese » → « Sainte-Thérèse » ; une ville hors concours → null. Même règle que le CRM. */
export function villeConcours(ville) {
  const k = cleVille(ville);
  if (!k) return null;
  return VILLES_CONCOURS.find((v) => cleVille(v) === k) || null;
}

/** Numéro civique + rue — la même règle que le CRM (« 1295-B boul. Curé-Labelle »). */
export function adresseComplete(adresse) {
  return /^\s*\d{1,6}(?:-?[a-z])?(?:[-\s]\d{1,5}[a-z]?)?\s*,?\s+[^\d\s,][^,]{2,}/i.test(String(adresse || ""));
}

/** « 4505550101 » → « (450) 555-0101 », au fil de la frappe. */
export function formaterTelephone(brut) {
  let d = String(brut || "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  d = d.slice(0, 10);
  if (d.length < 4) return d.length ? `(${d}` : "";
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
