// Émission d'un événement vers les trois surfaces de mesure du site, sans
// jamais faire échouer l'appelant. Même trio que app/TelemetryClient.jsx
// (Meta Pixel, Google Ads/GA, Vercel Analytics), extrait ici pour que la
// calculatrice puisse s'en servir sans dupliquer le try/catch.
//
// Depuis le 2026-10-28, gtag est chargé (balise Google Ads, lib/google-ads.js) :
// ces événements y partent aussi, sans `send_to` — ce ne sont PAS des
// conversions. La seule conversion Google Ads est trackQuoteConversion().
export function evenement(nom, donnees = {}) {
  if (typeof window === "undefined") return;
  try { if (typeof window.fbq === "function") window.fbq("trackCustom", nom, donnees); } catch {}
  try { if (typeof window.gtag === "function") window.gtag("event", nom, donnees); } catch {}
  try { if (typeof window.va === "function") window.va("event", { name: nom, data: donnees }); } catch {}
}
