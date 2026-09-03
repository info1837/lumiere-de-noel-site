// Émission d'un événement vers les trois surfaces de mesure du site, sans
// jamais faire échouer l'appelant. Même trio que app/TelemetryClient.jsx
// (Meta Pixel, Google Ads/GA, Vercel Analytics), extrait ici pour que la
// calculatrice puisse s'en servir sans dupliquer le try/catch.
//
// ATTENTION — ce que ça mesure aujourd'hui : `META_PIXEL_ID` vaut encore
// "YOUR_PIXEL_ID" sur ce site et aucun gtag n'est chargé. Seul Vercel
// Analytics (`window.va`) reçoit donc réellement ces événements. Les deux
// autres se rebrancheront tout seuls le jour où les vrais identifiants
// seront posés — le code est déjà là.
export function evenement(nom, donnees = {}) {
  if (typeof window === "undefined") return;
  try { if (typeof window.fbq === "function") window.fbq("trackCustom", nom, donnees); } catch {}
  try { if (typeof window.gtag === "function") window.gtag("event", nom, donnees); } catch {}
  try { if (typeof window.va === "function") window.va("event", { name: nom, data: donnees }); } catch {}
}
